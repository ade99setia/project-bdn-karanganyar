<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\UserNotification;
use App\Models\User;
use App\Models\Warehouse;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class NotificationManagementController extends Controller
{
    public function index(Request $request): Response
    {
        $rawNotificationType = (string) $request->input('notification_type', 'manual_targeted');
        $selectedNotificationTypes = collect(explode(',', $rawNotificationType))
            ->map(fn ($type) => trim((string) $type))
            ->filter()
            ->unique()
            ->values();

        if ($selectedNotificationTypes->isEmpty()) {
            $selectedNotificationTypes = collect(['manual_targeted']);
        }

        $notificationType = $selectedNotificationTypes->contains('all')
            ? 'all'
            : $selectedNotificationTypes->implode(',');
        $historyPage = max((int) $request->input('history_page', 1), 1);
        $historyPerPage = 10;

        $users = User::query()
            ->select('id', 'name', 'phone', 'avatar', 'role_id', 'warehouse_id')
            ->with([
                'role:id,name,rank',
                'warehouse:id,name,code,file_path,is_active',
            ])
            ->withCount([
                'userDeviceTokens as active_device_token_count' => function ($query) {
                    $query->where('is_active', true)
                        ->whereNotNull('token')
                        ->where('token', '!=', '');
                },
            ])
            ->orderBy('name')
            ->get()
            ->map(function (User $user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'phone' => $user->phone,
                    'avatar' => $user->avatar,
                    'role_id' => $user->role_id,
                    'role_name' => $user->role?->name,
                    'warehouse_id' => $user->warehouse_id,
                    'warehouse_name' => $user->warehouse?->name,
                    'active_device_token_count' => (int) ($user->active_device_token_count ?? 0),
                    'has_active_device_token' => (int) ($user->active_device_token_count ?? 0) > 0,
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

        $historyQuery = UserNotification::query()
            ->with(['user:id,name'])
            ->select([
                'id',
                'user_id',
                'announcement_id',
                'type',
                'title',
                'message',
                'data',
                'action_url',
                'channel',
                'priority',
                'sent_at',
                'created_at',
            ])
            ->where('channel', UserNotification::CHANNEL_PUSH)
            ->when($notificationType !== 'all', function ($query) use ($selectedNotificationTypes) {
                $query->whereIn('type', $selectedNotificationTypes->all());
            })
            ->orderByDesc('sent_at')
            ->orderByDesc('id');

        $historyRows = $historyQuery
            ->get()
            ->groupBy(function (UserNotification $notification) {
                $sentAt = $notification->sent_at?->format('Y-m-d H:i:s') ?? '';
                $data = is_array($notification->data) ? $notification->data : [];

                return implode('|', [
                    $notification->announcement_id ?? '',
                    $notification->type,
                    $notification->title,
                    $notification->message,
                    $notification->priority,
                    $notification->action_url,
                    $sentAt,
                    json_encode($data),
                ]);
            })
            ->map(function (Collection $groupedNotifications) {
                /** @var UserNotification $first */
                $first = $groupedNotifications->first();

                $recipients = $groupedNotifications
                    ->map(function (UserNotification $notification) {
                        return [
                            'id' => (int) $notification->user_id,
                            'name' => $notification->user?->name ?? ('User ' . $notification->user_id),
                        ];
                    })
                    ->unique('id')
                    ->values();

                return [
                    'id' => (int) $first->id,
                    'id_announcement' => $first->announcement_id ? (int) $first->announcement_id : null,
                    'type' => $first->type,
                    'title' => $first->title,
                    'message' => $first->message,
                    'priority' => $first->priority,
                    'channel' => $first->channel,
                    'action_url' => $first->safe_action_url,
                    'sent_at' => $first->sent_at?->format('Y-m-d H:i:s'),
                    'created_at' => $first->created_at?->format('Y-m-d H:i:s'),
                    'recipient_count' => $recipients->count(),
                    'recipients' => $recipients,
                ];
            })
            ->sortByDesc('sent_at')
            ->values();

        $historyPaginator = new LengthAwarePaginator(
            $historyRows->forPage($historyPage, $historyPerPage)->values(),
            $historyRows->count(),
            $historyPerPage,
            $historyPage,
            [
                'path' => $request->url(),
                'pageName' => 'history_page',
            ]
        );

        $availableTypes = UserNotification::query()
            ->select('type')
            ->where('channel', UserNotification::CHANNEL_PUSH)
            ->whereNotNull('type')
            ->distinct()
            ->orderBy('type')
            ->pluck('type')
            ->filter()
            ->values();

        $typeOptions = collect(['all'])
            ->merge($availableTypes)
            ->unique()
            ->values()
            ->map(function (string $type) {
                return [
                    'value' => $type,
                    'label' => $type === 'all' ? 'Semua Tipe' : $type,
                ];
            });

        return Inertia::render('settings/announcements', [
            'users' => $users,
            'roles' => $roles,
            'warehouses' => $warehouses,
            'notification_type' => $notificationType,
            'notification_type_options' => $typeOptions,
            'history_notifications' => [
                'data' => $historyPaginator->items(),
                'current_page' => $historyPaginator->currentPage(),
                'last_page' => $historyPaginator->lastPage(),
                'per_page' => $historyPaginator->perPage(),
                'total' => $historyPaginator->total(),
                'from' => $historyPaginator->firstItem(),
                'to' => $historyPaginator->lastItem(),
            ],
        ]);
    }
}
