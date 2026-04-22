<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
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
use App\Http\Controllers\AnnouncementController;
use App\Http\Controllers\NotificationController;
use Laravel\Fortify\Http\Controllers\TwoFactorAuthenticatedSessionController;
use App\Http\Controllers\WhatsappController;
use App\Http\Controllers\POSController;
use App\Http\Controllers\CashierShiftController;
use App\Http\Controllers\ReceiptController;

Route::post('/whatsapp/send', [WhatsappController::class, 'send'])->name('whatsapp.send');

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

// Supervisor Routes with Inertia JS
Route::middleware(['auth', 'verified'])->prefix('supervisor')->group(function () {
    Route::get('dashboard', [SupervisorController::class, 'dashboard']);

    Route::get('monitoring-team', [SupervisorController::class, 'monitoringTeam']);
    Route::get('monitoring-record/{user_id}', [SupervisorController::class, 'monitoringRecord'])
        ->where('user_id', '[0-9]+');
});

// Sales Routes Capacitor JS
Route::middleware(['auth', 'verified'])->prefix('sales')->group(function () {

    Route::middleware(['roleUser:sales,active'])->group(function () {
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
});

// POS Routes
Route::middleware(['auth', 'verified', 'posAccess'])->prefix('pos')->group(function () {
    // POS Main Interface
    Route::get('/', [POSController::class, 'index'])->name('pos.index');
    Route::get('/products/search', [POSController::class, 'searchProducts'])->name('pos.products.search');
    Route::post('/cart/preview', [POSController::class, 'previewCart'])->name('pos.cart.preview');
    Route::post('/transactions/checkout', [POSController::class, 'checkout'])->name('pos.checkout');
    Route::get('/transactions', [POSController::class, 'transactions'])->name('pos.transactions');
    Route::get('/transactions/{transaction}', [POSController::class, 'show'])->name('pos.transactions.show');
    Route::post('/transactions/{transaction}/void', [POSController::class, 'void'])->name('pos.transactions.void');

    // Cashier Shifts
    Route::get('/shifts/current', [CashierShiftController::class, 'current'])->name('pos.shifts.current');
    Route::post('/shifts/open', [CashierShiftController::class, 'open'])->name('pos.shifts.open');
    Route::post('/shifts/close', [CashierShiftController::class, 'close'])->name('pos.shifts.close');
    Route::get('/shifts', [CashierShiftController::class, 'index'])->name('pos.shifts.index');
    Route::get('/shifts/{shift}', [CashierShiftController::class, 'show'])->name('pos.shifts.show');

    // Receipts
    Route::get('/receipts/{transactionNumber}', [ReceiptController::class, 'show'])->name('pos.receipts.show');
    Route::post('/receipts/{transaction}/send-whatsapp', [ReceiptController::class, 'sendWhatsApp'])->name('pos.receipts.send-whatsapp');
    Route::get('/receipts/{transaction}/print', [ReceiptController::class, 'print'])->name('pos.receipts.print');
});

// =======================================================================================================================================

Route::middleware(['auth', 'verified'])->group(function () {

    // Default route after login, will redirect to role-based dashboard
    Route::get('dashboard', function () {
        return redirect()->route('profile.edit');
    })->name('dashboard');

    // Notifications
    Route::get('notifications', [NotificationController::class, 'index']);
    Route::post('notifications/device-token', [NotificationController::class, 'storeDeviceToken']);
    Route::get('notifications/device-token/status', [NotificationController::class, 'deviceTokenStatus']);
    Route::post('notifications/device-token/deactivate', [NotificationController::class, 'deactivateDeviceToken']);
    Route::patch('notifications/read-all', [NotificationController::class, 'markAllAsRead']);
    Route::get('notifications/{notification}/read', [NotificationController::class, 'markAsReadFromLink'])
        ->whereNumber('notification');
    Route::patch('notifications/{notification}/read', [NotificationController::class, 'markAsRead'])
        ->whereNumber('notification');
    Route::patch('notifications/{notification}/unread', [NotificationController::class, 'markAsUnread'])
        ->whereNumber('notification');

    Route::post('notifications/targeted-push', [NotificationController::class, 'sendTargetedPush']);
    Route::get('announcements/{announcement}', [AnnouncementController::class, 'show'])
        ->whereNumber('announcement');

    // Sync Center atau Semi-Offline Page
    Route::get('sync-center', fn() => Inertia::render('sync-center', [
        'role' => Auth::user()->role
    ]));

    // Kiosk Login Routes
    Route::get('/kiosk/{token}', [AuthFlowController::class, 'kioskLogin'])->name('kiosk.login');

    Route::middleware(['auth'])->post('/kiosk/generate-link', [AuthFlowController::class, 'generateKioskLink'])
        ->name('kiosk.generate-link');

    // Android App Link Route
    Route::get('/.well-known/assetlinks.json', [AuthFlowController::class, 'assetLinks']);
});

// Authenticated routes for email verification and kiosk login
Route::middleware(['auth'])->group(function () {
    Route::post('/email/verification-notification/app', [AuthFlowController::class, 'sendVerificationFromApp'])
        ->withoutMiddleware([\Illuminate\Foundation\Http\Middleware\VerifyCsrfToken::class])
        ->middleware('throttle:6,1')
        ->name('verification.send.app');

    Route::get('/email/verification-status', [AuthFlowController::class, 'verificationStatus'])
        ->name('verification.status');
});

// Two-factor challenge route (must be outside auth middleware group to avoid guest middleware conflict)
Route::post('/two-factor-challenge/app', [TwoFactorAuthenticatedSessionController::class, 'store'])
    ->withoutMiddleware([\Illuminate\Foundation\Http\Middleware\VerifyCsrfToken::class])
    ->middleware(['throttle:two-factor'])
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
