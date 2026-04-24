<?php

namespace App\Http\Controllers;

use App\Http\Requests\CloseShiftRequest;
use App\Http\Requests\OpenShiftRequest;
use App\Models\CashierShift;
use App\Services\ShiftService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CashierShiftController extends Controller
{
    public function __construct(private ShiftService $shiftService) {}

    /**
     * Get current active shift
     */
    public function current(): JsonResponse
    {
        $user = auth()->user();
        
        if (!$user->warehouse_id) {
            return response()->json(['error' => 'Warehouse not assigned'], 403);
        }

        $shift = $this->shiftService->getCurrentShift($user->id, $user->warehouse_id);

        return response()->json($shift);
    }

    /**
     * Open new shift
     */
    public function open(OpenShiftRequest $request): JsonResponse
    {
        $user = auth()->user();
        
        if (!$user->warehouse_id) {
            return response()->json(['error' => 'Warehouse not assigned'], 403);
        }

        try {
            $shift = $this->shiftService->openShift(
                $user->id,
                $user->warehouse_id,
                $request->opening_balance
            );

            return response()->json([
                'success' => true,
                'shift' => $shift,
                'message' => 'Shift berhasil dibuka',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => $e->getMessage()
            ], 422);
        }
    }

    /**
     * Close current shift
     */
    public function close(CloseShiftRequest $request): JsonResponse
    {
        $user = auth()->user();
        
        if (!$user->warehouse_id) {
            return response()->json(['error' => 'Warehouse not assigned'], 403);
        }

        $shift = $this->shiftService->getCurrentShift($user->id, $user->warehouse_id);

        if (!$shift) {
            return response()->json([
                'error' => 'Tidak ada shift aktif'
            ], 422);
        }

        try {
            $closedShift = $this->shiftService->closeShift($shift, $request->closing_balance);

            return response()->json([
                'success' => true,
                'shift' => $closedShift,
                'message' => 'Shift berhasil ditutup',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => $e->getMessage()
            ], 422);
        }
    }

    /**
     * List shift history
     */
    public function index(Request $request): Response
    {
        $user = auth()->user();
        
        $query = CashierShift::with(['cashier', 'warehouse'])
            ->where('warehouse_id', $user->warehouse_id);

        // Filter by cashier if provided (admin/supervisor only)
        if ($request->cashier_id && in_array($user->role->name, ['admin', 'supervisor'])) {
            $query->where('cashier_id', $request->cashier_id);
        } else {
            // Regular cashier can only see their own shifts
            $query->where('cashier_id', $user->id);
        }

        // Filter by date range
        if ($request->start_date) {
            $query->whereDate('opened_at', '>=', $request->start_date);
        }
        if ($request->end_date) {
            $query->whereDate('opened_at', '<=', $request->end_date);
        }

        $shifts = $query->orderBy('opened_at', 'desc')
            ->paginate(20);

        return Inertia::render('pos/shifts/index', [
            'shifts' => $shifts,
        ]);
    }

    /**
     * Get shift summary/report (for active or closed shift)
     */
    public function report(CashierShift $shift): JsonResponse
    {
        $user = auth()->user();

        if ($shift->warehouse_id !== $user->warehouse_id && !in_array($user->role->name, ['admin', 'supervisor'])) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $transactions = $shift->transactions()
            ->where('status', 'completed')
            ->with(['items', 'member'])
            ->get();

        $voided = $shift->transactions()->where('status', 'voided')->count();

        $totalRevenue    = $transactions->sum('grand_total');
        $totalDiscount   = $transactions->sum('total_discount');
        $totalCash       = $transactions->sum('cash_received');
        $totalChange     = $transactions->sum('cash_change');
        $totalItems      = $transactions->sum(fn($t) => $t->items->sum('quantity'));
        $expectedCash    = $this->shiftService->calculateExpectedCash($shift);

        return response()->json([
            'shift'               => $shift,
            'total_transactions'  => $transactions->count(),
            'voided_count'        => $voided,
            'total_revenue'       => $totalRevenue,
            'total_discount'      => $totalDiscount,
            'total_cash_received' => $totalCash,
            'total_change'        => $totalChange,
            'total_items_sold'    => $totalItems,
            'opening_balance'     => $shift->opening_balance,
            'expected_cash'       => $expectedCash,
            'actual_cash'         => $shift->actual_cash,
            'difference'          => $shift->difference,
        ]);
    }
    public function show(CashierShift $shift): JsonResponse
    {
        $user = auth()->user();
        
        // Check access
        if ($shift->warehouse_id !== $user->warehouse_id && !in_array($user->role->name, ['admin', 'supervisor'])) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        if ($shift->cashier_id !== $user->id && !in_array($user->role->name, ['admin', 'supervisor'])) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $shift->load(['cashier', 'warehouse', 'transactions']);

        return response()->json($shift);
    }
}
