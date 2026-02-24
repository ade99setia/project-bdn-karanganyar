<?php

namespace App\Services;

use App\Models\SalesAttendance;
use App\Models\UserNotification;
use Carbon\CarbonInterface;
use Illuminate\Support\Carbon;

class SalesVisitInactivityViolationService
{
    public const TYPE = 'sales_visit_inactivity_violation';

    public function __construct(
        private readonly FcmPushService $fcmPushService,
    ) {
    }

    /**
     * @return array{checked:int,violations:int,notifications:int,push_sent:int,push_failed:int,dry_run:bool}
     */
    public function process(int $minutes = 60, bool $dryRun = false): array
    {
        $minutes = max(1, $minutes);
        $now = now();
        $threshold = $now->copy()->subMinutes($minutes);

        /** @var \Illuminate\Support\Collection<int, SalesAttendance> $openAttendances */
        $openAttendances = SalesAttendance::query()
            ->with(['user:id,name'])
            ->where('work_date', now()->toDateString())
            ->whereNotNull('check_in_at')
            ->whereNull('check_out_at')
            ->get();

        $checked = $openAttendances->count();
        $violations = 0;
        $notifications = 0;
        $pushSent = 0;
        $pushFailed = 0;

        foreach ($openAttendances as $attendance) {
            /** @var SalesAttendance $attendance */
            if (!$attendance->user) {
                continue;
            }

            $latestVisitAt = $attendance->visits()
                ->latest('visited_at')
                ->value('visited_at');

            if ($this->isStillWithinAllowedWindow($attendance->check_in_at, $latestVisitAt, $threshold)) {
                continue;
            }

            if ($this->hasBeenNotifiedSinceLastVisit($attendance->id, $attendance->user_id, $latestVisitAt)) {
                continue;
            }

            $violations++;

            if ($dryRun) {
                continue;
            }

            $notification = UserNotification::create([
                'user_id' => $attendance->user_id,
                'type' => self::TYPE,
                'title' => 'Terdeteksi Pelanggaran Aktivitas',
                'message' => "Tidak ada penambahan data visit selama {$minutes} menit terakhir. Segera lakukan visit atau hubungi atasan.",
                'data' => [
                    'sales_attendance_id' => $attendance->id,
                    'check_in_at' => $attendance->check_in_at?->toISOString(),
                    'latest_visit_at' => $latestVisitAt ? Carbon::parse($latestVisitAt)->toISOString() : null,
                    'rule_minutes' => $minutes,
                ],
                'status' => UserNotification::STATUS_UNREAD,
                'channel' => UserNotification::CHANNEL_PUSH,
                'priority' => UserNotification::PRIORITY_HIGH,
                'action_url' => '/sales/dashboard',
                'sent_at' => $now,
            ]);

            $notifications++;

            $pushResult = $this->fcmPushService->sendUserNotification($notification);
            $pushSent += (int) ($pushResult['sent'] ?? 0);
            $pushFailed += (int) ($pushResult['failed'] ?? 0);

        }

        $result = [
            'checked' => $checked,
            'violations' => $violations,
            'notifications' => $notifications,
            'push_sent' => $pushSent,
            'push_failed' => $pushFailed,
            'dry_run' => $dryRun,
        ];

        return $result;
    }

    private function isStillWithinAllowedWindow($checkInAt, $latestVisitAt, CarbonInterface $threshold): bool
    {
        if ($latestVisitAt) {
            return Carbon::parse($latestVisitAt)->greaterThan($threshold);
        }

        if (!$checkInAt) {
            return true;
        }

        return Carbon::parse($checkInAt)->greaterThan($threshold);
    }

    private function hasBeenNotifiedSinceLastVisit(int $attendanceId, int $userId, $latestVisitAt): bool
    {
        $lastNotification = UserNotification::query()
            ->where('user_id', $userId)
            ->where('type', self::TYPE)
            ->where('data->sales_attendance_id', $attendanceId)
            ->latest('sent_at')
            ->latest('id')
            ->first();

        if (!$lastNotification) {
            return false;
        }

        if (!$latestVisitAt) {
            return true;
        }

        $lastSentAt = $lastNotification->sent_at ?? $lastNotification->created_at;

        if (!$lastSentAt) {
            return true;
        }

        return Carbon::parse($lastSentAt)->greaterThanOrEqualTo(Carbon::parse($latestVisitAt));
    }
}
