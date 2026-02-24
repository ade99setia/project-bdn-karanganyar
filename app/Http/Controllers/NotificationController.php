<?php

namespace App\Http\Controllers;

use App\Models\UserDeviceToken;
use App\Models\UserNotification;
use App\Services\FcmPushService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
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

    public function sendTestPush(Request $request, FcmPushService $fcmPushService)
    {
        $user = $request->user();

        $validated = $request->validate([
            'title' => ['nullable', 'string', 'max:120'],
            'message' => ['nullable', 'string', 'max:500'],
            'priority' => ['nullable', 'in:low,normal,high'],
            'scope' => ['nullable', 'in:self,all_users'],
        ]);

        $scope = (string) ($validated['scope'] ?? 'self');

        try {
            if ($scope === 'all_users') {
                // if ($user->role_name !== 'admin') {
                //     return back()->with('error', 'Hanya admin yang dapat mengirim test push ke semua user.');
                // }

                $targetUserIds = UserDeviceToken::query()
                    ->where('is_active', true)
                    ->distinct()
                    ->pluck('user_id')
                    ->filter()
                    ->values();

                if ($targetUserIds->isEmpty()) {
                    return back()->with('warning', 'Tidak ada user dengan device token aktif.');
                }

                $totalSent = 0;
                $totalFailed = 0;

                foreach ($targetUserIds as $targetUserId) {
                    $notification = UserNotification::create([
                        'user_id' => (int) $targetUserId,
                        'type' => 'test_push',
                        'title' => $validated['title'] ?? 'Tes Push Notifikasi',
                        'message' => $validated['message'] ?? 'Push notifikasi test dari admin berhasil dibuat.',
                        'status' => UserNotification::STATUS_UNREAD,
                        'channel' => UserNotification::CHANNEL_PUSH,
                        'priority' => $validated['priority'] ?? UserNotification::PRIORITY_HIGH,
                        'action_url' => '/notifications',
                        'sent_at' => now(),
                    ]);

                    $result = $fcmPushService->sendUserNotification($notification);
                    $totalSent += (int) ($result['sent'] ?? 0);
                    $totalFailed += (int) ($result['failed'] ?? 0);
                }

                if ($totalSent === 0) {
                    return back()->with('warning', 'Push ke semua user belum terkirim. Pastikan token device aktif tersedia.');
                }

                return back()->with(
                    'success',
                    "Push test broadcast terkirim {$totalSent} perangkat, gagal {$totalFailed}."
                );
            }

            $notification = UserNotification::create([
                'user_id' => $user->id,
                'type' => 'test_push',
                'title' => $validated['title'] ?? 'Tes Push Notifikasi',
                'message' => $validated['message'] ?? 'Push notifikasi test dari sistem berhasil dibuat.',
                'status' => UserNotification::STATUS_UNREAD,
                'channel' => UserNotification::CHANNEL_PUSH,
                'priority' => $validated['priority'] ?? UserNotification::PRIORITY_HIGH,
                'action_url' => '/notifications',
                'sent_at' => now(),
            ]);

            $result = $fcmPushService->sendUserNotification($notification);

            if (($result['sent'] ?? 0) == 0) {
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
