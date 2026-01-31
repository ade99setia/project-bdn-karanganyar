<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\SalesVisit;
use App\Models\SalesVisitPhoto;

class SalesVisitPhotoController extends Controller
{
    public function store(Request $request, SalesVisit $visit)
    {
        $request->validate([
            'photo' => 'required|image|max:5120',
        ]);

        $path = $request->file('photo')->store('visit-photos', 'public');

        SalesVisitPhoto::create([
            'sales_visit_id' => $visit->id,
            'file_path' => $path,
            'taken_at' => now(),
            'exif_checked' => false,
        ]);

        return back()->with('success', 'Foto berhasil diupload');
    }
}
