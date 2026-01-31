<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\SalesAttendanceController;
use App\Http\Controllers\SalesVisitController;
use App\Http\Controllers\SalesVisitPhotoController;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

// Route::get('dashboard', function () {
//     return Inertia::render('dashboard');
// })->middleware(['auth', 'verified'])->name('dashboard');



Route::get('dashboard', [DashboardController::class, 'index'])
    ->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware(['auth'])->group(function () {

    Route::post('attendance/check-in', [SalesAttendanceController::class, 'checkIn']);
    Route::post('attendance/check-out', [SalesAttendanceController::class, 'checkOut']);

    Route::post('visits', [SalesVisitController::class, 'store']);
    Route::post('visits/{visit}/photos', [SalesVisitPhotoController::class, 'store']);
});


require __DIR__ . '/settings.php';
