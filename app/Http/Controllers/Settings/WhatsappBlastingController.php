<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\User;
use App\Models\Warehouse;
use App\Models\WhatsappLog;
use App\Services\EvolutionApiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Inertia\Inertia;
use Inertia\Response;

class WhatsappBlastingController extends Controller
{
    public function index(): Response
    {
        $users = User::query()
            ->select('id', 'name', 'phone', 'avatar', 'role_id', 'warehouse_id')
            ->with([
                'role:id,name,rank',
                'warehouse:id,name,code,file_path,is_active',
            ])
            ->orderBy('name')
            ->get()
            ->map(function (User $user) {
                $phone = is_string($user->phone) ? trim($user->phone) : '';

                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'phone' => $user->phone,
                    'avatar' => $user->avatar,
                    'role_id' => $user->role_id,
                    'role_name' => $user->role?->name,
                    'warehouse_id' => $user->warehouse_id,
                    'warehouse_name' => $user->warehouse?->name,
                    'has_phone' => $phone !== '',
                ];
            })
            ->values();

        $roles = Role::query()
            ->select('id', 'name', 'rank')
            ->orderBy('rank')
            ->orderBy('name')
            ->get();

        $warehouses = Warehouse::query()
            ->select('id', 'name', 'code', 'file_path', 'is_active')
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        $blastHistory = WhatsappLog::query()
            ->where('keyword', 'like', '%targeted_whatsapp%')
            ->orderByDesc('created_at')
            ->limit(100)
            ->get(['id', 'sender', 'sender_name', 'type', 'keyword', 'message', 'payload', 'http_status', 'created_at'])
            ->map(function (WhatsappLog $log) {
                return [
                    'id'               => $log->id,
                    'sender'           => $log->sender,
                    'type'             => $log->type,
                    'keyword'          => $log->keyword,
                    'message'          => $log->message,
                    'http_status'      => $log->http_status,
                    'is_success'       => $log->type === 'outgoing',
                    'target_user_name' => $log->payload['target_user_name'] ?? null,
                    'attachment_name'  => $log->payload['attachment_name'] ?? null,
                    'attachment_type'  => $log->payload['attachment_media_type'] ?? null,
                    'source'           => $log->payload['source'] ?? null,
                    'created_at'       => $log->created_at?->format('d/m/Y H:i'),
                ];
            })
            ->values();

        return Inertia::render('settings/whatsapp-blasting', [
            'users'         => $users,
            'roles'         => $roles,
            'warehouses'    => $warehouses,
            'blast_history' => $blastHistory,
        ]);
    }

    public function sendTargeted(Request $request, EvolutionApiService $whatsapp): JsonResponse
    {
        $validated = $request->validate([
            'target_user_ids' => ['required', 'array', 'min:1'],
            'target_user_ids.*' => ['integer', 'exists:users,id'],
            'title' => ['required', 'string', 'max:120'],
            'message' => ['required', 'string', 'max:2000'],
            'type' => ['nullable', 'string', 'max:80'],
            'attachment_delivery_mode' => ['nullable', 'in:single_combined,separate'],
            'attachments' => ['nullable', 'array'],
            'attachments.*' => ['file', 'max:10240', 'mimes:jpg,jpeg,png,webp,pdf,doc,docx,xls,xlsx,ppt,pptx,txt'],
        ]);

        $targetUserIds = collect($validated['target_user_ids'])
            ->map(fn ($id) => (int) $id)
            ->filter()
            ->unique()
            ->values();

        if ($targetUserIds->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'Target user tidak valid.',
                'sent' => 0,
                'failed' => 0,
                'recipient_count' => 0,
                'skipped_no_phone' => 0,
            ], 422);
        }

        $targetUsers = User::query()
            ->select('id', 'name', 'phone')
            ->whereIn('id', $targetUserIds)
            ->get();

        $textBody = $this->composeWhatsappBody(
            (string) $validated['title'],
            (string) $validated['message']
        );
        $type = $validated['type'] ?? 'targeted_whatsapp';
        $attachments = collect($request->file('attachments', []))
            ->filter(fn ($file) => $file instanceof UploadedFile)
            ->values();
        $requestedDeliveryMode = $validated['attachment_delivery_mode'] ?? 'single_combined';
        $effectiveDeliveryMode = $attachments->count() === 1 && $requestedDeliveryMode === 'single_combined'
            ? 'single_combined'
            : 'separate';

        $sent = 0;
        $failed = 0;
        $skippedNoPhone = 0;

        foreach ($targetUsers as $user) {
            $normalizedPhone = $this->normalizePhoneNumber($user->phone);

            if ($normalizedPhone === null) {
                $skippedNoPhone++;
                continue;
            }

            $baseMeta = [
                'type' => $type,
                'source' => 'settings_whatsapp_blasting',
                'target_user_id' => $user->id,
                'target_user_name' => $user->name,
                'attachment_delivery_mode' => $effectiveDeliveryMode,
                'attachment_count' => $attachments->count(),
            ];

            if ($attachments->isEmpty()) {
                $result = $whatsapp->sendText(
                    $normalizedPhone,
                    $textBody,
                    200,
                    true,
                    $baseMeta
                );

                if (($result['success'] ?? false) === true) {
                    $sent++;
                    continue;
                }

                $failed++;
                continue;
            }

            if ($effectiveDeliveryMode === 'single_combined') {
                /** @var UploadedFile $attachment */
                $attachment = $attachments->first();

                $result = $whatsapp->sendMedia(
                    $normalizedPhone,
                    $attachment->getRealPath(),
                    $textBody,
                    $this->resolveAttachmentMediaType($attachment),
                    array_merge($baseMeta, [
                        'delay' => 250,
                        'file_name' => $attachment->getClientOriginalName(),
                        'attachment_name' => $attachment->getClientOriginalName(),
                        'attachment_media_type' => $this->resolveAttachmentMediaType($attachment),
                    ])
                );

                if (($result['success'] ?? false) === true) {
                    $sent++;
                    continue;
                }

                $failed++;
                continue;
            }

            $textResult = $whatsapp->sendText(
                $normalizedPhone,
                $textBody,
                200,
                true,
                $baseMeta
            );

            if (($textResult['success'] ?? false) !== true) {
                $failed++;
                continue;
            }

            $allAttachmentsSent = true;

            foreach ($attachments as $index => $attachment) {
                $mediaType = $this->resolveAttachmentMediaType($attachment);
                $mediaResult = $whatsapp->sendMedia(
                    $normalizedPhone,
                    $attachment->getRealPath(),
                    '',
                    $mediaType,
                    array_merge($baseMeta, [
                        'delay' => 250,
                        'file_name' => $attachment->getClientOriginalName(),
                        'attachment_name' => $attachment->getClientOriginalName(),
                        'attachment_media_type' => $mediaType,
                        'attachment_index' => $index + 1,
                    ])
                );

                if (($mediaResult['success'] ?? false) !== true) {
                    $allAttachmentsSent = false;
                    break;
                }
            }

            if ($allAttachmentsSent) {
                $sent++;
                continue;
            }

            $failed++;
        }

        $recipientCount = $targetUsers->count() - $skippedNoPhone;

        return response()->json([
            'success' => $sent > 0,
            'message' => $sent > 0
                ? "WhatsApp terkirim {$sent}, gagal {$failed}, tanpa nomor {$skippedNoPhone}."
                : 'WhatsApp belum terkirim. Pastikan user memiliki nomor telepon valid.',
            'sent' => $sent,
            'failed' => $failed,
            'recipient_count' => max($recipientCount, 0),
            'skipped_no_phone' => $skippedNoPhone,
        ], $sent > 0 ? 200 : 422);
    }

    private function normalizePhoneNumber(?string $phone): ?string
    {
        if (!is_string($phone)) {
            return null;
        }

        $digits = preg_replace('/\D+/', '', trim($phone)) ?? '';

        if ($digits === '') {
            return null;
        }

        if (str_starts_with($digits, '0')) {
            $digits = '62' . substr($digits, 1);
        }

        if (!str_starts_with($digits, '62')) {
            return null;
        }

        if (strlen($digits) < 10 || strlen($digits) > 15) {
            return null;
        }

        return $digits;
    }

    private function resolveAttachmentMediaType(UploadedFile $file): string
    {
        $mimeType = $file->getMimeType() ?? '';

        return str_starts_with($mimeType, 'image/') ? 'image' : 'document';
    }

    private function composeWhatsappBody(string $title, string $message): string
    {
        $cleanTitle = trim($title);
        $cleanMessage = trim($message);

        if ($cleanTitle === '') {
            return $cleanMessage;
        }

        if ($cleanMessage === '') {
            return '*' . $cleanTitle . '*';
        }

        return '*' . $cleanTitle . '*' . "\n\n" . $cleanMessage;
    }
}
