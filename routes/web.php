<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;
use App\Http\Controllers\AuthFlowController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\SalesAttendanceController;
use App\Http\Controllers\SalesVisitController;
// use App\Http\Controllers\SalesVisitPhotoController;
// use App\Http\Controllers\SalesVisitMataramController;
use App\Http\Controllers\SalesUtilsController;
use App\Http\Controllers\Utils\NearbyCustomerController;
use App\Http\Controllers\SupervisorController;
use App\Http\Controllers\SalesController;
use App\Http\Controllers\SalesNotificationController;
use Laravel\Fortify\Http\Controllers\TwoFactorAuthenticatedSessionController;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

// Default route after login, will redirect to role-based dashboard
Route::get('dashboard', function () {
    // return Inertia::render('dashboard');
    return redirect()->route('profile.edit');
})->middleware(['auth', 'verified'])->name('dashboard');

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

    Route::middleware(['roleUser:1,active'])->group(function () {
        Route::get('dashboard', [DashboardController::class, 'sales']);

        Route::get('monitoring-record/{user_id}', [SalesController::class, 'monitoringRecord'])
            ->where('user_id', '[0-9]+');
    });

    // Attendance, Visits, Utils for visit-record.tsx
    Route::post('attendance/check-in', [SalesAttendanceController::class, 'checkIn']);
    Route::post('attendance/check-out', [SalesAttendanceController::class, 'checkOut']);

    Route::post('utils/reverse-geocode', [SalesUtilsController::class, 'reverseGeocode']);

    Route::post('visits', [SalesVisitController::class, 'store']);
    Route::patch('customers/{id}/update-contact', [SalesVisitController::class, 'updateContact']);
    Route::post('utils/nearby-customers', NearbyCustomerController::class);

    // Notifications
    Route::get('notifications', [SalesNotificationController::class, 'index']);
    Route::post('notifications/device-token', [SalesNotificationController::class, 'storeDeviceToken']);
    Route::get('notifications/device-token/status', [SalesNotificationController::class, 'deviceTokenStatus']);
    Route::post('notifications/device-token/deactivate', [SalesNotificationController::class, 'deactivateDeviceToken']);
    Route::patch('notifications/read-all', [SalesNotificationController::class, 'markAllAsRead']);
    Route::get('notifications/{notification}/read', [SalesNotificationController::class, 'markAsReadFromLink'])
        ->whereNumber('notification');
    Route::patch('notifications/{notification}/read', [SalesNotificationController::class, 'markAsRead'])
        ->whereNumber('notification');
    Route::patch('notifications/{notification}/unread', [SalesNotificationController::class, 'markAsUnread'])
        ->whereNumber('notification');

    // Testing route for sending push notifications (can be removed in production)    
    Route::post('notifications/test-push', [SalesNotificationController::class, 'sendTestPush']);
});

// =============================  =============================

// Shared routes
Route::middleware(['auth', 'verified'])
    ->prefix('{role}')
    ->whereIn('role', ['supervisor', 'sales'])
    ->group(function () {
        Route::get('sync-center', function ($role) {
            return Inertia::render('sync-center', [
                'role' => $role
            ]);
        });
    });
    
// Kiosk Login Routes
Route::get('/kiosk/{token}', [AuthFlowController::class, 'kioskLogin'])->name('kiosk.login');

Route::middleware(['auth'])->post('/kiosk/generate-link', [AuthFlowController::class, 'generateKioskLink'])
    ->name('kiosk.generate-link');

// Android App Link Route
Route::get('/.well-known/assetlinks.json', [AuthFlowController::class, 'assetLinks']);

// Authenticated routes for email verification and kiosk login
Route::middleware(['auth'])->group(function () {
    Route::post('/email/verification-notification/app', [AuthFlowController::class, 'sendVerificationFromApp'])
        ->withoutMiddleware([\Illuminate\Foundation\Http\Middleware\VerifyCsrfToken::class])
        ->middleware('throttle:6,1')
        ->name('verification.send.app');

    Route::get('/email/verification-status', [AuthFlowController::class, 'verificationStatus'])
        ->name('verification.status');
});

Route::post('/two-factor-challenge/app', [TwoFactorAuthenticatedSessionController::class, 'store'])
    ->withoutMiddleware([\Illuminate\Foundation\Http\Middleware\VerifyCsrfToken::class])
    ->middleware(['guest', 'throttle:two-factor'])
    ->name('two-factor.login.app');


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
