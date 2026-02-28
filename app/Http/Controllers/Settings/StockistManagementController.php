<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductStock;
use App\Models\SalesProductStock;
use App\Models\StockMovement;
use App\Models\User;
use App\Models\Warehouse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class StockistManagementController extends Controller
{
    public function index(Request $request): Response
    {
        $warehouseId = $request->integer('warehouse_id') ?: null;
        $search = trim((string) $request->query('search', ''));
        $perPage = $request->integer('per_page', 10);

        $stocksQuery = ProductStock::query()
            ->with(['product:id,name,sku,category,file_path', 'warehouse:id,name,code,file_path'])
            ->when($warehouseId, fn($query) => $query->where('warehouse_id', $warehouseId))
            ->when($search !== '', function ($query) use ($search) {
                $query->whereHas('product', function ($productQuery) use ($search) {
                    $productQuery->where('name', 'like', "%{$search}%")
                        ->orWhere('sku', 'like', "%{$search}%")
                        ->orWhere('category', 'like', "%{$search}%");
                });
            })
            ->orderBy('warehouse_id')
            ->orderBy('product_id');

        $stocks = $stocksQuery->paginate($perPage)->appends($request->query());

        $movements = StockMovement::query()
            ->with([
                'product:id,name,sku,file_path',
                'warehouse:id,name,code,file_path',
                    'user:id,name,phone,avatar',
                    'createdBy:id,name,phone',
                'salesVisit:id,activity_type,visited_at',
            ])
            ->when($warehouseId, fn($query) => $query->where('warehouse_id', $warehouseId))
            ->latest()
            ->limit(25)
            ->get();

        $salesStockSummaries = SalesProductStock::query()
            ->with([
                'user:id,name,warehouse_id,avatar',
                'user.warehouse:id,name,code,file_path',
                'product:id,name,sku,file_path',
            ])
            ->where('quantity', '>', 0)
            ->whereHas('user')
            ->when($warehouseId, function ($query) use ($warehouseId) {
                $query->whereHas('user', function ($userQuery) use ($warehouseId) {
                    $userQuery->where('warehouse_id', $warehouseId);
                });
            })
            ->orderBy('user_id')
            ->orderBy('product_id')
            ->get()
            ->map(function (SalesProductStock $stock) {
                return [
                    'id' => $stock->id,
                    'quantity' => (int) $stock->quantity,
                    'user' => [
                        'id' => $stock->user?->id,
                        'name' => $stock->user?->name,
                        'avatar' => $stock->user?->avatar,
                    ],
                    'warehouse' => [
                        'id' => $stock->user?->warehouse?->id,
                        'name' => $stock->user?->warehouse?->name,
                        'code' => $stock->user?->warehouse?->code,
                        'file_path' => $stock->user?->warehouse?->file_path,
                    ],
                    'product' => [
                        'id' => $stock->product?->id,
                        'name' => $stock->product?->name,
                        'sku' => $stock->product?->sku,
                        'file_path' => $stock->product?->file_path,
                    ],
                ];
            })
            ->values();

        return Inertia::render('settings/stockist', [
            'stocks' => $stocks,
            'movements' => $movements,
            'salesStockSummaries' => $salesStockSummaries,
            'products' => Product::query()
                ->select('id', 'name', 'sku', 'category', 'file_path')
                ->where('is_active', true)
                ->orderBy('name')
                ->get(),
            'salesUsers' => User::query()
                ->select('id', 'name', 'avatar', 'phone', 'warehouse_id')
                ->whereNotNull('warehouse_id')
                ->orderBy('name')
                ->get(),
            'warehouses' => Warehouse::query()
                ->select('id', 'name', 'code', 'is_active', 'file_path')
                ->orderBy('name')
                ->get(),
            'filters' => [
                'warehouse_id' => $warehouseId,
                'search' => $search,
                'per_page' => $perPage,
            ],
        ]);
    }

    public function storeWarehouse(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:100', 'unique:warehouses,code'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $warehouse = Warehouse::query()->create([
            'name' => trim($validated['name']),
            'code' => strtoupper(trim($validated['code'])),
            'is_active' => (bool) ($validated['is_active'] ?? true),
        ]);

        // optional image upload
        if ($request->hasFile('image')) {
            $file = $request->file('image');
            $path = $file->store('warehouses', 'public');
            $warehouse->update(['file_path' => $path]);
        }

        return back()->with('success', 'Gudang berhasil ditambahkan.');
    }

    public function updateWarehouse(Request $request, Warehouse $warehouse): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:100', 'unique:warehouses,code,' . $warehouse->id],
            'is_active' => ['required', 'boolean'],
        ]);

        $warehouse->update([
            'name' => trim($validated['name']),
            'code' => strtoupper(trim($validated['code'])),
            'is_active' => (bool) $validated['is_active'],
        ]);

        // optional image upload/update
        if ($request->hasFile('image')) {
            // remove old file if present
            if ($warehouse->file_path) {
                Storage::disk('public')->delete($warehouse->file_path);
            }

            $path = $request->file('image')->store('warehouses', 'public');
            $warehouse->update(['file_path' => $path]);
        }

        return back()->with('success', 'Gudang berhasil diperbarui.');
    }

    public function destroyWarehouse(Warehouse $warehouse): RedirectResponse
    {
        $hasRelatedData = $warehouse->users()->exists()
            || $warehouse->productStocks()->exists()
            || $warehouse->stockMovements()->exists();

        if ($hasRelatedData) {
            return back()->with('error', 'Gudang tidak dapat dihapus karena sudah memiliki relasi data. Nonaktifkan gudang jika sudah tidak dipakai.');
        }

        // delete associated image file from storage (if any)
        if ($warehouse->file_path) {
            try {
                Storage::disk('public')->delete($warehouse->file_path);
            } catch (\Throwable $e) {
                Log::error('Werehouse image delete error: ' . $e->getMessage());
            }
        }

        $warehouse->delete();

        return back()->with('success', 'Gudang berhasil dihapus.');
    }

    public function adjustStock(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'product_id' => ['required', 'integer', 'exists:products,id'],
            'warehouse_id' => ['required', 'integer', 'exists:warehouses,id'],
            'type' => ['required', 'in:in,out'],
            'user_id' => ['nullable', 'integer', 'exists:users,id'],
            'quantity' => ['required', 'integer', 'min:1'],
            'reference' => ['nullable', 'string', 'max:255'],
            'note' => ['nullable', 'string', 'max:1000'],
        ]);

        DB::transaction(function () use ($validated) {
            $productId = (int) $validated['product_id'];
            $warehouseId = (int) $validated['warehouse_id'];
            $quantity = (int) $validated['quantity'];
            $type = (string) $validated['type'];
            $targetUserId = isset($validated['user_id']) ? (int) $validated['user_id'] : null;

            if ($type === 'out' && !$targetUserId) {
                throw new \RuntimeException('Pilih sales penerima untuk proses OUT dari gudang.');
            }

            $stock = ProductStock::query()
                ->where('product_id', $productId)
                ->where('warehouse_id', $warehouseId)
                ->lockForUpdate()
                ->first();

            if (!$stock) {
                $stock = ProductStock::query()->create([
                    'product_id' => $productId,
                    'warehouse_id' => $warehouseId,
                    'quantity' => 0,
                ]);
                $stock = $stock->fresh();
            }

            if ($type === 'out') {
                if ($stock->quantity < $quantity) {
                    throw new \RuntimeException('Stok tidak cukup untuk dikeluarkan dari gudang.');
                }

                $stock->decrement('quantity', $quantity);

                $salesStock = SalesProductStock::query()
                    ->where('user_id', $targetUserId)
                    ->where('product_id', $productId)
                    ->lockForUpdate()
                    ->first();

                if (!$salesStock) {
                    $salesStock = SalesProductStock::query()->create([
                        'user_id' => $targetUserId,
                        'product_id' => $productId,
                        'quantity' => 0,
                    ]);
                }

                $salesStock->increment('quantity', $quantity);
            } else {
                $stock->increment('quantity', $quantity);
            }

            StockMovement::query()->create([
                'product_id' => $productId,
                'warehouse_id' => $warehouseId,
                'sales_visit_id' => null,
                'user_id' => $targetUserId,
                'type' => $type,
                'quantity' => $quantity,
                'reference' => $validated['reference'] ?? null,
                'note' => $validated['note'] ?? 'Manual stock adjustment',
                'created_by' => Auth::id(),
            ]);
        });

        return back()->with('success', 'Stok gudang berhasil diperbarui.');
    }
}
