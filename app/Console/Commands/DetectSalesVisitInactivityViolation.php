<?php

namespace App\Console\Commands;

use App\Services\SalesVisitInactivityViolationService;
use Illuminate\Console\Command;

class DetectSalesVisitInactivityViolation extends Command
{
    protected $signature = 'sales:detect-visit-inactivity-violation 
        {--minutes=60 : Ambang menit tanpa penambahan visit}
        {--dry-run : Hanya simulasi, tidak mengirim notifikasi}';

    protected $description = 'Deteksi pelanggaran sales aktif yang belum check-out tetapi tidak menambah visit sesuai ambang waktu';

    public function handle(SalesVisitInactivityViolationService $service): int
    {
        $minutes = (int) $this->option('minutes');
        $dryRun = (bool) $this->option('dry-run');

        $result = $service->process($minutes, $dryRun);

        $this->info('Deteksi pelanggaran selesai.');
        $this->line('Checked      : ' . $result['checked']);
        $this->line('Violations   : ' . $result['violations']);
        $this->line('Notifications: ' . $result['notifications']);
        $this->line('Push Sent    : ' . $result['push_sent']);
        $this->line('Push Failed  : ' . $result['push_failed']);
        $this->line('Dry Run      : ' . ($result['dry_run'] ? 'yes' : 'no'));

        return self::SUCCESS;
    }
}
