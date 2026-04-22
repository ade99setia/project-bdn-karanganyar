<?php

namespace App\Services;

use App\Models\CashierShift;
use App\Models\PosTransaction;
use Illuminate\Support\Facades\DB;

class ShiftService
{
    /**
     * Get current active shift for cashier
     * 
     * @param int $cashierId
     * @param int $warehouseId
     * @return CashierShift|null
     */
    public function getCurrentShift(int $cashierId, int $warehouseId): ?CashierShift
    {
        return CashierShift::where('cashier_id', $cashierId)
            ->where('warehouse_id', $warehouseId)
            ->where('status', 'open')
            ->first();
    }

    /**
     * Open new shift
     * 
     * @param int $cashierId
     * @param int $warehouseId
     * @param float $openingBalance
     * @return CashierShift
     * @throws \Exception
     */
    public function openShift(int $cashierId, int $warehouseId, float $openingBalance): CashierShift
    {
        // Check if cashier already has an open shift
        $existingShift = $this->getCurrentShift($cashierId, $warehouseId);
        
        if ($existingShift) {
            throw new \Exception('Anda sudah memiliki shift yang aktif');
        }

        return CashierShift::create([
            'warehouse_id' => $warehouseId,
            'cashier_id' => $cashierId,
            'opened_at' => now(),
            'opening_balance' => $openingBalance,
            'status' => 'open',
        ]);
    }

    /**
     * Close shift with cash reconciliation
     * 
     * @param CashierShift $shift
     * @param float $actualCash
     * @return CashierShift
     * @throws \Exception
     */
    public function closeShift(CashierShift $shift, float $actualCash): CashierShift
    {
        if ($shift->status === 'closed') {
            throw new \Exception('Shift sudah ditutup');
        }

        return DB::transaction(function () use ($shift, $actualCash) {
            // Calculate expected cash
            $expectedCash = $this->calculateExpectedCash($shift);
            
            // Calculate difference
            $difference = $actualCash - $expectedCash;

            // Update shift
            $shift->update([
                'closed_at' => now(),
                'closing_balance' => $actualCash,
                'expected_cash' => $expectedCash,
                'actual_cash' => $actualCash,
                'difference' => $difference,
                'status' => 'closed',
            ]);

            return $shift->fresh();
        });
    }

    /**
     * Calculate expected cash for shift
     * 
     * @param CashierShift $shift
     * @return float
     */
    public function calculateExpectedCash(CashierShift $shift): float
    {
        $totalCashTransactions = PosTransaction::where('shift_id', $shift->id)
            ->where('payment_method', 'cash')
            ->where('status', 'completed')
            ->sum('grand_total');

        return $shift->opening_balance + $totalCashTransactions;
    }

    /**
     * Check if cashier can perform transaction (has active shift)
     * 
     * @param int $cashierId
     * @param int $warehouseId
     * @return bool
     */
    public function canPerformTransaction(int $cashierId, int $warehouseId): bool
    {
        return $this->getCurrentShift($cashierId, $warehouseId) !== null;
    }
}
