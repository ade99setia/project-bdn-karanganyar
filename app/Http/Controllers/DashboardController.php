<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use App\Models\SalesAttendance;
use App\Models\SalesVisit;

class DashboardController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        $today = now()->toDateString();

        $attendanceToday = SalesAttendance::where('user_id', $user->id)
            ->whereDate('work_date', $today)
            ->first();

        $recentVisits = SalesVisit::with('photos')
            ->where('user_id', $user->id)
            ->whereDate('visited_at', $today)
            ->latest('visited_at')
            ->get();

        return Inertia::render('dashboard', [
            'user' => $user,
            'attendanceToday' => $attendanceToday,
            'recentVisits' => $recentVisits,
            'serverTime' => now()->toISOString(),
        ]);
    }

    public function mataram()
    {
        $user = Auth::user();
        $today = now()->toDateString();

        $attendanceToday = SalesAttendance::where('user_id', $user->id)
            ->whereDate('work_date', $today)
            ->first();

        $recentVisits = SalesVisit::with('photos')
            ->where('user_id', $user->id)
            ->whereDate('visited_at', $today)
            ->latest('visited_at')
            ->get();

        return Inertia::render('mataram', [
            'user' => $user,
            'attendanceToday' => $attendanceToday,
            'recentVisits' => $recentVisits,
            'serverTime' => now()->toISOString(),
        ]);
    }
}
