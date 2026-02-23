<?php

namespace App\Http\Controllers;

use App\Models\UserDeviceToken;
use App\Models\UserNotification;
use App\Services\FcmPushService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class SalesNotificationController extends Controller
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
                    'action_url' => $notification->action_url,
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

        return Inertia::render('sales/notifications', [
            'notifications' => $notifications,
            'unreadCount' => $unreadCount,
        ]);
    }

    public function markAsRead(Request $request, UserNotification $notification)
    {
        $user = $request->user();

        if ($notification->user_id !== $user->id) {
            abort(403, 'Anda tidak memiliki akses untuk notifikasi ini.');
        }

        if ($notification->status === UserNotification::STATUS_UNREAD) {
            $notification->update([
                'status' => UserNotification::STATUS_READ,
                'read_at' => now(),
            ]);
        }

        return back();
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
            if ($deviceToken->user_id !== $user->id) {
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

    public function sendTestPush(Request $request, FcmPushService $fcmPushService)
    {
        $user = $request->user();

        $validated = $request->validate([
            'title' => ['nullable', 'string', 'max:120'],
            'message' => ['nullable', 'string', 'max:500'],
            'priority' => ['nullable', 'in:low,normal,high'],
        ]);

        try {
            $notification = UserNotification::create([
                'user_id' => $user->id,
                'type' => 'test_push',
                'title' => $validated['title'] ?? 'Tes Push Notifikasi',
                'message' => $validated['message'] ?? 'Push notifikasi test dari sistem berhasil dibuat.',
                'status' => UserNotification::STATUS_UNREAD,
                'channel' => UserNotification::CHANNEL_PUSH,
                'priority' => $validated['priority'] ?? UserNotification::PRIORITY_HIGH,
                'action_url' => '/sales/notifications',
                'sent_at' => now(),
            ]);

            $result = $fcmPushService->sendUserNotification($notification);

            if (($result['sent'] ?? 0) === 0) {
                return back()->with('warning', $result['message'] ?? 'Push belum terkirim. Pastikan token device sudah terdaftar.');
            }

            return back()->with('success', $result['message'] ?? 'Push notifikasi berhasil dikirim.');
        } catch (\Throwable $e) {
            Log::error('Error saat mengirim test push', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return back()->with('error', 'Terjadi kesalahan: ' . $e->getMessage());
        }
    }
}
