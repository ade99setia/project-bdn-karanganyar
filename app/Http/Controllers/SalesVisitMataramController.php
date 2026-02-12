<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Models\SalesAttendance;
use App\Models\SalesVisit;
use App\Models\SalesVisitPhoto;

class SalesVisitMataramController extends Controller
{
    public function store(Request $request)
    {
        // 1. Validasi input
        $validated = $request->validate([
            'activity_type' => 'required|string',
            'description'   => 'nullable|string',
            'lat'           => 'required|numeric',
            'lng'           => 'required|numeric',
            'address'       => 'nullable|string',
            'photo'         => 'required|image|max:10240',
        ]);

        $user  = Auth::user();
        $today = now()->toDateString();

        // 2. Pastikan sudah check-in
        $attendance = SalesAttendance::where('user_id', $user->id)
            ->whereDate('work_date', $today)
            ->first();

        if (!$attendance) {
            return back()->withErrors([
                'message' => 'Anda harus check-in presensi terlebih dahulu.'
            ]);
        }

        DB::transaction(function () use ($validated, $user, $attendance) {

            $lat = $validated['lat'];
            $lng = $validated['lng'];

            // 3. Alamat simpel (fallback koordinat)
            $address = $validated['address']
                ?? "Koordinat: {$lat}, {$lng}";

            // 4. Fake GPS (placeholder logic)
            $fakeScore = 0;
            $isFake    = false;

            // 5. Simpan visit
            $visit = SalesVisit::create([
                'user_id'             => $user->id,
                'sales_attendance_id' => $attendance->id,
                'activity_type'       => $validated['activity_type'],
                'description'         => $validated['description'] ?? null,
                'visited_at'          => now(),
                'lat'                 => $lat,
                'lng'                 => $lng,
                'address'             => $address,
                'is_fake_gps'         => $isFake,
                'fake_gps_score'      => $fakeScore,
            ]);

            // 6. Simpan foto
            $file = request()->file('photo');
            $path = $file->store('visit-photos', 'public');

            SalesVisitPhoto::create([
                'sales_visit_id' => $visit->id,
                'file_path'      => $path,
                'taken_at'       => now(),
                'lat'            => $lat,
                'lng'            => $lng,
                'exif_checked'   => true,
                'is_fake_gps'    => $isFake,
            ]);
        });

        return back()->with('success', 'Visit sales berhasil disimpan.');
    }
}
