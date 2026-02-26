<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use App\Models\User;

class ClearDashboardCache extends Command
{
    protected $signature = 'dashboard:clear-cache {user_id?}';
    protected $description = 'Clear dashboard cache for a specific user or all supervisors';

    public function handle()
    {
        $userId = $this->argument('user_id');

        if ($userId) {
            Cache::forget('dashboard_' . $userId);
            $this->info("Dashboard cache cleared for user ID: $userId");
        } else {
            // Clear cache for all supervisors
            $supervisors = User::query()
                ->whereHas('role', fn($q) => $q->where('name', 'supervisor'))
                ->pluck('id');

            foreach ($supervisors as $id) {
                Cache::forget('dashboard_' . $id);
            }

            $this->info("Dashboard cache cleared for " . $supervisors->count() . " supervisors");
        }
    }
}
