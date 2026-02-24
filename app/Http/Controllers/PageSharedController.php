<?php

namespace App\Http\Controllers;

use App\Models\UserNotification;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PageSharedController extends Controller
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

        return Inertia::render('sales/notifications', [
            'notifications' => $notifications,
            'unreadCount' => $unreadCount,
        ]);
    }
}
