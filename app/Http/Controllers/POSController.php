<?php

namespace App\Http\Controllers;

use App\Http\Requests\CheckoutRequest;
use App\Models\PosTransaction;
use App\Services\POSService;
use App\Services\ShiftService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class POSController extends Controller
{
    public function __construct(
        private POSService $posService,
        private ShiftService $shiftService,
        private \App\Services\ReceiptService $receiptService,
    ) {}

    /**
     * Render POS UI
     */
    public function index(): Response
    {
        $user = auth()->user();
        
        // Load relationships
        $user->load(['role', 'warehouse']);
        
        // Check if user has warehouse assigned
        if (!$user->warehouse_id) {
            abort(403, 'Anda belum ditugaskan ke cabang manapun');
        }

        // Get current shift
        $currentShift = $this->shiftService->getCurrentShift($user->id, $user->warehouse_id);

        return Inertia::render('pos/index', [
            'currentShift' => $currentShift,
            'warehouse' => $user->warehouse,
        ]);
    }

    /**
     * Search products by name/SKU/barcode
     */
    public function searchProducts(Request $request): JsonResponse
    {
        $user = auth()->user();

        if (!$user->warehouse_id) {
            return response()->json(['error' => 'Warehouse not assigned'], 403);
        }

        $products = $this->posService->searchProducts(
            (string) ($request->input('query') ?? ''),
            $user->warehouse_id,
            20,
            $request->filled('ids')
                ? array_map('intval', explode(',', $request->input('ids')))
                : []
        );

        // Format response with stock info
        $formattedProducts = $products->map(function ($product) {
            $stock = $product->stocks->first();
            
            return [
                'id' => $product->id,
                'name' => $product->name,
                'sku' => $product->sku,
                'price' => $product->price,
                'available_stock' => $stock ? $stock->quantity : 0,
                'image' => $product->file_path,
            ];
        });

        return response()->json($formattedProducts);
    }

    /**
     * Preview cart with discounts (before checkout)
     */
    public function previewCart(Request $request): JsonResponse
    {
        $request->validate([
            'cart_items' => 'required|array|min:1',
            'cart_items.*.product_id' => 'required|exists:products,id',
            'cart_items.*.quantity' => 'required|integer|min:1',
            'cart_items.*.unit_price' => 'required|numeric|min:0',
            'member_id' => 'nullable|exists:members,id',
        ]);

        $user = auth()->user();
        
        if (!$user->warehouse_id) {
            return response()->json(['error' => 'Warehouse not assigned'], 403);
        }

        $preview = $this->posService->previewCart(
            $request->cart_items,
            $request->member_id,
            $user->warehouse_id
        );

        return response()->json($preview);
    }

    /**
     * Process checkout
     */
    public function checkout(CheckoutRequest $request): JsonResponse
    {
        $user = auth()->user();
        
        if (!$user->warehouse_id) {
            return response()->json(['error' => 'Warehouse not assigned'], 403);
        }

        // Check if cashier has active shift
        if (!$this->shiftService->canPerformTransaction($user->id, $user->warehouse_id)) {
            return response()->json([
                'error' => 'Anda harus membuka shift terlebih dahulu'
            ], 403);
        }

        $currentShift = $this->shiftService->getCurrentShift($user->id, $user->warehouse_id);

        try {
            $transaction = $this->posService->processCheckout(
                $request->cart_items,
                $request->member_id,
                $user->warehouse_id,
                $user->id,
                $currentShift->id,
                $request->cash_received
            );

            // Auto-kirim WA ke member jika punya nomor HP
            $waAutoSent = false;
            if ($transaction->member?->phone) {
                $waAutoSent = $this->receiptService->sendReceiptViaWhatsApp(
                    $transaction,
                    $transaction->member->phone
                );
            }

            return response()->json([
                'success'      => true,
                'transaction'  => $transaction,
                'message'      => 'Transaksi berhasil',
                'wa_auto_sent' => $waAutoSent,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => $e->getMessage()
            ], 422);
        }
    }

    /**
     * List transactions as JSON (for AJAX — shift history drawer)
     */
    public function transactionsJson(Request $request): JsonResponse
    {
        $user = auth()->user();

        $query = PosTransaction::with(['items', 'member'])
            ->where('warehouse_id', $user->warehouse_id);

        if ($request->shift_id) {
            $query->where('shift_id', $request->shift_id);
        }

        if ($request->date) {
            $query->whereDate('created_at', $request->date);
        }

        $transactions = $query->with(['items.product', 'member'])
            ->orderBy('created_at', 'desc')
            ->limit((int) ($request->per_page ?? 50))
            ->get();

        return response()->json($transactions);
    }

    /**
     * List transactions (for current shift/warehouse)
     */
    public function transactions(Request $request): Response
    {
        $user = auth()->user();
        
        $query = PosTransaction::with(['items.product', 'member', 'cashier'])
            ->where('warehouse_id', $user->warehouse_id);

        // Filter by shift if provided
        if ($request->shift_id) {
            $query->where('shift_id', $request->shift_id);
        }

        // Filter by date if provided
        if ($request->date) {
            $query->whereDate('created_at', $request->date);
        }

        $transactions = $query->orderBy('created_at', 'desc')
            ->paginate(20);

        return Inertia::render('pos/transactions', [
            'transactions' => $transactions,
        ]);
    }

    /**
     * Show transaction detail
     */
    public function show(PosTransaction $transaction): JsonResponse
    {
        $user = auth()->user();
        
        // Check warehouse access
        if ($transaction->warehouse_id !== $user->warehouse_id && !in_array($user->role->name, ['admin', 'supervisor'])) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $transaction->load(['items.product', 'member', 'cashier', 'warehouse']);

        return response()->json($transaction);
    }

    /**
     * Void transaction (before shift close)
     */
    public function void(PosTransaction $transaction): JsonResponse
    {
        $user = auth()->user();
        
        // Check warehouse access
        if ($transaction->warehouse_id !== $user->warehouse_id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        try {
            $this->posService->voidTransaction($transaction);

            return response()->json([
                'success' => true,
                'message' => 'Transaksi berhasil dibatalkan',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => $e->getMessage()
            ], 422);
        }
    }
}
