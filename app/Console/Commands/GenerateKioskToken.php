<?php

namespace App\Console\Commands;

use App\Models\KioskToken;
use Illuminate\Console\Command;
use Illuminate\Support\Str;

class GenerateKioskToken extends Command
{
    protected $signature = 'kiosk:generate {user_id}';

    protected $description = 'Generate kiosk auto-login token (expired 15 menit)';

    public function handle(): int
    {
        $plainToken = Str::random(60);

        KioskToken::create([
            'user_id' => $this->argument('user_id'),
            'token' => hash('sha256', $plainToken),
            'active' => true,
            'expired_at' => now()->addMinutes(15),
        ]);

        $this->info('Kiosk token berhasil dibuat');
        $this->line('');
        $this->line('URL KIOSK:');
        $this->line(url('/kiosk/' . $plainToken));

        return self::SUCCESS;
    }
}
