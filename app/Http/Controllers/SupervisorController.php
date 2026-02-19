<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\Employee;
use App\Models\Product;
use App\Models\User;
use App\Models\SalesVisit;
use Illuminate\Support\Facades\Auth;

class SupervisorController extends Controller
{
    public function monitoringTeam()
    {
        $supervisors = User::query()
            ->with([
                'employee:id,user_id',
                'role:id,name',
            ])
            ->whereHas('role', function ($query) {
                $query->where('name', 'supervisor');
            })
            ->select('id', 'name', 'email', 'avatar', 'role_id')
            ->orderBy('name')
            ->get();

        $supervisorEmployeeIds = $supervisors
            ->pluck('employee.id')
            ->filter()
            ->values();

        $salesBySupervisorEmployeeId = collect();

        if ($supervisorEmployeeIds->isNotEmpty()) {
            $salesBySupervisorEmployeeId = Employee::query()
                ->with([
                    'user' => function ($query) {
                        $query->select('id', 'name', 'avatar', 'role_id')
                            ->with('role:id,name');
                    },
                ])
                ->whereIn('supervisor_id', $supervisorEmployeeIds)
                ->whereHas('user.role', function ($query) {
                    $query->where('name', 'sales');
                })
                ->get()
                ->groupBy('supervisor_id');
        }

        $teams = $supervisors->values()->map(function ($supervisor, $index) use ($salesBySupervisorEmployeeId) {
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
            $members = collect();

            if ($supervisor->employee) {
                $members = $salesBySupervisorEmployeeId
                    ->get($supervisor->employee->id, collect())
                    ->map(function ($employee) {
                        return [
                            'id' => $employee->user->id,
                            'name' => $employee->user->name,
                            'role' => $employee->user->role?->name ?? 'sales',
                            'avatar' => $employee->user->avatar,
                        ];
                    })
                    ->values();
            }

            return [
                'id' => $supervisor->id,
                'name' => 'Team ' . ($index + 1),
                'supervisor' => $supervisor->name,
                'supervisorAvatar' => $supervisor->avatar,
                'members' => $members,
                'totalMembers' => $members->count() + 1,
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
        $supervisor = User::query()
            ->with([
                'employee:id,user_id',
                'role:id,name',
            ])
            ->findOrFail($user_id);

        $currentUser = Auth::user();

        if ($currentUser instanceof User) {
            $currentUser->load('role:id,name');
        }

        if ($currentUser instanceof User && $currentUser->role_name == 'supervisor' && $currentUser->id != $supervisor->id) {
            abort(403, 'Anda hanya bisa melihat data tim Anda sendiri.');
        }

        $salesUsers = collect();

        if ($supervisor->employee) {
            $salesUsers = User::query()
                ->whereHas('role', function ($query) {
                    $query->where('name', 'sales');
                })
                ->whereHas('employee', function ($query) use ($supervisor) {
                    $query->where('supervisor_id', $supervisor->employee->id);
                })
                ->select('id', 'name', 'avatar')
                ->orderBy('name')
                ->get();
        }

        // Determine filter type and dates
        $filterType = request()->query('filterType', 'single');
        $selectedDate = request()->query('date', now()->toDateString());
        $startDate = request()->query('startDate', $selectedDate);
        $endDate = request()->query('endDate', $selectedDate);

        // Build query for visits
        $recentVisits = [];
        $products = Product::query()
            ->where('is_active', true)
            ->select('id', 'name', 'file_path', 'sku', 'category')
            ->orderBy('name')
            ->get();

        if ($salesUsers->count() > 0) {
            $query = SalesVisit::with([
                'photos',
                'customer',
                'products',
                'user' => function ($query) {
                    $query->select('id', 'name', 'avatar');
                },
            ])
                ->whereIn('user_id', $salesUsers->pluck('id'));

            if ($filterType === 'range') {
                $query->whereBetween('visited_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59']);
            } else {
                $query->whereDate('visited_at', $selectedDate);
            }

            $recentVisits = $query->latest('visited_at')->get();
        }

        if ($supervisor->avatar) {
            $supervisorAvatar = '/storage/profiles/' . $supervisor->avatar;
        } else {
            $supervisorAvatar = null;
        }

        return Inertia::render('supervisor/monitoring-record', [
            'recentVisits' => $recentVisits,
            'attendances' => [],
            'products' => $products,
            'salesUsers' => $salesUsers,
            'selectedDate' => $selectedDate,
            'startDate' => $startDate,
            'endDate' => $endDate,
            'filterType' => $filterType,
            'serverTime' => now()->toISOString(),
            'supervisorName' => $supervisor->name,
            'supervisorAvatar' => $supervisorAvatar,
        ]);
    }
}
