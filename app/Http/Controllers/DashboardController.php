<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use App\Models\SalesAttendance;
use App\Models\SalesVisit;
use App\Models\User;
use App\Models\Product;
use App\Models\FaceDescriptor;

class DashboardController extends Controller
{
    public function sales()
    {
        $user = Auth::user();
        $today = now()->toDateString();

        $userFaceDescriptor = FaceDescriptor::where('user_id', $user->id)
            ->select('descriptor', 'photo_path')
            ->first();

        if (!$userFaceDescriptor) {
            return redirect()->route('profile.edit')->with('warning', 'Silakan unggah data wajah Anda terlebih dahulu di halaman profil sebelum mengakses dashboard.');
        }

        $attendanceToday = SalesAttendance::where('user_id', $user->id)
            ->whereDate('work_date', $today)
            ->first();

        $recentVisits = SalesVisit::with(['photos', 'products', 'customer'])
            ->where('user_id', $user->id)
            ->whereDate('visited_at', $today)
            ->latest('visited_at')
            ->get();

        $products = Product::where('is_active', true)
            ->select('id', 'name', 'file_path', 'sku', 'category')
            ->orderBy('name')
            ->get();

        return Inertia::render('sales/visit-record', [
            'user' => $user,
            'attendanceToday' => $attendanceToday,
            'recentVisits' => $recentVisits,
            'products' => $products,
            'userFaceDescriptor' => $userFaceDescriptor,
            'serverTime' => now()->toISOString(),
        ]);
    }

    // public function index()
    // {
    //     $user = Auth::user();
    //     $today = now()->toDateString();

    //     $userFaceDescriptor = FaceDescriptor::where('user_id', $user->id)
    //         ->select('descriptor', 'photo_path')
    //         ->first();

    //     if (!$userFaceDescriptor) {
    //         return redirect()->route('profile.edit')->with('warning', 'Silakan unggah data wajah Anda terlebih dahulu di halaman profil sebelum mengakses dashboard.');
    //     }

    //     $attendanceToday = SalesAttendance::where('user_id', $user->id)
    //         ->whereDate('work_date', $today)
    //         ->first();

    //     $recentVisits = SalesVisit::with(['photos', 'products', 'customer'])
    //         ->where('user_id', $user->id)
    //         ->whereDate('visited_at', $today)
    //         ->latest('visited_at')
    //         ->get();

    //     $products = Product::where('is_active', true)
    //         ->select('id', 'name', 'file_path', 'sku', 'category')
    //         ->orderBy('name')
    //         ->get();

    //     return Inertia::render('dashboard', [
    //         'user' => $user,
    //         'attendanceToday' => $attendanceToday,
    //         'recentVisits' => $recentVisits,
    //         'products' => $products,
    //         'userFaceDescriptor' => $userFaceDescriptor,
    //         'serverTime' => now()->toISOString(),
    //     ]);
    // }

    // public function mataram()
    // {
    //     $user = Auth::user();
    //     $today = now()->toDateString();

    //     $attendanceToday = SalesAttendance::where('user_id', $user->id)
    //         ->whereDate('work_date', $today)
    //         ->first();

    //     $recentVisits = SalesVisit::with('photos')
    //         ->where('user_id', $user->id)
    //         ->whereDate('visited_at', $today)
    //         ->latest('visited_at')
    //         ->get();

    //     return Inertia::render('mataram', [
    //         'user' => $user,
    //         'attendanceToday' => $attendanceToday,
    //         'recentVisits' => $recentVisits,
    //         'serverTime' => now()->toISOString(),
    //     ]);
    // }

    public function monitoring($user_id)
    {
        $user = User::findOrFail($user_id);
        $date = request()->query('date', now()->toDateString());

        $attendanceToday = SalesAttendance::where('user_id', $user_id)
            ->whereDate('work_date', $date)
            ->first();

        $recentVisits = SalesVisit::with('photos', 'user')
            ->where('user_id', $user_id)
            ->whereDate('visited_at', $date)
            ->latest('visited_at')
            ->get();

        return Inertia::render('monitoring', [
            'user' => $user,
            'attendanceToday' => $attendanceToday,
            'recentVisits' => $recentVisits,
            'selectedDate' => $date,
            'serverTime' => now()->toISOString(),
        ]);
    }
}
