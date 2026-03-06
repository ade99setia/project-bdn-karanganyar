<?php

namespace App\Http\Controllers;

use App\Models\Announcement;
use App\Models\UserNotification;
use App\Services\RoleRankVisibilityService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AnnouncementController extends Controller
{
    public function show(
        Request $request,
        Announcement $announcement,
        RoleRankVisibilityService $roleRankVisibilityService,
    ): Response
    {
        $user = $request->user();
        $userId = (int) $user->id;

        $hasAccess = UserNotification::query()
            ->where('user_id', $userId)
            ->where('announcement_id', $announcement->id)
            ->exists();

        if (!$hasAccess) {
            abort(403, 'Anda tidak memiliki akses ke pengumuman ini.');
        }

        $userRank = $roleRankVisibilityService->getUserRank($user);
        $canViewRecipients = $userRank > 0;

        $recipients = [];

        if ($canViewRecipients) {
            $recipients = UserNotification::query()
                ->where('announcement_id', $announcement->id)
                ->with(['user:id,name,role_id', 'user.role:id,name,rank'])
                ->get()
                ->filter(function (UserNotification $notification) use ($roleRankVisibilityService, $user) {
                    $targetRank = $notification->user?->role?->rank;

                    return $roleRankVisibilityService->canViewTargetRank($user, is_numeric($targetRank) ? (int) $targetRank : null);
                })
                ->map(function (UserNotification $notification) {
                    return [
                        'id' => (int) $notification->user_id,
                        'name' => $notification->user?->name ?? ('User ' . $notification->user_id),
                        'role_name' => $notification->user?->role?->name,
                    ];
                })
                ->unique('id')
                ->values()
                ->all();
        }

        return Inertia::render('announcements/show', [
            'announcement' => [
                'id' => $announcement->id,
                'title' => $announcement->title,
                'content_html' => $announcement->content_html,
                'created_at' => $announcement->created_at?->toISOString(),
                'can_view_recipients' => $canViewRecipients,
                'recipients' => $recipients,
            ],
        ]);
    }
}
