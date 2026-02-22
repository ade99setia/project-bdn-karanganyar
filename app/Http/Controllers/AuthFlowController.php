<?php

namespace App\Http\Controllers;

use App\Models\KioskToken;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class AuthFlowController extends Controller
{
    public function assetLinks()
    {
        if (!config('app.android_app_link.enabled')) {
            abort(404);
        }

        $packageName = config('app.android_app_link.package_name');
        $sha256Fingerprints = config('app.android_app_link.sha256_fingerprints', []);

        if (!$packageName || empty($sha256Fingerprints)) {
            abort(404);
        }

        return response()->json([
            [
                'relation' => ['delegate_permission/common.handle_all_urls'],
                'target' => [
                    'namespace' => 'android_app',
                    'package_name' => $packageName,
                    'sha256_cert_fingerprints' => $sha256Fingerprints,
                ],
            ],
        ], 200, ['Content-Type' => 'application/json']);
    }

    public function sendVerificationFromApp(Request $request)
    {
        if ($request->user()->hasVerifiedEmail()) {
            return response()->json([
                'message' => 'Email already verified.',
                'already_verified' => true,
            ]);
        }

        $request->user()->sendEmailVerificationNotification();

        return response()->json([
            'message' => 'Verification link sent.',
            'already_verified' => false,
        ]);
    }

    public function verificationStatus(Request $request)
    {
        return response()->json([
            'verified' => $request->user()->hasVerifiedEmail(),
            'redirect_to' => route('profile.edit'),
        ]);
    }

    public function kioskLogin(string $token)
    {
        $kioskToken = KioskToken::with('user')
            ->valid()
            ->where('token', hash('sha256', $token))
            ->first();

        if (!$kioskToken || !$kioskToken->user) {
            abort(403, 'Token kiosk tidak valid atau sudah kedaluwarsa.');
        }

        Auth::login($kioskToken->user);
        request()->session()->regenerate();

        if (!$kioskToken->user->hasVerifiedEmail()) {
            return redirect()->route('profile.edit')->with('warning', 'Silakan verifikasi email Anda terlebih dahulu.');
        }

        return redirect($kioskToken->user->role . '/dashboard')->with('success', 'Login berhasil melalui token kiosk. Selamat datang, ' . $kioskToken->user->name . '!');
    }

    public function generateKioskLink(Request $request)
    {
        $plainToken = Str::random(60);

        KioskToken::create([
            'user_id' => $request->user()->id,
            'token' => hash('sha256', $plainToken),
            'active' => true,
            'expired_at' => now()->addMinutes(15),
            'ip' => $request->ip(),
        ]);

        return response()->json([
            'url' => url('/kiosk/' . $plainToken),
            'expired_at' => now()->addMinutes(15)->toISOString(),
        ]);
    }
}
