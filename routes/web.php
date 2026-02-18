<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\SalesAttendanceController;
use App\Http\Controllers\SalesVisitController;
use App\Http\Controllers\SalesVisitPhotoController;
use App\Http\Controllers\SalesVisitMataramController;
use App\Http\Controllers\SalesUtilsController;
use App\Http\Controllers\Utils\NearbyCustomerController;
use App\Http\Controllers\SupervisorController;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');


// Supervisor Routes with Inertia JS
Route::middleware(['auth', 'verified'])->prefix('supervisor')->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('supervisor/dashboard');
    });

    Route::get('monitoring-team', [SupervisorController::class, 'monitoringTeam']);
    Route::get('monitoring-record/{user_id}', [SupervisorController::class, 'monitoringRecord'])
        ->where('user_id', '[0-9]+');
});

// Sales Routes Capacitor JS
Route::middleware(['auth', 'verified'])->prefix('sales')->group(function () {
    Route::get('dashboard', [DashboardController::class, 'sales']);

    Route::post('attendance/check-in', [SalesAttendanceController::class, 'checkIn']);
    Route::post('attendance/check-out', [SalesAttendanceController::class, 'checkOut']);

    Route::post('utils/reverse-geocode', [SalesUtilsController::class, 'reverseGeocode']);

    Route::post('visits', [SalesVisitController::class, 'store']);
    Route::patch('customers/{id}/update-contact', [SalesVisitController::class, 'updateContact']);
    Route::post('utils/nearby-customers', NearbyCustomerController::class);
});


// Routes for Mataram subdomain

// Route::get('dashboard', function () {
//     $host = request()->getHost();
//     if ($host === 'mataram.idnsolo.com') {
//         return app(DashboardController::class)->mataram();
//     }
//     return app(DashboardController::class)->index();
//     // return app(DashboardController::class)->mataram();
// })->middleware(['auth', 'verified'])->name('dashboard');


// Route::middleware(['auth'])->group(function () {
//     $host = request()->getHost();
//     if ($host === 'mataram.idnsolo.com') {
//         Route::post('visits', [SalesVisitMataramController::class, 'store']);
//         Route::post('visits/{visit}/photos', [SalesVisitPhotoController::class, 'store']);
//     }
// });

// Route::get('monitoring/{user_id}', [DashboardController::class, 'monitoring']);
// Route::get('htx20sht7bwy9pgYP4VP7AFhYi6GL5ryffX1LAYMwBbKoo8jA7uBqVbQcmPT1RGkVAtFuh7v4k9xicGxGQMTXZxba3CWFOIoxgw', function () {
//     return Inertia::render('select-monitoring');
// });

require __DIR__ . '/settings.php';
