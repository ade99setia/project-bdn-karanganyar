<?php

namespace App\Services;

use App\Models\PosTransaction;
use Illuminate\Support\Facades\Log;

class ReceiptService
{
    public function __construct(private EvolutionApiService $evolutionApiService) {}

    // ── Transaction number ─────────────────────────────────────────────────

    public function generateTransactionNumber(): string
    {
        $date   = now()->format('Ymd');
        $prefix = "POS-{$date}-";

        $last = PosTransaction::where('transaction_number', 'like', "{$prefix}%")
            ->orderBy('transaction_number', 'desc')
            ->first();

        $seq = $last ? ((int) substr($last->transaction_number, -4)) + 1 : 1;

        return $prefix . str_pad($seq, 4, '0', STR_PAD_LEFT);
    }

    // ── WhatsApp ───────────────────────────────────────────────────────────

    /**
     * Normalize nomor HP ke format Evolution API (62xxx)
     */
    private function normalizePhone(string $phone): string
    {
        $phone = preg_replace('/\D/', '', $phone); // strip semua non-digit

        if (str_starts_with($phone, '62')) {
            return $phone; // sudah format internasional
        }
        if (str_starts_with($phone, '0')) {
            return '62' . substr($phone, 1); // 08xxx → 628xxx
        }
        // Angka tanpa prefix (8xxx) → tambah 62
        return '62' . $phone;
    }

    public function sendReceiptViaWhatsApp(PosTransaction $transaction, string $phoneNumber): bool
    {
        try {
            $result = $this->evolutionApiService->sendText(
                $this->normalizePhone($phoneNumber),
                $this->generateWhatsAppMessage($transaction),
                1200,
                true,
                ['type' => 'pos_receipt', 'transaction_id' => $transaction->id]
            );

            if (!$result['success']) {
                Log::warning('WhatsApp receipt send failed', [
                    'transaction_id' => $transaction->id,
                    'phone'          => $phoneNumber,
                    'status'         => $result['status'],
                    'error'          => $result['error'],
                ]);
                return false;
            }

            return true;
        } catch (\Exception $e) {
            Log::error('Failed to send receipt via WhatsApp', [
                'transaction_id' => $transaction->id,
                'phone'          => $phoneNumber,
                'error'          => $e->getMessage(),
            ]);
            return false;
        }
    }

    private function generateWhatsAppMessage(PosTransaction $transaction): string
    {
        // Pakai nama warehouse dari transaksi, fallback ke config
        $storeName  = $transaction->warehouse?->name ?? config('app.store_name', 'Toko Kami');
        $footer     = $transaction->warehouse?->receipt_footer ?? 'Terima kasih! 😊';
        $receiptUrl = $this->getReceiptUrl($transaction->transaction_number);

        $lines   = [];
        $lines[] = "*{$storeName}*";

        if ($transaction->warehouse?->address) {
            $lines[] = $transaction->warehouse->address;
        }
        if ($transaction->warehouse?->phone) {
            $lines[] = "Telp: {$transaction->warehouse->phone}";
        }

        $lines[] = '';
        $lines[] = "No. Transaksi: *{$transaction->transaction_number}*";
        $lines[] = 'Tanggal: ' . $transaction->created_at->format('d/m/Y H:i');

        if ($transaction->member) {
            $lines[] = "Member: {$transaction->member->name} ({$transaction->member->member_number})";
        }

        $lines[] = '';
        $lines[] = '```';
        foreach ($transaction->items as $item) {
            $name = $item->product_name ?? ($item->product?->name ?? '-');
            $lines[] = "{$item->quantity}x {$name}";
            $lines[] = '   Rp ' . number_format($item->subtotal, 0, ',', '.');
        }
        $lines[] = '```';

        if ($transaction->total_discount > 0) {
            $lines[] = "Diskon: -Rp " . number_format($transaction->total_discount, 0, ',', '.');
        }

        $lines[] = "*Total: Rp " . number_format($transaction->grand_total, 0, ',', '.') . "*";
        $lines[] = "Tunai: Rp " . number_format($transaction->cash_received, 0, ',', '.');
        $lines[] = "Kembali: Rp " . number_format($transaction->cash_change, 0, ',', '.');
        $lines[] = '';
        $lines[] = "Struk digital: {$receiptUrl}";
        $lines[] = '';
        $lines[] = $footer;

        return implode("\n", $lines);
    }

    // ── Print ──────────────────────────────────────────────────────────────

    public function generateReceiptHTML(PosTransaction $transaction): string
    {
        return view('receipts.print', [
            'transaction' => $transaction->load(['items.product', 'member', 'cashier', 'warehouse']),
        ])->render();
    }

    public function getReceiptUrl(string $transactionNumber): string
    {
        // Gunakan PUBLIC_APP_URL jika ada (untuk link yang dikirim ke customer)
        // fallback ke APP_URL
        $base = rtrim(config('app.public_url', config('app.url')), '/');
        return "{$base}/pos/receipts/{$transactionNumber}";
    }
}
