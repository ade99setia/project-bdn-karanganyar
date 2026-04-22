<?php

namespace App\Services;

use App\Models\PosTransaction;
use App\Services\EvolutionApiService;
use Illuminate\Support\Facades\Log;

class ReceiptService
{
    public function __construct(private ?EvolutionApiService $evolutionApiService = null) {}

    /**
     * Generate transaction number (POS-YYYYMMDD-XXXX)
     * 
     * @return string
     */
    public function generateTransactionNumber(): string
    {
        $date = now()->format('Ymd');
        $prefix = "POS-{$date}-";
        
        // Get last transaction number for today
        $lastTransaction = PosTransaction::where('transaction_number', 'like', "{$prefix}%")
            ->orderBy('transaction_number', 'desc')
            ->first();

        if ($lastTransaction) {
            // Extract sequence number and increment
            $lastSequence = (int) substr($lastTransaction->transaction_number, -4);
            $newSequence = $lastSequence + 1;
        } else {
            $newSequence = 1;
        }

        return $prefix . str_pad($newSequence, 4, '0', STR_PAD_LEFT);
    }

    /**
     * Send receipt via WhatsApp
     * 
     * @param PosTransaction $transaction
     * @param string $phoneNumber
     * @return bool
     */
    public function sendReceiptViaWhatsApp(PosTransaction $transaction, string $phoneNumber): bool
    {
        try {
            if (!$this->evolutionApiService) {
                Log::warning('WhatsApp service not available');
                return false;
            }

            $message = $this->generateWhatsAppMessage($transaction);
            
            // Send message via Evolution API
            $this->evolutionApiService->sendText($phoneNumber, $message);
            
            return true;
        } catch (\Exception $e) {
            Log::error('Failed to send receipt via WhatsApp', [
                'transaction_id' => $transaction->id,
                'phone' => $phoneNumber,
                'error' => $e->getMessage(),
            ]);
            
            return false;
        }
    }

    /**
     * Generate WhatsApp message for receipt
     * 
     * @param PosTransaction $transaction
     * @return string
     */
    private function generateWhatsAppMessage(PosTransaction $transaction): string
    {
        $storeName = config('app.store_name', 'Toko Kami');
        $receiptUrl = $this->getReceiptUrl($transaction->transaction_number);
        
        $message = "*{$storeName}*\n";
        $message .= "================================\n\n";
        $message .= "Terima kasih atas pembelian Anda!\n\n";
        $message .= "No. Transaksi: *{$transaction->transaction_number}*\n";
        $message .= "Tanggal: " . $transaction->created_at->format('d/m/Y H:i') . "\n";
        $message .= "Total: *Rp " . number_format($transaction->grand_total, 0, ',', '.') . "*\n\n";
        $message .= "Lihat struk lengkap:\n";
        $message .= $receiptUrl . "\n\n";
        $message .= "================================\n";
        $message .= "Belanja lagi ya! 😊";

        return $message;
    }

    /**
     * Generate receipt HTML for printing
     * 
     * @param PosTransaction $transaction
     * @return string
     */
    public function generateReceiptHTML(PosTransaction $transaction): string
    {
        return view('receipts.print', [
            'transaction' => $transaction->load(['items.product', 'member', 'cashier', 'warehouse']),
            'storeName' => config('app.store_name', 'Toko Kami'),
            'storeAddress' => config('app.store_address', ''),
            'storePhone' => config('app.store_phone', ''),
        ])->render();
    }

    /**
     * Get receipt URL
     * 
     * @param string $transactionNumber
     * @return string
     */
    public function getReceiptUrl(string $transactionNumber): string
    {
        return url("/pos/receipts/{$transactionNumber}");
    }
}
