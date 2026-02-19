<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\Product;
use App\Models\User;
use App\Models\SalesVisit;
use Illuminate\Support\Facades\Auth;

class SalesController extends Controller
{

    public function monitoringRecord($user_id)
    {
        $currentUser = Auth::user();

        if ($currentUser->id != $user_id) {
            abort(403, 'Anda hanya bisa melihat data performa Anda sendiri.');
        }

        $salesUsers = collect();

        $salesUsers = User::where('id', $user_id)
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

        if ($salesUsers->first() && $salesUsers->first()->avatar) {
            $salesAvatar = '/storage/profiles/' . $salesUsers->first()->avatar;
        } else {
            $salesAvatar = null;
        }

        return Inertia::render('sales/monitoring-record', [
            'recentVisits' => $recentVisits,
            'attendances' => [],
            'products' => $products,
            'salesUsers' => $salesUsers,
            'selectedDate' => $selectedDate,
            'startDate' => $startDate,
            'endDate' => $endDate,
            'filterType' => $filterType,
            'serverTime' => now()->toISOString(),
            'salesName' => $salesUsers->first() ? $salesUsers->first()->name : null,
            'salesAvatar' => $salesAvatar,
        ]);
    }
}
