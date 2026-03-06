<?php

namespace App\Http\Controllers;

use App\Models\Announcement;
use App\Models\UserDeviceToken;
use App\Models\UserNotification;
use App\Services\FcmPushService;
use DOMDocument;
use DOMElement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Mews\Purifier\Facades\Purifier;
use Inertia\Inertia;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $notifications = UserNotification::query()
            ->where('user_id', $user->id)
            ->visible()
            ->latest()
            ->paginate(20)
            ->through(function (UserNotification $notification) {
                return [
                    'id' => $notification->id,
                    'type' => $notification->type,
                    'title' => $notification->title,
                    'message' => $notification->message,
                    'data' => $notification->data,
                    'action_url' => $notification->safe_action_url,
                    'status' => $notification->status,
                    'channel' => $notification->channel,
                    'priority' => $notification->priority,
                    'expires_at' => $notification->expires_at?->toISOString(),
                    'read_at' => $notification->read_at?->toISOString(),
                    'sent_at' => $notification->sent_at?->toISOString(),
                    'created_at' => $notification->created_at?->toISOString(),
                ];
            });

        $unreadCount = UserNotification::query()
            ->where('user_id', $user->id)
            ->visible()
            ->where('status', UserNotification::STATUS_UNREAD)
            ->count();

        return Inertia::render('notifications', [
            'notifications' => $notifications,
            'unreadCount' => $unreadCount,
        ]);
    }

    public function markAsRead(Request $request, UserNotification $notification)
    {
        $user = $request->user();

        $this->markNotificationAsRead($notification, $user->id);

        return back();
    }

    public function markAsReadFromLink(Request $request, UserNotification $notification)
    {
        $user = $request->user();

        if ($notification->user_id != $user->id) {
            return redirect()
                ->to('/notifications')
                ->with('warning', 'Notifikasi tidak ditemukan atau tidak dapat diakses.');
        }

        $this->markNotificationAsRead($notification, $user->id);

        $redirectUrl = '/notifications';

        if (is_string($notification->safe_action_url) && $notification->safe_action_url !== '') {
            $redirectUrl = $notification->safe_action_url;
        }

        return redirect()->to($redirectUrl);
    }

    public function markAllAsRead(Request $request)
    {
        $user = $request->user();

        UserNotification::query()
            ->where('user_id', $user->id)
            ->visible()
            ->where('status', UserNotification::STATUS_UNREAD)
            ->update([
                'status' => UserNotification::STATUS_READ,
                'read_at' => now(),
            ]);

        return back()->with('success', 'Semua notifikasi ditandai sudah dibaca.');
    }

    public function markAsUnread(Request $request, UserNotification $notification)
    {
        $user = $request->user();

        $this->markNotificationAsUnread($notification, $user->id);

        return back();
    }

    public function storeDeviceToken(Request $request)
    {
        $user = $request->user();

        try {
            $validated = $request->validate([
                'platform' => ['required', 'in:android,ios,web'],
                'token' => ['required', 'string', 'max:500'], // Increase limit for FCM tokens
            ]);

            Log::info('Registering device token', [
                'user_id' => $user->id,
                'platform' => $validated['platform'],
                'token_length' => strlen($validated['token']),
            ]);

            $deviceToken = UserDeviceToken::query()->updateOrCreate(
                ['token' => $validated['token']],
                [
                    'user_id' => $user->id,
                    'platform' => $validated['platform'],
                    'is_active' => true,
                    'last_used_at' => now(),
                ]
            );

            // Ensure token belongs to current user
            if ($deviceToken->user_id != $user->id) {
                $deviceToken->update(['user_id' => $user->id]);
            }

            Log::info('Device token registered successfully', [
                'device_token_id' => $deviceToken->id,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Device token berhasil tersimpan.',
                'data' => [
                    'id' => $deviceToken->id,
                    'platform' => $deviceToken->platform,
                    'is_active' => $deviceToken->is_active,
                    'last_used_at' => $deviceToken->last_used_at?->toISOString(),
                ],
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('Device token validation failed', [
                'errors' => $e->errors(),
                'request' => $request->all(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal: ' . implode(', ', $e->validator->errors()->all()),
                'errors' => $e->errors(),
            ], 422);
        } catch (\Throwable $e) {
            Log::error('Failed to register device token', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Gagal menyimpan token: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function deviceTokenStatus(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'platform' => ['required', 'in:android,ios,web'],
        ]);

        $isEnabled = UserDeviceToken::query()
            ->where('user_id', $user->id)
            ->where('platform', $validated['platform'])
            ->where('is_active', true)
            ->exists();

        return response()->json([
            'success' => true,
            'enabled' => $isEnabled,
        ]);
    }

    public function deactivateDeviceToken(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'platform' => ['required', 'in:android,ios,web'],
            'token' => ['nullable', 'string', 'max:500'],
        ]);

        $query = UserDeviceToken::query()
            ->where('user_id', $user->id)
            ->where('platform', $validated['platform'])
            ->where('is_active', true);

        if (!empty($validated['token'])) {
            $query->where('token', $validated['token']);
        }

        $updatedCount = $query->update([
            'is_active' => false,
            'last_used_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => $updatedCount > 0
                ? 'Push notification berhasil dinonaktifkan.'
                : 'Tidak ada token aktif yang perlu dinonaktifkan.',
            'updated' => $updatedCount,
        ]);
    }

    public function sendTargetedPush(Request $request, FcmPushService $fcmPushService)
    {
        $validated = $request->validate([
            'target_user_ids' => ['required', 'array', 'min:1'],
            'target_user_ids.*' => ['integer', 'exists:users,id'],
            'title' => ['required', 'string', 'max:120'],
            'message' => ['required', 'string', 'max:500'],
            'announcement_title' => ['nullable', 'string', 'max:180'],
            'announcement_content' => ['nullable', 'string'],
            'priority' => ['nullable', 'in:low,normal,high'],
            'type' => ['nullable', 'string', 'max:80'],
            'action_url' => ['nullable', 'string', 'max:255', 'regex:/^\/[^\s]*$/'],
            'data' => ['nullable', 'array'],
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
                'skipped_no_token' => 0,
            ], 422);
        }

        $eligibleUserIds = UserDeviceToken::query()
            ->whereIn('user_id', $targetUserIds)
            ->where('is_active', true)
            ->whereNotNull('token')
            ->where('token', '!=', '')
            ->distinct()
            ->pluck('user_id')
            ->map(fn ($id) => (int) $id)
            ->values();

        if ($eligibleUserIds->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'Tidak ada target user dengan token device aktif.',
                'sent' => 0,
                'failed' => 0,
                'recipient_count' => 0,
                'skipped_no_token' => $targetUserIds->count(),
            ], 422);
        }

        $skippedNoToken = max($targetUserIds->count() - $eligibleUserIds->count(), 0);

        $type = $validated['type'] ?? 'targeted_push';
        $priority = $validated['priority'] ?? UserNotification::PRIORITY_NORMAL;
        $requestedActionUrl = isset($validated['action_url']) && is_string($validated['action_url'])
            ? trim($validated['action_url'])
            : '';
        $announcementContent = isset($validated['announcement_content']) && is_string($validated['announcement_content'])
            ? $this->sanitizeAnnouncementHtml($validated['announcement_content'])
            : '';
        $announcement = null;

        if ($announcementContent !== '') {
            $announcement = Announcement::create([
                'title' => isset($validated['announcement_title']) && is_string($validated['announcement_title']) && trim($validated['announcement_title']) !== ''
                    ? trim($validated['announcement_title'])
                    : trim($validated['title']),
                'content_html' => $announcementContent,
                'created_by' => $request->user()?->id,
            ]);
        }

        $actionUrl = $requestedActionUrl !== ''
            ? $requestedActionUrl
            : ($announcement ? '/announcements/' . $announcement->id : '/notifications');
        $extraData = is_array($validated['data'] ?? null) ? $validated['data'] : [];

        if ($announcement) {
            $extraData['announcement_id'] = (string) $announcement->id;
        }

        $totalSent = 0;
        $totalFailed = 0;
        $totalTargetDevices = 0;

        foreach ($eligibleUserIds as $targetUserId) {
            $notification = UserNotification::create([
                'user_id' => (int) $targetUserId,
                'announcement_id' => $announcement?->id,
                'type' => $type,
                'title' => $validated['title'],
                'message' => $validated['message'],
                'data' => $extraData,
                'status' => UserNotification::STATUS_UNREAD,
                'channel' => UserNotification::CHANNEL_PUSH,
                'priority' => $priority,
                'action_url' => $actionUrl,
                'sent_at' => now(),
            ]);

            $result = $fcmPushService->sendUserNotification($notification);
            $totalSent += (int) ($result['sent'] ?? 0);
            $totalFailed += (int) ($result['failed'] ?? 0);
            $totalTargetDevices += (int) ($result['target_device_count'] ?? 0);
        }

        return response()->json([
            'success' => $totalSent > 0,
            'message' => $totalSent > 0
                ? "Push ditargetkan ke {$totalTargetDevices} perangkat, terkirim {$totalSent}, gagal {$totalFailed}, tanpa token {$skippedNoToken}."
                : 'Push belum terkirim. Pastikan token device user aktif.',
            'sent' => $totalSent,
            'failed' => $totalFailed,
            'target_device_count' => $totalTargetDevices,
            'recipient_count' => $eligibleUserIds->count(),
            'skipped_no_token' => $skippedNoToken,
        ], $totalSent > 0 ? 200 : 422);
    }

    private function sanitizeAnnouncementHtml(string $html): string
    {
        $candidateHtml = $html;
        $containsDataImage = preg_match('/<img[^>]+src=["\']\s*data:image\//i', $html) === 1;

        try {
            $candidateHtml = Purifier::clean($html, [
                'HTML.Allowed' => 'p,br,strong,b,em,i,u,a[href|target|rel],ul,ol,li,h1,h2,h3,h4,h5,h6,blockquote,img[src|alt|title],span,div',
                'Attr.AllowedFrameTargets' => ['_blank'],
                'AutoFormat.RemoveEmpty' => false,
                'URI.SafeDataURI' => true,
                'URI.AllowedSchemes' => [
                    'http' => true,
                    'https' => true,
                    'data' => true,
                ],
            ]);

            if ($containsDataImage && preg_match('/<img[^>]+src=["\']\s*data:image\//i', $candidateHtml) !== 1) {
                Log::info('Purifier menghapus data image URI, menggunakan sanitizer internal untuk mempertahankan gambar aman.');
                $candidateHtml = $html;
            }
        } catch (\Throwable $exception) {
            Log::warning('Purifier sanitize gagal, fallback ke sanitizer internal.', [
                'error' => $exception->getMessage(),
            ]);
        }

        $allowedTags = [
            'p', 'br', 'strong', 'b', 'em', 'i', 'u', 'a', 'ul', 'ol', 'li',
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'img', 'span', 'div',
        ];

        $allowedAttributes = [
            'a' => ['href', 'target', 'rel'],
            'img' => ['src', 'alt', 'title'],
        ];

        $document = new DOMDocument();
        $previousLibxmlState = libxml_use_internal_errors(true);

        $wrappedHtml = '<div id="announcement-root">' . $candidateHtml . '</div>';
        $document->loadHTML('<?xml encoding="utf-8" ?>' . $wrappedHtml, LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD);
        libxml_clear_errors();
        libxml_use_internal_errors($previousLibxmlState);

        $root = $document->getElementById('announcement-root');
        if (!$root instanceof DOMElement) {
            return '';
        }

        $this->sanitizeNodeRecursively($root, $allowedTags, $allowedAttributes);

        $sanitizedParts = [];
        foreach ($root->childNodes as $childNode) {
            $sanitizedParts[] = $document->saveHTML($childNode) ?: '';
        }

        $sanitized = trim(implode('', $sanitizedParts));
        $textOnly = trim(preg_replace('/\s+/', ' ', strip_tags($sanitized)) ?? '');

        if ($textOnly === '' && !preg_match('/<img\b/i', $sanitized)) {
            return '';
        }

        return $sanitized;
    }

    private function sanitizeNodeRecursively(DOMElement $node, array $allowedTags, array $allowedAttributes): void
    {
        for ($index = $node->childNodes->length - 1; $index >= 0; $index--) {
            $child = $node->childNodes->item($index);

            if (!$child instanceof DOMElement) {
                continue;
            }

            $tagName = strtolower($child->tagName);

            if (!in_array($tagName, $allowedTags, true)) {
                $node->removeChild($child);
                continue;
            }

            $allowedForTag = $allowedAttributes[$tagName] ?? [];
            for ($attrIndex = $child->attributes->length - 1; $attrIndex >= 0; $attrIndex--) {
                $attribute = $child->attributes->item($attrIndex);
                if (!$attribute) {
                    continue;
                }

                $attributeName = strtolower($attribute->nodeName);
                if (!in_array($attributeName, $allowedForTag, true)) {
                    $child->removeAttribute($attributeName);
                    continue;
                }

                if ($tagName === 'a' && $attributeName === 'href') {
                    $href = trim($attribute->nodeValue ?? '');
                    if ($href === '' || preg_match('/^\s*javascript:/i', $href)) {
                        $child->removeAttribute('href');
                    }
                }

                if ($tagName === 'img' && $attributeName === 'src') {
                    $src = trim($attribute->nodeValue ?? '');
                    $isSafeDataImage = preg_match('/^data:image\/(png|jpeg|jpg|gif|webp);base64,/i', $src) === 1;
                    $isSafeHttpImage = preg_match('/^https?:\/\//i', $src) === 1;

                    if (!$isSafeDataImage && !$isSafeHttpImage) {
                        $child->removeAttribute('src');
                    }
                }
            }

            $this->sanitizeNodeRecursively($child, $allowedTags, $allowedAttributes);
        }
    }

    private function markNotificationAsRead(UserNotification $notification, int $userId): void
    {
        if ($notification->user_id != $userId) {
            abort(403, 'Anda tidak memiliki akses untuk notifikasi ini.');
        }

        if ($notification->status == UserNotification::STATUS_UNREAD) {
            $notification->update([
                'status' => UserNotification::STATUS_READ,
                'read_at' => now(),
            ]);
        }
    }

    private function markNotificationAsUnread(UserNotification $notification, int $userId): void
    {
        if ($notification->user_id != $userId) {
            abort(403, 'Anda tidak memiliki akses untuk notifikasi ini.');
        }

        if ($notification->status == UserNotification::STATUS_READ) {
            $notification->update([
                'status' => UserNotification::STATUS_UNREAD,
                'read_at' => null,
            ]);
        }
    }
}
