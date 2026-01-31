<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use App\Models\SalesAttendance;

class SalesAttendanceController extends Controller
{
    /**
     * Handle Check-In Request
     */
    public function checkIn(Request $request)
    {
        // 1. Validasi Input
        $request->validate([
            'lat' => 'required|numeric|between:-90,90',
            'lng' => 'required|numeric|between:-180,180',
            'device_id' => 'nullable|string',
            'accuracy' => 'nullable|numeric',
            'check_in_address' => 'nullable|string',
        ]);

        $userId = Auth::id();
        $today = now()->toDateString();

        // 2. Gunakan Transaction untuk integritas data
        return DB::transaction(function () use ($userId, $today, $request) {
            $existing = SalesAttendance::where('user_id', $userId)
                ->where('work_date', $today)
                ->lockForUpdate()
                ->first();

            if ($existing) {
                return back()->withErrors(['message' => 'Anda sudah melakukan check-in hari ini.']);
            }

            SalesAttendance::create([
                'user_id' => $userId,
                'work_date' => $today,
                'check_in_at' => now(),

                'check_in_lat' => $request->lat,
                'check_in_lng' => $request->lng,
                'check_in_address' => $request->check_in_address ?? null,

                'device_id' => $request->device_id ?? 'unknown',
                'is_fake_gps' => false, // Default false, nanti diupdate middleware/logic lain
            ]);

            return back()->with('success', 'Berhasil Check-in! Selamat bekerja.');
        });
    }

    /**
     * Handle Check-Out Request
     */
    public function checkOut(Request $request)
    {
        $request->validate([
            'lat' => 'required|numeric|between:-90,90',
            'lng' => 'required|numeric|between:-180,180',
            'check_out_address' => 'nullable|string',
        ]);

        $userId = Auth::id();
        $today = now()->toDateString();

        return DB::transaction(function () use ($userId, $today, $request) {

            $attendance = SalesAttendance::where('user_id', $userId)
                ->whereDate('work_date', $today)
                ->lockForUpdate()
                ->first();

            if (!$attendance) {
                return back()->withErrors(['message' => 'Anda belum melakukan check-in hari ini.']);
            }

            if ($attendance->check_out_at) {
                return back()->withErrors(['message' => 'Anda sudah check-out sebelumnya.']);
            }

            $attendance->update([
                'check_out_at' => now(),
                'check_out_lat' => $request->lat,
                'check_out_lng' => $request->lng,
                'check_out_address' => $request->check_out_address ?? null,
            ]);

            return back()->with('success', 'Berhasil Check-out! Hati-hati di jalan.');
        });
    }
}
