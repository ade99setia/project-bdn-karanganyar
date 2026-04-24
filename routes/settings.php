<?php

use App\Http\Controllers\Settings\PasswordController;
use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\Settings\TwoFactorAuthenticationController;
use App\Http\Controllers\Settings\UserManagementController;
use App\Http\Controllers\Settings\ProductManagementController;
use App\Http\Controllers\Settings\NotificationManagementController;
use App\Http\Controllers\Settings\StockistManagementController;
use App\Http\Controllers\Settings\WhatsappBlastingController;
use App\Http\Controllers\Settings\MembershipController;
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

    // Announcement Management Routes
    Route::redirect('settings/notifications', '/settings/announcements');
    Route::get('settings/announcements', [NotificationManagementController::class, 'index'])
        ->name('settings.announcements.index');

    // WhatsApp Blasting Routes
    Route::get('settings/whatsapp-blasting', [WhatsappBlastingController::class, 'index'])
        ->name('settings.whatsapp-blasting.index');
    Route::post('settings/whatsapp-blasting/send', [WhatsappBlastingController::class, 'sendTargeted'])
        ->name('settings.whatsapp-blasting.send');

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

    // Membership Management Routes
    Route::get('settings/membership', [MembershipController::class, 'index'])
        ->name('settings.membership.index');
    
    // Membership Tiers
    Route::post('settings/membership/tiers', [MembershipController::class, 'storeTier'])
        ->name('settings.membership.tiers.store');
    Route::put('settings/membership/tiers/{tier}', [MembershipController::class, 'updateTier'])
        ->name('settings.membership.tiers.update');
    Route::delete('settings/membership/tiers/{tier}', [MembershipController::class, 'destroyTier'])
        ->name('settings.membership.tiers.destroy');
    
    // Product Discounts
    Route::get('settings/membership/tiers/{tier}/discounts', [MembershipController::class, 'indexProductDiscounts'])
        ->name('settings.membership.discounts.index');
    Route::post('settings/membership/product-discounts', [MembershipController::class, 'storeProductDiscount'])
        ->name('settings.membership.discounts.store');
    Route::put('settings/membership/product-discounts/{discount}', [MembershipController::class, 'updateProductDiscount'])
        ->name('settings.membership.discounts.update');
    Route::delete('settings/membership/product-discounts/{discount}', [MembershipController::class, 'destroyProductDiscount'])
        ->name('settings.membership.discounts.destroy');

    // Product Promotions (BXGY)
    Route::post('settings/membership/promotions', [MembershipController::class, 'storePromotion'])
        ->name('settings.membership.promotions.store');
    Route::put('settings/membership/promotions/{promotion}', [MembershipController::class, 'updatePromotion'])
        ->name('settings.membership.promotions.update');
    Route::delete('settings/membership/promotions/{promotion}', [MembershipController::class, 'destroyPromotion'])
        ->name('settings.membership.promotions.destroy');
    
    // Members
    Route::post('settings/membership/members', [MembershipController::class, 'storeMember'])
        ->name('settings.membership.members.store');
    Route::put('settings/membership/members/{member}', [MembershipController::class, 'updateMember'])
        ->name('settings.membership.members.update');
    Route::delete('settings/membership/members/{member}', [MembershipController::class, 'destroyMember'])
        ->name('settings.membership.members.destroy');
    Route::get('settings/membership/members/search', [MembershipController::class, 'searchMembers'])
        ->name('settings.membership.members.search');
});
