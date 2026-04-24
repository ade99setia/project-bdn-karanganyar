<?php

namespace App\Services;

use App\Models\PosTransaction;
use App\Models\PosTransactionItem;
use App\Models\Product;
use App\Models\ProductStock;
use App\Models\StockMovement;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class POSService
{
    public function __construct(
        private DiscountService $discountService,
        private ReceiptService $receiptService
    ) {}

    /**
     * Preview cart with calculated discounts
     * 
     * @param array $cartItems
     * @param int|null $memberId
     * @param int $warehouseId
     * @return array
     */
    public function previewCart(array $cartItems, ?int $memberId, int $warehouseId): array
    {
        // Calculate discounts
        $itemsWithDiscounts = $this->discountService->calculateDiscounts($cartItems, $memberId);

        // Calculate totals
        $subtotal = 0;
        $totalDiscount = 0;

        foreach ($itemsWithDiscounts as &$item) {
            $itemSubtotal = $item['unit_price'] * $item['quantity'];
            $item['subtotal'] = $itemSubtotal - $item['discount_amount'];
            
            $subtotal += $itemSubtotal;
            $totalDiscount += $item['discount_amount'];
        }

        $grandTotal = $subtotal - $totalDiscount;

        return [
            'items' => $itemsWithDiscounts,
            'subtotal' => $subtotal,
            'total_discount' => $totalDiscount,
            'grand_total' => $grandTotal,
        ];
    }

    /**
     * Process checkout and create transaction
     * 
     * @param array $cartItems
     * @param int|null $memberId
     * @param int $warehouseId
     * @param int $cashierId
     * @param int|null $shiftId
     * @param float $cashReceived
     * @return PosTransaction
     * @throws \Exception
     */
    public function processCheckout(
        array $cartItems,
        ?int $memberId,
        int $warehouseId,
        int $cashierId,
        ?int $shiftId,
        float $cashReceived
    ): PosTransaction {
        return DB::transaction(function () use ($cartItems, $memberId, $warehouseId, $cashierId, $shiftId, $cashReceived) {
            // Calculate cart with discounts
            $cartPreview = $this->previewCart($cartItems, $memberId, $warehouseId);

            // Validate cash received
            if ($cashReceived < $cartPreview['grand_total']) {
                throw new \Exception('Uang yang diterima kurang dari total yang harus dibayar');
            }

            // Calculate change
            $cashChange = $cashReceived - $cartPreview['grand_total'];

            // Generate transaction number
            $transactionNumber = $this->receiptService->generateTransactionNumber();

            // Create transaction
            $transaction = PosTransaction::create([
                'transaction_number' => $transactionNumber,
                'warehouse_id' => $warehouseId,
                'cashier_id' => $cashierId,
                'member_id' => $memberId,
                'shift_id' => $shiftId,
                'subtotal' => $cartPreview['subtotal'],
                'total_discount' => $cartPreview['total_discount'],
                'grand_total' => $cartPreview['grand_total'],
                'payment_method' => 'cash',
                'cash_received' => $cashReceived,
                'cash_change' => $cashChange,
                'status' => 'completed',
            ]);

            // Create transaction items and update stock
            foreach ($cartPreview['items'] as $item) {
                // Create transaction item
                PosTransactionItem::create([
                    'pos_transaction_id' => $transaction->id,
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'discount_percentage' => $item['discount_percentage'],
                    'discount_amount' => $item['discount_amount'],
                    'subtotal' => $item['subtotal'],
                ]);

                // Update product stock
                $productStock = ProductStock::where('product_id', $item['product_id'])
                    ->where('warehouse_id', $warehouseId)
                    ->lockForUpdate()
                    ->first();

                if (!$productStock || $productStock->quantity < $item['quantity']) {
                    throw new \Exception("Stok tidak mencukupi untuk produk ID {$item['product_id']}");
                }

                $productStock->quantity -= $item['quantity'];
                $productStock->save();

                // Create stock movement
                StockMovement::create([
                    'product_id' => $item['product_id'],
                    'warehouse_id' => $warehouseId,
                    'type' => 'pos_sale',
                    'quantity' => -$item['quantity'],
                    'reference_id' => $transaction->id,
                    'notes' => "POS Sale - {$transactionNumber}",
                    'created_by' => $cashierId,
                ]);
            }

            return $transaction->load(['items.product', 'member.membershipTier', 'cashier', 'warehouse']);
        });
    }

    /**
     * Void transaction (only if shift not closed)
     * 
     * @param PosTransaction $transaction
     * @return bool
     * @throws \Exception
     */
    public function voidTransaction(PosTransaction $transaction): bool
    {
        if ($transaction->shift && $transaction->shift->status === 'closed') {
            throw new \Exception('Tidak dapat membatalkan transaksi setelah shift ditutup');
        }

        return DB::transaction(function () use ($transaction) {
            // Restore stock
            foreach ($transaction->items as $item) {
                $productStock = ProductStock::where('product_id', $item->product_id)
                    ->where('warehouse_id', $transaction->warehouse_id)
                    ->lockForUpdate()
                    ->first();

                if ($productStock) {
                    $productStock->quantity += $item->quantity;
                    $productStock->save();
                }

                // Create reverse stock movement
                StockMovement::create([
                    'product_id' => $item->product_id,
                    'warehouse_id' => $transaction->warehouse_id,
                    'type' => 'pos_void',
                    'quantity' => $item->quantity,
                    'reference_id' => $transaction->id,
                    'notes' => "POS Void - {$transaction->transaction_number}",
                    'created_by' => auth()->id(),
                ]);
            }

            // Update transaction status
            $transaction->status = 'voided';
            $transaction->save();

            return true;
        });
    }

    /**
     * Get available stock for product in warehouse
     * 
     * @param int $productId
     * @param int $warehouseId
     * @return int
     */
    public function getAvailableStock(int $productId, int $warehouseId): int
    {
        $productStock = ProductStock::where('product_id', $productId)
            ->where('warehouse_id', $warehouseId)
            ->first();

        return $productStock ? $productStock->quantity : 0;
    }

    /**
     * Search products by query (name, SKU, barcode)
     * 
     * @param string $query
     * @param int $warehouseId
     * @param int $limit
     * @return Collection
     */
    public function searchProducts(?string $query, int $warehouseId, int $limit = 20, array $ids = []): Collection
    {
        $query = $query ?? '';
        return Product::when($ids !== [], function ($q) use ($ids) {
                $q->whereIn('id', $ids);
            })
            ->when($query !== '' && $ids === [], function ($q) use ($query) {
                $q->where(function ($q) use ($query) {
                    $q->where('name', 'like', "%{$query}%")
                      ->orWhere('sku', 'like', "%{$query}%");
                });
            })
            ->where('is_active', true)
            ->whereHas('stocks', function ($q) use ($warehouseId) {
                $q->where('warehouse_id', $warehouseId);
            })
            ->with(['stocks' => function ($q) use ($warehouseId) {
                $q->where('warehouse_id', $warehouseId);
            }])
            ->limit($ids !== [] ? count($ids) : $limit)
            ->get();
    }
}
