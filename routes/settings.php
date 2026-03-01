<?php

use App\Http\Controllers\Settings\PasswordController;
use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\Settings\TwoFactorAuthenticationController;
use App\Http\Controllers\Settings\UserManagementController;
use App\Http\Controllers\Settings\ProductManagementController;
use App\Http\Controllers\Settings\StockistManagementController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware(['auth'])->group(function () {
    Route::redirect('settings', '/settings/profile');

    Route::get('settings/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('settings/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::post('settings/profile/face-id', [ProfileController::class, 'updateFaceId'])->name('profile.face-id.update');
    Route::post('settings/profile/avatar', [ProfileController::class, 'updateAvatar'])->name('profile.avatar.update');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::delete('settings/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::get('settings/password', [PasswordController::class, 'edit'])->name('user-password.edit');

    Route::put('settings/password', [PasswordController::class, 'update'])
        ->middleware('throttle:6,1')
        ->name('user-password.update');

    Route::get('settings/appearance', function () {
        return Inertia::render('settings/appearance');
    })->name('appearance.edit');

    Route::get('settings/two-factor', [TwoFactorAuthenticationController::class, 'show'])
        ->name('two-factor.show');

    // User Management Routes    
    Route::get('settings/users', [UserManagementController::class, 'index'])
        ->name('settings.users.index');
    Route::post('settings/users', [UserManagementController::class, 'store'])
        ->name('settings.users.store');
    Route::post('settings/roles', [UserManagementController::class, 'storeRole'])
        ->name('settings.roles.store');
    Route::put('settings/roles/{role}', [UserManagementController::class, 'updateRole'])
        ->name('settings.roles.update');
    Route::delete('settings/roles/{role}', [UserManagementController::class, 'destroyRole'])
        ->name('settings.roles.destroy');
    Route::put('settings/users/{user}', [UserManagementController::class, 'update'])
        ->name('settings.users.update');
    Route::delete('settings/users/{user}', [UserManagementController::class, 'destroy'])
        ->name('settings.users.destroy');
    
    // Workday Configuration Routes
    Route::get('settings/workday', [UserManagementController::class, 'workday'])
        ->name('settings.workday.index');
    Route::put('settings/workday', [UserManagementController::class, 'updateWorkday'])
        ->name('settings.workday.update');

    // User Settings Configuration Routes  
    Route::put('settings/users/config', [UserManagementController::class, 'updateUserSettings'])
        ->name('settings.users.config.update');

    // Product Management Routes
    Route::get('settings/products', [ProductManagementController::class, 'index'])
        ->name('settings.products.index');
    Route::post('settings/products', [ProductManagementController::class, 'store'])
        ->name('settings.products.store');
    Route::put('settings/products/{product}', [ProductManagementController::class, 'update'])
        ->name('settings.products.update');
    Route::delete('settings/products/{product}', [ProductManagementController::class, 'destroy'])
        ->name('settings.products.destroy');

    // Stockist Management Routes
    Route::get('settings/stockist', [StockistManagementController::class, 'index'])
        ->name('settings.stockist.index');
    Route::post('settings/warehouses', [StockistManagementController::class, 'storeWarehouse'])
        ->name('settings.warehouses.store');
    Route::put('settings/warehouses/{warehouse}', [StockistManagementController::class, 'updateWarehouse'])
        ->name('settings.warehouses.update');
    Route::delete('settings/warehouses/{warehouse}', [StockistManagementController::class, 'destroyWarehouse'])
        ->name('settings.warehouses.destroy');
    Route::post('settings/stocks/adjust', [StockistManagementController::class, 'adjustStock'])
        ->name('settings.stocks.adjust');
});
