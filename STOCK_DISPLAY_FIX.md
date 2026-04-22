# Stock Display Fix - Stockist Management

## Problem
When adjusting stock in the Stockist Management page, the stock quantities were showing as 0 in the product dropdown, even though the data was correctly saved to the database. This happened because:

1. The `stocks` data passed to the frontend was paginated (only 10 items per page)
2. The Stock Adjustment form tried to find stock quantities from this paginated data
3. If a product's stock for a selected warehouse wasn't in the current page, it would show as 0

## Root Cause
The Stock Adjustment Section component was using `stocks.data` (paginated) to look up stock quantities:
```typescript
const match = stocks.data.find((s) => 
  String(s.product.id) === String(p.id) && 
  String(s.warehouse.id) === String(selectedWarehouseId)
);
```

Since `stocks.data` only contained 10 items per page, stocks not on the current page would not be found.

## Solution
Added a new `allStocks` prop that contains ALL stock records (unpaginated) specifically for the Stock Adjustment form to use.

### Backend Changes
**File:** `app/Http/Controllers/Settings/StockistManagementController.php`

Added query to fetch all stocks:
```php
// Get all stocks (unpaginated) for stock adjustment form
$allStocks = ProductStock::query()
    ->with(['product:id,name,sku', 'warehouse:id,name,code'])
    ->whereHas('product')
    ->whereHas('warehouse')
    ->get()
    ->map(function ($stock) {
        return [
            'product_id' => $stock->product_id,
            'warehouse_id' => $stock->warehouse_id,
            'quantity' => $stock->quantity,
        ];
    });
```

Passed to Inertia:
```php
return Inertia::render('settings/stockist', [
    'stocks' => $stocks,  // Paginated for display
    'allStocks' => $allStocks,  // Unpaginated for adjustment form
    // ... other props
]);
```

### Frontend Changes

**File:** `resources/js/components/settings/stockist/types.ts`
- Added `allStocks` to `PageProps` interface

**File:** `resources/js/components/settings/stockist/stockist-settings-page.tsx`
- Extracted `allStocks` from page props
- Passed `allStocks` to `StockAdjustmentSection`

**File:** `resources/js/components/settings/stockist/stock-adjustment-section.tsx`
- Added `allStocks` prop to component interface
- Changed stock lookup to use `allStocks` instead of `stocks.data`:

```typescript
// Before
const selectedStock = (selectedProductId && selectedWarehouseId)
    ? (stocks.data.find((s) => 
        Number(s.product.id) === selectedProductId && 
        Number(s.warehouse.id) === selectedWarehouseId
      )?.quantity ?? 0)
    : null;

// After
const selectedStock = (selectedProductId && selectedWarehouseId)
    ? (allStocks.find((s) => 
        s.product_id === selectedProductId && 
        s.warehouse_id === selectedWarehouseId
      )?.quantity ?? 0)
    : null;
```

### Cleanup
- Removed debug logging from `adjustStock` method
- Removed `/debug/stocks` route from `routes/web.php`

## Testing
1. Login as admin or kasir
2. Go to Settings > Stockist Management
3. In "Penyesuaian Stok Gudang" section:
   - Select a warehouse (e.g., "BDN Karang")
   - Select a product (e.g., "Aqua 600ml")
   - The correct stock quantity should now display
4. Adjust stock (IN or OUT) and verify it saves correctly
5. Check "Stok Saat Ini" section to see updated quantities
6. Check "Riwayat Pergerakan Stok" to see the movement record

## Result
✅ Stock quantities now display correctly in the adjustment form regardless of pagination
✅ Users can see accurate stock levels when selecting products
✅ Stock adjustments work correctly for all warehouses
✅ No more "0" stock display for products that exist but aren't on the current page
