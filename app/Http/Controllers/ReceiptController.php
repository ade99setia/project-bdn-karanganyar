<?php

namespace App\Http\Controllers;

use App\Models\PosTransaction;
use App\Services\ReceiptService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReceiptController extends Controller
{
    public function __construct(private ReceiptService $receiptService) {}

    /**
     * View receipt (requires auth)
     */
    public function show(string $transactionNumber): Response
    {
        $transaction = PosTransaction::where('transaction_number', $transactionNumber)
            ->with(['items.product', 'member', 'cashier', 'warehouse'])
            ->firstOrFail();

        $user = auth()->user();

        // Check access control
        $canAccess = false;

        // Admin and supervisor can view all receipts
        if (in_array($user->role->name, ['admin', 'supervisor'])) {
            $canAccess = true;
        }

        // Member can view their own receipts
        if ($transaction->member_id && $user->member && $user->member->id === $transaction->member_id) {
            $canAccess = true;
        }

        // Cashier can view receipts from their warehouse
        if ($user->role->name === 'kasir' && $transaction->warehouse_id === $user->warehouse_id) {
            $canAccess = true;
        }

        if (!$canAccess) {
            abort(403, 'Anda tidak memiliki akses ke struk ini');
        }

        return Inertia::render('receipts/show', [
            'transaction' => $transaction,
        ]);
    }

    /**
     * Resend receipt via WhatsApp
     */
    public function sendWhatsApp(PosTransaction $transaction, Request $request): JsonResponse
    {
        $request->validate([
            'phone' => 'required|string',
        ]);

        $user = auth()->user();

        // Check access
        if ($transaction->warehouse_id !== $user->warehouse_id && !in_array($user->role->name, ['admin', 'supervisor'])) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $success = $this->receiptService->sendReceiptViaWhatsApp($transaction, $request->phone);

        if ($success) {
            return response()->json([
                'success' => true,
                'message' => 'Struk berhasil dikirim via WhatsApp',
            ]);
        } else {
            return response()->json([
                'error' => 'Gagal mengirim struk via WhatsApp'
            ], 500);
        }
    }

    /**
     * Get printable receipt HTML
     */
    public function print(PosTransaction $transaction): Response
    {
        $user = auth()->user();

        // Check access
        if ($transaction->warehouse_id !== $user->warehouse_id && !in_array($user->role->name, ['admin', 'supervisor'])) {
            abort(403);
        }

        $html = $this->receiptService->generateReceiptHTML($transaction);

        return Inertia::render('receipts/print', [
            'transaction' => $transaction->load(['items.product', 'member', 'cashier', 'warehouse']),
            'receiptHtml' => $html,
        ]);
    }
}
