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
     * Resolve transaction by transaction_number (shared helper)
     */
    private function resolveTransaction(string $transactionNumber): PosTransaction
    {
        return PosTransaction::where('transaction_number', $transactionNumber)
            ->with(['items.product', 'member.membershipTier', 'cashier', 'warehouse'])
            ->firstOrFail();
    }

    /**
     * View receipt page — PUBLIC (no auth required, untuk link di WA)
     */
    public function show(string $transactionNumber): Response
    {
        $transaction = $this->resolveTransaction($transactionNumber);

        return Inertia::render('receipts/show', [
            'transaction' => $transaction,
        ]);
    }

    /**
     * Send receipt via WhatsApp
     */
    public function sendWhatsApp(string $transactionNumber, Request $request): JsonResponse
    {
        $request->validate([
            'phone_number' => 'required|string',
        ]);

        $transaction = $this->resolveTransaction($transactionNumber);
        $user = auth()->user();

        if ($transaction->warehouse_id !== $user->warehouse_id && !in_array($user->role->name, ['admin', 'supervisor'])) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $success = $this->receiptService->sendReceiptViaWhatsApp($transaction, $request->phone_number);

        return $success
            ? response()->json(['success' => true, 'message' => 'Struk berhasil dikirim via WhatsApp'])
            : response()->json(['error' => 'Gagal mengirim struk via WhatsApp'], 500);
    }

    /**
     * Print receipt view
     */
    public function print(string $transactionNumber): Response
    {
        $transaction = $this->resolveTransaction($transactionNumber);
        $user = auth()->user();

        if ($transaction->warehouse_id !== $user->warehouse_id && !in_array($user->role->name, ['admin', 'supervisor'])) {
            abort(403);
        }

        return Inertia::render('receipts/print', [
            'transaction' => $transaction,
            'receiptHtml' => $this->receiptService->generateReceiptHTML($transaction),
        ]);
    }
}
