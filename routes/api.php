<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

use App\Http\Controllers\Api\WhatsappWebhookController;
Route::post('/webhook/evolution/M3zKJc2YQWf8sL7G1B0xE4tH9RdaUuVw6iP5AyrnDkXhSCTbFvNjZpOlImeqg/{any?}', [WhatsappWebhookController::class, 'handle'])
    ->where('any', '.*');