<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');


// Schedule command untuk deteksi pelanggaran sales visit inactivity
// HANYA BISA DIJALANKAN DI CRONJOB SAJA, DIBAWAH HANYA CONTOH
Schedule::command('sales:detect-visit-inactivity-violation --minutes=60')
    ->everyFifteenMinutes()
    ->withoutOverlapping();