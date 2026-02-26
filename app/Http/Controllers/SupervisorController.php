<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\Employee;
use App\Models\Product;
use App\Models\User;
use App\Models\SalesVisit;
use App\Models\Customer;
use App\Models\AppSetting;
use App\Models\SalesAttendance;
use App\Models\SalesVisitProduct;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;

class SupervisorController extends Controller
{
    public function dashboard()
    {
        $user = Auth::user();

        if (!$user instanceof User) {
            abort(403, 'Akses tidak valid.');
        }

        $cacheKey = 'supervisor_dashboard:' . $user->id;

        if (request()->boolean('refresh')) {
            Cache::forget($cacheKey);
        }

        $dashboardData = Cache::remember($cacheKey, now()->addMinutes(2), function () use ($user) {
            return $this->computeDummyDashboardData($user);
        });

        return Inertia::render('supervisor/dashboard', $dashboardData);
    }

    private function computeDummyDashboardData(User $user)
    {
        // Simulasi data sales untuk progress table
        $dummySales = [
            ['id' => 1, 'name' => 'Budi Santoso', 'visits_today' => 5, 'visits_month' => 120, 'attendance' => true, 'fake' => 0],
            ['id' => 2, 'name' => 'Ani Wijaya', 'visits_today' => 8, 'visits_month' => 145, 'attendance' => true, 'fake' => 1],
            ['id' => 3, 'name' => 'Siti Aminah', 'visits_today' => 3, 'visits_month' => 90, 'attendance' => true, 'fake' => 0],
            ['id' => 4, 'name' => 'Rian Hidayat', 'visits_today' => 0, 'visits_month' => 110, 'attendance' => false, 'fake' => 0],
            ['id' => 5, 'name' => 'Dedi Kurniawan', 'visits_today' => 7, 'visits_month' => 130, 'attendance' => true, 'fake' => 0],
        ];

        $progressPerSales = collect($dummySales)->map(function ($s, $index) {
            $target = 8;
            $achievement = round(($s['visits_today'] / $target) * 100, 2);
            return [
                'no' => $index + 1,
                'id' => $s['id'],
                'name' => $s['name'],
                'avatar' => null,
                'attendance_today' => $s['attendance'],
                'visits_today' => $s['visits_today'],
                'visits_month' => $s['visits_month'],
                'customers_touched' => rand(20, 50),
                'fake_gps_today' => $s['fake'],
                'target_daily' => $target,
                'achievement_percent' => min(100, $achievement),
                'achievement_raw_percent' => $achievement,
                'last_visit_at' => now()->subMinutes(rand(10, 300))->toISOString(),
            ];
        })->all();

        // Data Breakdown Aktivitas (Pie Chart)
        $activityBreakdown = [
            ['label' => 'Routine Visit', 'value' => 45, 'percent' => 45, 'color' => 'bg-blue-500'],
            ['label' => 'New Prospect', 'value' => 25, 'percent' => 25, 'color' => 'bg-emerald-500'],
            ['label' => 'Complaint Handling', 'value' => 15, 'percent' => 15, 'color' => 'bg-purple-500'],
            ['label' => 'Payment Collection', 'value' => 10, 'percent' => 10, 'color' => 'bg-amber-500'],
            ['label' => 'Other', 'value' => 5, 'percent' => 5, 'color' => 'bg-cyan-500'],
        ];

        // Data Produk (Bar Chart / List)
        $productActionBreakdown = [
            ['label' => 'Direct Sell', 'value' => 150, 'percent' => 50, 'color' => 'bg-orange-500'],
            ['label' => 'Stock Check', 'value' => 80, 'percent' => 26.67, 'color' => 'bg-green-500'],
            ['label' => 'Display Setup', 'value' => 40, 'percent' => 13.33, 'color' => 'bg-sky-500'],
            ['label' => 'Sampling', 'value' => 30, 'percent' => 10, 'color' => 'bg-rose-500'],
        ];

        // Recent Visits
        $recentVisits = [
            ['id' => 101, 'sales_name' => 'Budi Santoso', 'customer_name' => 'Toko Maju Jaya', 'activity_type' => 'routine_visit', 'visited_at' => now()->subMinutes(5)->toISOString(), 'is_fake_gps' => false],
            ['id' => 102, 'sales_name' => 'Ani Wijaya', 'customer_name' => 'Indo Market', 'activity_type' => 'new_prospect', 'visited_at' => now()->subMinutes(15)->toISOString(), 'is_fake_gps' => true],
            ['id' => 103, 'sales_name' => 'Siti Aminah', 'customer_name' => 'Apotek Sehat', 'activity_type' => 'payment_collection', 'visited_at' => now()->subMinutes(45)->toISOString(), 'is_fake_gps' => false],
            ['id' => 104, 'sales_name' => 'Dedi Kurniawan', 'customer_name' => 'Warung Pojok', 'activity_type' => 'routine_visit', 'visited_at' => now()->subHour()->toISOString(), 'is_fake_gps' => false],
        ];

        return [
            'stats' => [
                'total_sales' => 5,
                'total_products' => 24,
                'total_customers' => 150,
                'customers_visited_by_team' => 85,
                'visits_today' => 23,
                'visits_this_month' => 495,
                'attendance_present_today' => 4,
                'fake_gps_today' => 1,
                'target_visit_today' => 40, // 5 sales * 8
                'target_visit_month' => 800,
                'visit_completion_today' => 57.5,
                'visit_completion_month' => 61.8,
            ],
            'activityBreakdown' => $activityBreakdown,
            'productActionBreakdown' => $productActionBreakdown,
            'progressPerSales' => $progressPerSales,
            'recentVisits' => $recentVisits,
        ];
    }

    private function computeDashboardData(User $user)
    {
        $user->loadMissing(['role:id,name', 'employee:id,user_id']);

        $today = now()->toDateString();
        $todayStart = now()->copy()->startOfDay();
        $tomorrowStart = now()->copy()->addDay()->startOfDay();
        $monthStart = now()->copy()->startOfMonth()->startOfDay();
        $monthEnd = now()->copy()->endOfDay();

        // Get sales users for the current user
        $salesQuery = User::query()
            ->whereHas('role', function ($query) {
                $query->where('name', 'sales');
            })
            ->select('id', 'name', 'avatar')
            ->orderBy('name');

        if ($user->role_name === 'supervisor') {
            if ($user->employee) {
                $salesQuery->whereHas('employee', function ($query) use ($user) {
                    $query->where('supervisor_id', $user->employee->id);
                });
            } else {
                // Avoid fallback to all sales when supervisor profile is not linked to employee.
                $salesQuery->whereRaw('1 = 0');
            }
        }

        $salesUsers = $salesQuery->get();
        $salesUserIds = $salesUsers->pluck('id');

        $visitsToday = 0;
        $visitsThisMonth = 0;
        $attendancePresentToday = 0;
        $fakeGpsToday = 0;
        $customersVisitedByTeam = 0;
        $activityBreakdown = [];
        $productActionBreakdown = [];
        $progressPerSales = [];
        $recentVisits = [];

        if ($salesUserIds->isNotEmpty()) {
            // Get visit stats efficiently in one query
            $visitStats = SalesVisit::query()
                ->whereIn('user_id', $salesUserIds)
                ->selectRaw('
                    SUM(CASE WHEN visited_at >= ? AND visited_at < ? THEN 1 ELSE 0 END) as visits_today,
                    SUM(CASE WHEN visited_at BETWEEN ? AND ? THEN 1 ELSE 0 END) as visits_this_month,
                    SUM(CASE WHEN visited_at >= ? AND visited_at < ? AND is_fake_gps = 1 THEN 1 ELSE 0 END) as fake_gps_today
                ', [$todayStart, $tomorrowStart, $monthStart, $monthEnd, $todayStart, $tomorrowStart])
                ->first();

            $visitsToday = (int) ($visitStats?->visits_today ?? 0);
            $visitsThisMonth = (int) ($visitStats?->visits_this_month ?? 0);
            $fakeGpsToday = (int) ($visitStats?->fake_gps_today ?? 0);

            // Get distinct customers
            $customersVisitedByTeam = SalesVisit::query()
                ->whereIn('user_id', $salesUserIds)
                ->whereBetween('visited_at', [$monthStart, $monthEnd])
                ->whereNotNull('customer_id')
                ->distinct('customer_id')
                ->count('customer_id');

            // Get attendance count
            $attendancePresentToday = SalesAttendance::query()
                ->whereIn('user_id', $salesUserIds)
                ->where('work_date', $today)
                ->distinct('user_id')
                ->count('user_id');

            // Activity breakdown
            $activityRaw = SalesVisit::query()
                ->whereIn('user_id', $salesUserIds)
                ->whereBetween('visited_at', [$monthStart, $monthEnd])
                ->selectRaw('COALESCE(activity_type, ?) as label, COUNT(*) as total', ['unknown'])
                ->groupBy('label')
                ->orderByDesc('total')
                ->limit(5)
                ->get();

            $activityColors = ['bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-amber-500', 'bg-cyan-500'];
            $activityTotal = max(1, $activityRaw->sum('total'));

            $activityBreakdown = $activityRaw->values()->map(function ($item, $index) use ($activityTotal, $activityColors) {
                return [
                    'label' => ucwords(str_replace('_', ' ', (string) $item->label)),
                    'value' => (int) $item->total,
                    'percent' => round(((int) $item->total / $activityTotal) * 100, 2),
                    'color' => $activityColors[$index % count($activityColors)],
                ];
            })->all();

            // Product action breakdown
            $productActionRaw = SalesVisitProduct::query()
                ->join('sales_visits', 'sales_visit_products.sales_visit_id', '=', 'sales_visits.id')
                ->whereIn('sales_visits.user_id', $salesUserIds)
                ->whereBetween('sales_visits.visited_at', [$monthStart, $monthEnd])
                ->selectRaw('COALESCE(sales_visit_products.action_type, ?) as label, SUM(sales_visit_products.quantity) as total_quantity', ['unknown'])
                ->groupBy('label')
                ->orderByDesc('total_quantity')
                ->limit(5)
                ->get();

            $productActionColors = ['bg-orange-500', 'bg-green-500', 'bg-sky-500', 'bg-rose-500', 'bg-indigo-500'];
            $productActionTotal = max(1, $productActionRaw->sum('total_quantity'));

            $productActionBreakdown = $productActionRaw->values()->map(function ($item, $index) use ($productActionTotal, $productActionColors) {
                return [
                    'label' => ucwords(str_replace('_', ' ', (string) $item->label)),
                    'value' => (int) $item->total_quantity,
                    'percent' => round(((int) $item->total_quantity / $productActionTotal) * 100, 2),
                    'color' => $productActionColors[$index % count($productActionColors)],
                ];
            })->all();

            // Progress per sales user
            $monthlyByUser = SalesVisit::query()
                ->whereIn('user_id', $salesUserIds)
                ->whereBetween('visited_at', [$monthStart, $monthEnd])
                ->selectRaw('user_id, COUNT(*) as visits_month, COUNT(DISTINCT customer_id) as customers_touched, MAX(visited_at) as last_visit_at')
                ->groupBy('user_id')
                ->get()
                ->keyBy('user_id');

            $todayByUser = SalesVisit::query()
                ->whereIn('user_id', $salesUserIds)
                ->where('visited_at', '>=', $todayStart)
                ->where('visited_at', '<', $tomorrowStart)
                ->selectRaw('user_id, COUNT(*) as visits_today, SUM(CASE WHEN is_fake_gps = 1 THEN 1 ELSE 0 END) as fake_gps_today')
                ->groupBy('user_id')
                ->get()
                ->keyBy('user_id');

            $attendanceUserIds = SalesAttendance::query()
                ->whereIn('user_id', $salesUserIds)
                ->where('work_date', $today)
                ->distinct()
                ->pluck('user_id')
                ->all();

            $targetPerSalesPerDay = 8;

            $progressPerSales = $salesUsers->values()->map(function ($sales, $index) use ($monthlyByUser, $todayByUser, $attendanceUserIds, $targetPerSalesPerDay) {
                $todayData = $todayByUser->get($sales->id);
                $monthData = $monthlyByUser->get($sales->id);

                $visitsTodayBySales = (int) ($todayData->visits_today ?? 0);
                $visitsMonthBySales = (int) ($monthData->visits_month ?? 0);
                $customersTouched = (int) ($monthData->customers_touched ?? 0);
                $fakeGpsBySales = (int) ($todayData->fake_gps_today ?? 0);
                $achievementPercent = $targetPerSalesPerDay > 0
                    ? round(($visitsTodayBySales / $targetPerSalesPerDay) * 100, 2)
                    : 0;

                return [
                    'no' => $index + 1,
                    'id' => $sales->id,
                    'name' => $sales->name,
                    'avatar' => $sales->avatar ? Storage::url('profiles/' . $sales->avatar) : null,
                    'attendance_today' => in_array($sales->id, $attendanceUserIds, true),
                    'visits_today' => $visitsTodayBySales,
                    'visits_month' => $visitsMonthBySales,
                    'customers_touched' => $customersTouched,
                    'fake_gps_today' => $fakeGpsBySales,
                    'target_daily' => $targetPerSalesPerDay,
                    'achievement_percent' => min(100, $achievementPercent),
                    'achievement_raw_percent' => $achievementPercent,
                    'last_visit_at' => isset($monthData->last_visit_at) ? (string) $monthData->last_visit_at : null,
                ];
            })->all();

            // Recent visits
            $recentVisits = SalesVisit::query()
                ->with([
                    'user:id,name,avatar',
                    'customer:id,name',
                ])
                ->whereIn('user_id', $salesUserIds)
                ->whereBetween('visited_at', [$monthStart, $monthEnd])
                ->select('id', 'user_id', 'customer_id', 'activity_type', 'visited_at', 'is_fake_gps')
                ->latest('visited_at')
                ->limit(8)
                ->get()
                ->map(function ($visit) {
                    return [
                        'id' => $visit->id,
                        'sales_name' => $visit->user?->name,
                        'customer_name' => $visit->customer?->name,
                        'activity_type' => $visit->activity_type,
                        'visited_at' => $visit->visited_at?->toISOString(),
                        'is_fake_gps' => (bool) $visit->is_fake_gps,
                    ];
                })
                ->all();
        }

        $totalSales = $salesUsers->count();
        $totalProducts = Product::query()->where('is_active', true)->count();
        $totalCustomers = Customer::query()->count();

        // Workday configuration
        $workdayConfigRaw = AppSetting::getValue('workday', [
            'weekend_days' => config('workday.weekend_days', [0]),
            'holidays' => config('workday.holidays', []),
        ]);

        $workdayConfig = is_array($workdayConfigRaw) ? $workdayConfigRaw : [];
        $holidayConfig = $workdayConfig['holidays'] ?? config('workday.holidays', []);
        $weekendConfig = $workdayConfig['weekend_days'] ?? config('workday.weekend_days', [0]);

        $holidayDates = collect(is_array($holidayConfig) ? $holidayConfig : [])
            ->map(fn($date) => trim((string) $date))
            ->filter()
            ->unique()
            ->values()
            ->all();

        $holidaySet = array_fill_keys($holidayDates, true);
        $weekendDays = collect(is_array($weekendConfig) ? $weekendConfig : [0])
            ->map(fn($day) => (int) $day)
            ->filter(fn($day) => $day >= 0 && $day <= 6)
            ->unique()
            ->values()
            ->all();

        $isNonWorkingDate = function ($date) use ($holidaySet, $weekendDays): bool {
            return in_array($date->dayOfWeek, $weekendDays, true)
                || isset($holidaySet[$date->toDateString()]);
        };

        $targetVisitToday = $isNonWorkingDate(now()) ? 0 : $totalSales * 8;

        $workingDaysSoFar = 0;
        $workingDayCursor = now()->copy()->startOfMonth()->startOfDay();
        $workingDayEnd = now()->copy()->startOfDay();

        while ($workingDayCursor->lte($workingDayEnd)) {
            if (!$isNonWorkingDate($workingDayCursor)) {
                $workingDaysSoFar++;
            }
            $workingDayCursor->addDay();
        }

        $targetVisitMonth = $totalSales * 8 * $workingDaysSoFar;

        $visitCompletionToday = $targetVisitToday > 0
            ? round(($visitsToday / $targetVisitToday) * 100, 2)
            : 0;
        $visitCompletionMonth = $targetVisitMonth > 0
            ? round(($visitsThisMonth / $targetVisitMonth) * 100, 2)
            : 0;

        return [
            'stats' => [
                'total_sales' => $totalSales,
                'total_products' => $totalProducts,
                'total_customers' => $totalCustomers,
                'customers_visited_by_team' => $customersVisitedByTeam,
                'visits_today' => $visitsToday,
                'visits_this_month' => $visitsThisMonth,
                'attendance_present_today' => $attendancePresentToday,
                'fake_gps_today' => $fakeGpsToday,
                'target_visit_today' => $targetVisitToday,
                'target_visit_month' => $targetVisitMonth,
                'visit_completion_today' => $visitCompletionToday,
                'visit_completion_month' => $visitCompletionMonth,
            ],
            'activityBreakdown' => $activityBreakdown,
            'productActionBreakdown' => $productActionBreakdown,
            'progressPerSales' => $progressPerSales,
            'recentVisits' => $recentVisits,
        ];
    }

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
