<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\User;
use App\Models\SalesVisit;
use Illuminate\Support\Facades\Auth;

class SupervisorController extends Controller
{
    public function monitoringTeam()
    {
        // Get all supervisors with their sales team members
        $teams = User::where('role', 'supervisor')
            ->with(['salesTeam' => function ($query) {
                $query->select('id', 'name', 'role', 'supervisor_id', 'avatar')
                    ->orderBy('name');
            }])
            ->select('id', 'name', 'email', 'role', 'avatar')
            ->orderBy('name')
            ->get()
            ->map(function ($supervisor, $index) {
                // Generate colors for each team
                $colors = [
                    ['gradient' => 'from-blue-600 via-indigo-600 to-indigo-800', 'shadow' => 'shadow-indigo-500/30'],
                    ['gradient' => 'from-emerald-600 via-teal-600 to-teal-800', 'shadow' => 'shadow-teal-500/30'],
                    ['gradient' => 'from-amber-500 via-orange-600 to-orange-800', 'shadow' => 'shadow-orange-500/30'],
                    ['gradient' => 'from-purple-600 via-fuchsia-600 to-pink-800', 'shadow' => 'shadow-purple-500/30'],
                    ['gradient' => 'from-cyan-600 via-blue-600 to-blue-800', 'shadow' => 'shadow-blue-500/30'],
                    ['gradient' => 'from-rose-600 via-pink-600 to-rose-800', 'shadow' => 'shadow-rose-500/30'],
                    ['gradient' => 'from-lime-600 via-green-600 to-emerald-800', 'shadow' => 'shadow-green-500/30'],
                    ['gradient' => 'from-sky-600 via-cyan-600 to-blue-800', 'shadow' => 'shadow-cyan-500/30'],
                    ['gradient' => 'from-neutral-600 via-zinc-700 to-neutral-900', 'shadow' => 'shadow-zinc-500/30'],
                ];

                $colorIndex = $index % count($colors);

                return [
                    'id' => $supervisor->id,
                    'name' => 'Team ' . ($index + 1),
                    'supervisor' => $supervisor->name,
                    'supervisorAvatar' => $supervisor->avatar,
                    'members' => $supervisor->salesTeam->map(function ($member) {
                        return [
                            'id' => $member->id,
                            'name' => $member->name,
                            'role' => $member->role,
                            'avatar' => $member->avatar,
                        ];
                    }),
                    'totalMembers' => $supervisor->salesTeam->count() + 1, // +1 for supervisor
                    'color' => $colors[$colorIndex]['gradient'],
                    'shadowColor' => $colors[$colorIndex]['shadow'],
                ];
            });

        return Inertia::render('supervisor/monitoring-team', [
            'teams' => $teams,
        ]);
    }

    public function monitoringRecord($user_id)
    {
        $supervisor = User::findOrFail($user_id);
        $currentUser = Auth::user();
        
        // Authorization: Check if user is allowed to view this team's data
        // Allow if: user is viewing their own team OR user is an admin
        if ($currentUser->role === 'supervisor' && $currentUser->id !== $supervisor->id) {
            abort(403, 'Anda hanya bisa melihat data tim Anda sendiri.');
        }
        
        // Get all sales users under this supervisor
        $salesUsers = User::where('supervisor_id', $user_id)
            ->where('role', 'sales')
            ->select('id', 'name', 'avatar')
            ->orderBy('name')
            ->get();

        // Determine filter type and dates
        $filterType = request()->query('filterType', 'single');
        $selectedDate = request()->query('date', now()->toDateString());
        $startDate = request()->query('startDate', $selectedDate);
        $endDate = request()->query('endDate', $selectedDate);

        // Build query for visits
        $recentVisits = [];
        
        if ($salesUsers->count() > 0) {
            $query = SalesVisit::with(['photos', 'user' => function ($query) {
                $query->select('id', 'name', 'avatar');
            }])
                ->whereIn('user_id', $salesUsers->pluck('id'));

            if ($filterType === 'range') {
                $query->whereBetween('visited_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59']);
            } else {
                $query->whereDate('visited_at', $selectedDate);
            }

            $recentVisits = $query->latest('visited_at')->get();
        }

        return Inertia::render('supervisor/monitoring-record', [
            'recentVisits' => $recentVisits,
            'attendances' => [],
            'salesUsers' => $salesUsers,
            'selectedDate' => $selectedDate,
            'startDate' => $startDate,
            'endDate' => $endDate,
            'filterType' => $filterType,
            'serverTime' => now()->toISOString(),
            'supervisorName' => $supervisor->name,
            'supervisorAvatar' => $supervisor->avatar,
        ]);
    }
}
