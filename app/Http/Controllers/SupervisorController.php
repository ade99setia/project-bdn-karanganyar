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
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use Throwable;

class SupervisorController extends Controller
{
    public function dashboard(Request $request)
    {
        $user = Auth::user();

        if (!$user instanceof User) {
            abort(403, 'Akses tidak valid.');
        }

        $filterType = $request->query('filterType', 'single');
        $filterType = in_array($filterType, ['single', 'range'], true) ? $filterType : 'single';

        $selectedDate = $this->parseDateString($request->query('date', now()->toDateString()));
        $startDate = $this->parseDateString($request->query('startDate', $selectedDate));
        $endDate = $this->parseDateString($request->query('endDate', $selectedDate));

        if ($filterType === 'single') {
            $startDate = $selectedDate;
            $endDate = $selectedDate;
        }

        if ($startDate > $endDate) {
            [$startDate, $endDate] = [$endDate, $startDate];
        }

        $cacheKey = implode(':', [
            'supervisor_dashboard',
            $user->id,
            $filterType,
            $startDate,
            $endDate,
        ]);

        if ($request->boolean('refresh')) {
            Cache::forget($cacheKey);
        }

        $dashboardData = Cache::remember($cacheKey, now()->addMinutes(2), function () use ($user, $filterType, $selectedDate, $startDate, $endDate) {
            try {
                return $this->computeDashboardData($user, [
                    'filterType' => $filterType,
                    'selectedDate' => $selectedDate,
                    'startDate' => $startDate,
                    'endDate' => $endDate,
                ]);
            } catch (Throwable $exception) {
                report($exception);

                return $this->buildEmptyDashboardData([
                    'filterType' => $filterType,
                    'selectedDate' => $selectedDate,
                    'startDate' => $startDate,
                    'endDate' => $endDate,
                ]);
            }
        });

        return Inertia::render('supervisor/dashboard', $dashboardData);
    }

    private function computeDashboardData(User $user, array $filters)
    {
        $filterType = $filters['filterType'] ?? 'single';
        $selectedDate = $this->parseDateString($filters['selectedDate'] ?? now()->toDateString());
        $startDateValue = $this->parseDateString($filters['startDate'] ?? $selectedDate);
        $endDateValue = $this->parseDateString($filters['endDate'] ?? $selectedDate);

        if ($filterType === 'single') {
            $periodStart = Carbon::parse($selectedDate)->startOfDay();
            $periodEnd = Carbon::parse($selectedDate)->endOfDay();
        } else {
            $periodStart = Carbon::parse($startDateValue)->startOfDay();
            $periodEnd = Carbon::parse($endDateValue)->endOfDay();

            if ($periodStart->gt($periodEnd)) {
                [$periodStart, $periodEnd] = [$periodEnd->copy()->startOfDay(), $periodStart->copy()->endOfDay()];
            }
        }

        $user->loadMissing(['role:id,name', 'employee:id,user_id']);

        $todayStart = $periodStart->copy();
        $monthStart = $periodEnd->copy()->startOfMonth()->startOfDay();
        $monthEnd = $periodEnd->copy()->endOfDay();

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
        $collectionStatusVisit = 0;
        $collectionStatusDelivery = 0;
        $salesValue = 0;
        $returnValue = 0;
        $netProfitValue = 0;

        if ($salesUserIds->isNotEmpty()) {
            $perSalesStats = SalesVisit::query()
                ->whereIn('user_id', $salesUserIds)
                ->selectRaw('
                    user_id,
                    SUM(CASE WHEN visited_at BETWEEN ? AND ? THEN 1 ELSE 0 END) as visits_today,
                    SUM(CASE WHEN visited_at BETWEEN ? AND ? AND is_fake_gps = 1 THEN 1 ELSE 0 END) as fake_gps_today,
                    SUM(CASE WHEN visited_at BETWEEN ? AND ? THEN 1 ELSE 0 END) as visits_month,
                    COUNT(DISTINCT CASE WHEN visited_at BETWEEN ? AND ? THEN customer_id END) as customers_touched,
                    MAX(CASE WHEN visited_at BETWEEN ? AND ? THEN visited_at END) as last_visit_at
                ', [
                    $todayStart,
                    $periodEnd,
                    $todayStart,
                    $periodEnd,
                    $monthStart,
                    $monthEnd,
                    $monthStart,
                    $monthEnd,
                    $monthStart,
                    $monthEnd,
                ])
                ->groupBy('user_id')
                ->get()
                ->keyBy('user_id');

            $visitsToday = (int) $perSalesStats->sum('visits_today');
            $visitsThisMonth = (int) $perSalesStats->sum('visits_month');
            $fakeGpsToday = (int) $perSalesStats->sum('fake_gps_today');

            // Get distinct customers
            $customersVisitedByTeam = SalesVisit::query()
                ->whereIn('user_id', $salesUserIds)
                ->whereBetween('visited_at', [$todayStart, $periodEnd])
                ->whereNotNull('customer_id')
                ->distinct('customer_id')
                ->count('customer_id');

            // Get attendance status per sales
            $attendanceStatusByUser = SalesAttendance::query()
                ->whereIn('user_id', $salesUserIds)
                ->whereBetween('work_date', [$todayStart->toDateString(), $periodEnd->toDateString()])
                ->orderByDesc('work_date')
                ->orderByDesc('check_in_at')
                ->get(['user_id', 'check_in_at', 'check_out_at'])
                ->groupBy('user_id')
                ->map(function ($items) {
                    $latestAttendance = $items->first();

                    if (!$latestAttendance || empty($latestAttendance->check_in_at)) {
                        return 'Belum';
                    }

                    return !empty($latestAttendance->check_out_at) ? 'Selesai' : 'Bekerja';
                })
                ->all();

            $attendancePresentToday = collect($attendanceStatusByUser)
                ->filter(fn($status) => $status !== 'Belum')
                ->count();

            // Activity breakdown
            $activityRaw = SalesVisit::query()
                ->whereIn('user_id', $salesUserIds)
                ->whereBetween('visited_at', [$todayStart, $periodEnd])
                ->selectRaw('COALESCE(activity_type, ?) as activity_type, COUNT(*) as total', ['kunjungan'])
                ->groupBy('activity_type')
                ->get();

            $activityGrouped = $activityRaw
                ->map(function ($item) {
                    return [
                        'label' => $this->normalizeVisitTag((string) $item->activity_type),
                        'total' => (int) $item->total,
                    ];
                })
                ->groupBy('label')
                ->map(fn($items) => $items->sum('total'))
                ->sortDesc();

            $collectionStatusVisit = (int) ($activityGrouped->get('kunjungan') ?? 0);
            $collectionStatusDelivery = (int) ($activityGrouped->get('pengiriman') ?? 0);

            $activityColors = [
                'kunjungan' => 'bg-blue-500',
                'pengiriman' => 'bg-emerald-500',
            ];
            $activityTotal = max(1, $activityGrouped->sum());

            $activityBreakdown = $activityGrouped->map(function ($total, $label) use ($activityTotal, $activityColors) {
                return [
                    'label' => ucfirst($label),
                    'value' => (int) $total,
                    'percent' => round(((int) $total / $activityTotal) * 100, 2),
                    'color' => $activityColors[$label] ?? 'bg-cyan-500',
                ];
            })->values()->all();

            // Product action breakdown
            $productActionRaw = SalesVisitProduct::query()
                ->join('sales_visits', 'sales_visit_products.sales_visit_id', '=', 'sales_visits.id')
                ->whereIn('sales_visits.user_id', $salesUserIds)
                ->whereBetween('sales_visits.visited_at', [$todayStart, $periodEnd])
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

            $financialRaw = SalesVisitProduct::query()
                ->join('sales_visits', 'sales_visit_products.sales_visit_id', '=', 'sales_visits.id')
                ->whereIn('sales_visits.user_id', $salesUserIds)
                ->whereBetween('sales_visits.visited_at', [$todayStart, $periodEnd])
                ->where('sales_visits.activity_type', 'pengiriman')
                ->selectRaw("\n                    SUM(CASE\n                        WHEN LOWER(TRIM(COALESCE(sales_visit_products.action_type, ''))) = 'terjual'\n                        THEN ABS(COALESCE(sales_visit_products.value, 0))\n                        ELSE 0\n                    END) AS sales_value,\n                    SUM(CASE\n                        WHEN LOWER(TRIM(COALESCE(sales_visit_products.action_type, ''))) = 'retur'\n                        THEN ABS(COALESCE(sales_visit_products.value, 0))\n                        ELSE 0\n                    END) AS return_value\n                ")
                ->first();

            $salesValue = (int) ($financialRaw->sales_value ?? 0);
            $returnValue = (int) ($financialRaw->return_value ?? 0);
            $netProfitValue = $salesValue - $returnValue;

            $workdayConfigRaw = AppSetting::getValue('workday', [
                'weekend_days' => config('workday.weekend_days', [0]),
                'holidays' => config('workday.holidays', []),
            ]);

            $targetConfigRaw = AppSetting::getValue('target', [
                'default_daily_target' => config('target.default_daily_target', $workdayConfigRaw['default_daily_target'] ?? 8),
                'default_daily_delivery_target' => config('target.default_daily_delivery_target', 0),
                'daily_targets' => config('target.daily_targets', $workdayConfigRaw['daily_targets'] ?? []),
                'daily_delivery_targets' => config('target.daily_delivery_targets', []),
            ]);

            $workdayConfig = is_array($workdayConfigRaw) ? $workdayConfigRaw : [];
            $targetConfig = is_array($targetConfigRaw) ? $targetConfigRaw : [];
            $holidayConfig = $workdayConfig['holidays'] ?? config('workday.holidays', []);
            $weekendConfig = $workdayConfig['weekend_days'] ?? config('workday.weekend_days', [0]);
            $defaultDailyTarget = max(0, (int) ($targetConfig['default_daily_target'] ?? config('target.default_daily_target', 8)));
            $defaultDailyDeliveryTarget = max(0, (int) ($targetConfig['default_daily_delivery_target'] ?? config('target.default_daily_delivery_target', 0)));
            $dailyTargetsByDate = collect((array) ($targetConfig['daily_targets'] ?? config('target.daily_targets', [])))
                ->mapWithKeys(function ($target, $date) {
                    return [trim((string) $date) => max(0, (int) $target)];
                })
                ->filter(fn($target, $date) => $date !== '' && preg_match('/^\d{4}-\d{2}-\d{2}$/', $date) === 1)
                ->all();
            $dailyDeliveryTargetsByDate = collect((array) ($targetConfig['daily_delivery_targets'] ?? config('target.daily_delivery_targets', [])))
                ->mapWithKeys(function ($target, $date) {
                    return [trim((string) $date) => max(0, (int) $target)];
                })
                ->filter(fn($target, $date) => $date !== '' && preg_match('/^\d{4}-\d{2}-\d{2}$/', $date) === 1)
                ->all();

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

            $targetPerSalesPerDay = $this->countTargetUnits(
                $todayStart->copy(),
                $periodEnd->copy(),
                $isNonWorkingDate,
                $dailyTargetsByDate,
                $defaultDailyTarget
            );

            $targetDeliveryPerSalesPerDay = $this->countTargetUnits(
                $todayStart->copy(),
                $periodEnd->copy(),
                $isNonWorkingDate,
                $dailyDeliveryTargetsByDate,
                $defaultDailyDeliveryTarget
            );

            $deliveryBySales = SalesVisit::query()
                ->whereIn('user_id', $salesUserIds)
                ->whereBetween('visited_at', [$todayStart, $periodEnd])
                ->selectRaw('user_id, COALESCE(activity_type, ?) as activity_type, COUNT(*) as total', ['kunjungan'])
                ->groupBy('user_id', 'activity_type')
                ->get()
                ->groupBy('user_id')
                ->map(function ($items) {
                    return (int) collect($items)
                        ->filter(fn($item) => $this->normalizeVisitTag((string) $item->activity_type) === 'pengiriman')
                        ->sum('total');
                });

            $progressPerSales = $salesUsers->values()->map(function ($sales, $index) use ($perSalesStats, $attendanceStatusByUser, $targetPerSalesPerDay, $targetDeliveryPerSalesPerDay, $deliveryBySales) {
                $salesStats = $perSalesStats->get($sales->id);

                $visitsTodayBySales = (int) ($salesStats->visits_today ?? 0);
                $visitsMonthBySales = (int) ($salesStats->visits_month ?? 0);
                $customersTouched = (int) ($salesStats->customers_touched ?? 0);
                $fakeGpsBySales = (int) ($salesStats->fake_gps_today ?? 0);
                $deliveryTodayBySales = (int) ($deliveryBySales->get($sales->id) ?? 0);

                $totalAchievementPercent = $targetPerSalesPerDay > 0
                    ? round(($visitsTodayBySales / $targetPerSalesPerDay) * 100, 2)
                    : 0;

                $deliveryAchievementPercent = $targetDeliveryPerSalesPerDay > 0
                    ? round(($deliveryTodayBySales / $targetDeliveryPerSalesPerDay) * 100, 2)
                    : 100;

                $achievementPercent = min($totalAchievementPercent, $deliveryAchievementPercent);
                $attendanceStatus = $attendanceStatusByUser[$sales->id] ?? 'Belum';

                return [
                    'no' => $index + 1,
                    'id' => $sales->id,
                    'name' => $sales->name,
                    'avatar' => $sales->avatar ? Storage::url('profiles/' . $sales->avatar) : null,
                    'attendance_today' => $attendanceStatus !== 'Belum',
                    'attendance_status' => $attendanceStatus,
                    'visits_today' => $visitsTodayBySales,
                    'visits_month' => $visitsMonthBySales,
                    'customers_touched' => $customersTouched,
                    'fake_gps_today' => $fakeGpsBySales,
                    'target_daily' => $targetPerSalesPerDay,
                    'delivery_today' => $deliveryTodayBySales,
                    'target_delivery_daily' => $targetDeliveryPerSalesPerDay,
                    'achievement_total_percent' => $totalAchievementPercent,
                    'achievement_delivery_percent' => $deliveryAchievementPercent,
                    'achievement_percent' => min(100, $achievementPercent),
                    'achievement_raw_percent' => $achievementPercent,
                    'last_visit_at' => isset($salesStats->last_visit_at) ? (string) $salesStats->last_visit_at : null,
                ];
            })->all();

            // Recent visits
            $recentVisits = SalesVisit::query()
                ->with([
                    'user:id,name,avatar',
                    'customer:id,name',
                    'photos:id,sales_visit_id,file_path',
                    'products:id,name,sku,file_path',
                ])
                ->whereIn('user_id', $salesUserIds)
                ->whereBetween('visited_at', [$todayStart, $periodEnd])
                ->select('id', 'user_id', 'customer_id', 'activity_type', 'description', 'address', 'lat', 'lng', 'visited_at', 'is_fake_gps')
                ->latest('visited_at')
                ->limit(10)
                ->get()
                ->map(function ($visit) {
                    return [
                        'id' => $visit->id,
                        'user' => [
                            'id' => $visit->user?->id,
                            'name' => $visit->user?->name,
                            'avatar' => $visit->user?->avatar ? Storage::url('profiles/' . $visit->user->avatar) : null,
                        ],
                        'sales_name' => $visit->user?->name,
                        'customer_name' => $visit->customer?->name,
                        'activity_type' => $this->normalizeVisitTag((string) $visit->activity_type),
                        'description' => $visit->description,
                        'address' => $visit->address,
                        'lat' => $visit->lat,
                        'lng' => $visit->lng,
                        'photos' => $visit->photos->map(fn($photo) => [
                            'file_path' => $photo->file_path,
                        ])->values()->all(),
                        'products' => $visit->products->map(function ($product) {
                            return [
                                'id' => $product->id,
                                'name' => $product->name,
                                'sku' => $product->sku,
                                'file_path' => $product->file_path,
                                'pivot' => [
                                    'quantity' => (int) ($product->pivot?->quantity ?? 0),
                                    'price' => (int) ($product->pivot?->price ?? 0),
                                    'value' => (int) ($product->pivot?->value ?? 0),
                                    'action_type' => (string) ($product->pivot?->action_type ?? ''),
                                ],
                            ];
                        })->values()->all(),
                        'visited_at' => $visit->visited_at?->toISOString(),
                        'is_fake_gps' => (bool) $visit->is_fake_gps,
                    ];
                })
                ->all();
        }

        $totalSales = $salesUsers->count();
        $totalProducts = Product::query()->where('is_active', true)->count();
        $totalCustomers = Customer::query()->count();
        $products = Product::query()
            ->where('is_active', true)
            ->select('id', 'name', 'sku', 'file_path', 'category')
            ->orderBy('name')
            ->get();

        // Workday configuration
        $workdayConfigRaw = AppSetting::getValue('workday', [
            'weekend_days' => config('workday.weekend_days', [0]),
            'holidays' => config('workday.holidays', []),
        ]);

        $targetConfigRaw = AppSetting::getValue('target', [
            'default_daily_target' => config('target.default_daily_target', $workdayConfigRaw['default_daily_target'] ?? 8),
            'default_daily_delivery_target' => config('target.default_daily_delivery_target', 0),
            'daily_targets' => config('target.daily_targets', $workdayConfigRaw['daily_targets'] ?? []),
            'daily_delivery_targets' => config('target.daily_delivery_targets', []),
        ]);

        $workdayConfig = is_array($workdayConfigRaw) ? $workdayConfigRaw : [];
        $targetConfig = is_array($targetConfigRaw) ? $targetConfigRaw : [];
        $holidayConfig = $workdayConfig['holidays'] ?? config('workday.holidays', []);
        $weekendConfig = $workdayConfig['weekend_days'] ?? config('workday.weekend_days', [0]);
        $defaultDailyTarget = max(0, (int) ($targetConfig['default_daily_target'] ?? config('target.default_daily_target', 8)));
        $defaultDailyDeliveryTarget = max(0, (int) ($targetConfig['default_daily_delivery_target'] ?? config('target.default_daily_delivery_target', 0)));
        $dailyTargetsByDate = collect((array) ($targetConfig['daily_targets'] ?? config('target.daily_targets', [])))
            ->mapWithKeys(function ($target, $date) {
                return [trim((string) $date) => max(0, (int) $target)];
            })
            ->filter(fn($target, $date) => $date !== '' && preg_match('/^\d{4}-\d{2}-\d{2}$/', $date) === 1)
            ->all();
        $dailyDeliveryTargetsByDate = collect((array) ($targetConfig['daily_delivery_targets'] ?? config('target.daily_delivery_targets', [])))
            ->mapWithKeys(function ($target, $date) {
                return [trim((string) $date) => max(0, (int) $target)];
            })
            ->filter(fn($target, $date) => $date !== '' && preg_match('/^\d{4}-\d{2}-\d{2}$/', $date) === 1)
            ->all();

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

        $targetVisitToday = $this->countTargetUnits(
            $todayStart->copy(),
            $periodEnd->copy(),
            $isNonWorkingDate,
            $dailyTargetsByDate,
            $defaultDailyTarget
        ) * $totalSales;

        $targetVisitMonth = $this->countTargetUnits(
            $monthStart->copy(),
            $monthEnd->copy(),
            $isNonWorkingDate,
            $dailyTargetsByDate,
            $defaultDailyTarget
        ) * $totalSales;

        $targetDeliveryToday = $this->countTargetUnits(
            $todayStart->copy(),
            $periodEnd->copy(),
            $isNonWorkingDate,
            $dailyDeliveryTargetsByDate,
            $defaultDailyDeliveryTarget
        ) * $totalSales;

        $targetDeliveryMonth = $this->countTargetUnits(
            $monthStart->copy(),
            $monthEnd->copy(),
            $isNonWorkingDate,
            $dailyDeliveryTargetsByDate,
            $defaultDailyDeliveryTarget
        ) * $totalSales;

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
                'target_delivery_today' => $targetDeliveryToday,
                'target_delivery_month' => $targetDeliveryMonth,
                'visit_completion_today' => $visitCompletionToday,
                'visit_completion_month' => $visitCompletionMonth,
                'collection_status_visit' => $collectionStatusVisit,
                'collection_status_delivery' => $collectionStatusDelivery,
                'collection_target_visit' => $targetVisitToday,
                'collection_target_delivery' => $targetDeliveryToday,
                'sales_value' => $salesValue,
                'return_value' => $returnValue,
                'net_profit_value' => $netProfitValue,
            ],
            'filters' => [
                'filterType' => $filterType,
                'date' => $selectedDate,
                'startDate' => $todayStart->toDateString(),
                'endDate' => $periodEnd->toDateString(),
            ],
            'period' => [
                'start' => $todayStart->toDateString(),
                'end' => $periodEnd->toDateString(),
                'isRange' => $todayStart->toDateString() !== $periodEnd->toDateString(),
            ],
            'products' => $products,
            'activityBreakdown' => $activityBreakdown,
            'productActionBreakdown' => $productActionBreakdown,
            'progressPerSales' => $progressPerSales,
            'recentVisits' => $recentVisits,
        ];
    }

    private function buildEmptyDashboardData(array $filters): array
    {
        $selectedDate = $this->parseDateString($filters['selectedDate'] ?? now()->toDateString());
        $startDate = $this->parseDateString($filters['startDate'] ?? $selectedDate);
        $endDate = $this->parseDateString($filters['endDate'] ?? $selectedDate);
        $isRange = $startDate !== $endDate;

        return [
            'stats' => [
                'total_sales' => 0,
                'total_products' => 0,
                'total_customers' => 0,
                'customers_visited_by_team' => 0,
                'visits_today' => 0,
                'visits_this_month' => 0,
                'attendance_present_today' => 0,
                'fake_gps_today' => 0,
                'target_visit_today' => 0,
                'target_visit_month' => 0,
                'target_delivery_today' => 0,
                'target_delivery_month' => 0,
                'visit_completion_today' => 0,
                'visit_completion_month' => 0,
                'collection_status_visit' => 0,
                'collection_status_delivery' => 0,
                'collection_target_visit' => 0,
                'collection_target_delivery' => 0,
                'sales_value' => 0,
                'return_value' => 0,
                'net_profit_value' => 0,
            ],
            'filters' => [
                'filterType' => $isRange ? 'range' : 'single',
                'date' => $selectedDate,
                'startDate' => $startDate,
                'endDate' => $endDate,
            ],
            'period' => [
                'start' => $startDate,
                'end' => $endDate,
                'isRange' => $isRange,
            ],
            'products' => [],
            'activityBreakdown' => [],
            'productActionBreakdown' => [],
            'progressPerSales' => [],
            'recentVisits' => [],
        ];
    }

    private function parseDateString(mixed $value): string
    {
        try {
            return Carbon::parse((string) $value)->toDateString();
        } catch (Throwable) {
            return now()->toDateString();
        }
    }

    private function countWorkingDays(Carbon $start, Carbon $end, callable $isNonWorkingDate): int
    {
        if ($start->gt($end)) {
            return 0;
        }

        $cursor = $start->copy()->startOfDay();
        $limit = $end->copy()->startOfDay();
        $count = 0;

        while ($cursor->lte($limit)) {
            if (!$isNonWorkingDate($cursor)) {
                $count++;
            }

            $cursor->addDay();
        }

        return $count;
    }

    private function countTargetUnits(
        Carbon $start,
        Carbon $end,
        callable $isNonWorkingDate,
        array $dailyTargetsByDate,
        int $defaultDailyTarget
    ): int {
        if ($start->gt($end)) {
            return 0;
        }

        $cursor = $start->copy()->startOfDay();
        $limit = $end->copy()->startOfDay();
        $totalTarget = 0;

        while ($cursor->lte($limit)) {
            $dateKey = $cursor->toDateString();

            if (array_key_exists($dateKey, $dailyTargetsByDate)) {
                $totalTarget += max(0, (int) $dailyTargetsByDate[$dateKey]);
            } elseif (!$isNonWorkingDate($cursor)) {
                $totalTarget += max(0, $defaultDailyTarget);
            }

            $cursor->addDay();
        }

        return $totalTarget;
    }

    private function normalizeVisitTag(string $activityType): string
    {
        $normalized = Str::lower(trim($activityType));

        return $normalized === 'pengiriman' ? 'pengiriman' : 'kunjungan';
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

    public function monitoringRecord(Request $request, $user_id)
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
        $filterType = $request->query('filterType', 'single');
        $selectedDate = $request->query('date', now()->toDateString());
        $startDate = $request->query('startDate', $selectedDate);
        $endDate = $request->query('endDate', $selectedDate);

        $selectedSalesIds = collect((array) $request->query('salesIds', []))
            ->map(fn($id) => (int) $id)
            ->filter(fn($id) => $id > 0)
            ->unique()
            ->values();

        // Build query for visits
        $recentVisits = [];
        $products = Product::query()
            ->where('is_active', true)
            ->select('id', 'name', 'file_path', 'sku', 'category')
            ->orderBy('name')
            ->get();

        if ($salesUsers->count() > 0) {
            $availableSalesIds = $salesUsers->pluck('id');
            $validSelectedSalesIds = $selectedSalesIds
                ->intersect($availableSalesIds)
                ->values();

            $effectiveSalesIds = $validSelectedSalesIds->isNotEmpty()
                ? $validSelectedSalesIds
                : $availableSalesIds;

            $query = SalesVisit::with([
                'photos',
                'customer',
                'products',
                'user' => function ($query) {
                    $query->select('id', 'name', 'avatar');
                },
            ])
                ->whereIn('user_id', $effectiveSalesIds);

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
            'selectedSalesIds' => $selectedSalesIds
                ->intersect($salesUsers->pluck('id'))
                ->map(fn($id) => (string) $id)
                ->values()
                ->all(),
            'serverTime' => now()->toISOString(),
            'supervisorName' => $supervisor->name,
            'supervisorAvatar' => $supervisorAvatar,
        ]);
    }
}
