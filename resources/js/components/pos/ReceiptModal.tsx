import { useState } from 'react';
import { X, Printer, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import axios from 'axios';

interface Transaction {
    id: number;
    transaction_number: string;
    grand_total: number;
    cash_received: number;
    cash_change: number;
    items: Array<{
        product_name: string;
        quantity: number;
        unit_price: number;
        discount_amount: number;
        subtotal: number;
    }>;
    member?: {
        name: string;
        member_number: string;
    };
    created_at: string;
}

interface ReceiptModalProps {
    transaction: Transaction;
    onClose: () => void;
}

export default function ReceiptModal({ transaction, onClose }: ReceiptModalProps) {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isPrinting, setIsPrinting] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSendWhatsApp = async () => {
        if (!phoneNumber.trim()) {
            setError('Nomor WhatsApp harus diisi');
            return;
        }

        setIsSending(true);
        setError('');
        setMessage('');

        try {
            await axios.post(`/pos/receipts/${transaction.id}/send-whatsapp`, {
                phone_number: phoneNumber
            });

            setMessage('Struk berhasil dikirim via WhatsApp');
            setPhoneNumber('');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Gagal mengirim struk');
        } finally {
            setIsSending(false);
        }
    };

    const handlePrint = async () => {
        setIsPrinting(true);
        setError('');

        try {
            // Open print view in new window
            const printWindow = window.open(
                `/pos/receipts/${transaction.id}/print`,
                '_blank',
                'width=800,height=600'
            );

            if (printWindow) {
                printWindow.onload = () => {
                    printWindow.print();
                };
            }
        } catch (err) {
            setError('Gagal membuka halaman print');
        } finally {
            setIsPrinting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-lg font-bold">Transaksi Berhasil!</h2>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                        className="h-8 w-8 p-0"
                    >
                        <X className="w-4 h-4" />
                    </Button>
                </div>

                {/* Receipt Content */}
                <div className="p-4 space-y-4">
                    {/* Transaction Info */}
                    <div className="text-center space-y-1">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            No. Transaksi
                        </p>
                        <p className="font-bold text-lg">{transaction.transaction_number}</p>
                        <p className="text-xs text-gray-500">
                            {new Date(transaction.created_at).toLocaleString('id-ID')}
                        </p>
                    </div>

                    {/* Member Info */}
                    {transaction.member && (
                        <div className="p-3 border rounded bg-green-50 dark:bg-green-900/20">
                            <p className="text-sm font-medium">Member: {transaction.member.name}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                                {transaction.member.member_number}
                            </p>
                        </div>
                    )}

                    {/* Items */}
                    <div className="border rounded">
                        <div className="p-3 bg-gray-50 dark:bg-gray-900 border-b">
                            <p className="text-sm font-medium">Detail Pembelian</p>
                        </div>
                        <div className="p-3 space-y-2">
                            {transaction.items.map((item, index) => (
                                <div key={index} className="text-sm">
                                    <div className="flex justify-between">
                                        <span>{item.product_name}</span>
                                        <span>Rp {item.unit_price.toLocaleString('id-ID')}</span>
                                    </div>
                                    <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                                        <span>{item.quantity} x Rp {item.unit_price.toLocaleString('id-ID')}</span>
                                        <span>Rp {(item.quantity * item.unit_price).toLocaleString('id-ID')}</span>
                                    </div>
                                    {item.discount_amount > 0 && (
                                        <div className="flex justify-between text-xs text-green-600">
                                            <span>Diskon</span>
                                            <span>-Rp {item.discount_amount.toLocaleString('id-ID')}</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Payment Summary */}
                    <div className="border rounded p-3 space-y-2">
                        <div className="flex justify-between text-sm">
                            <span>Total:</span>
                            <span className="font-bold">
                                Rp {transaction.grand_total.toLocaleString('id-ID')}
                            </span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span>Tunai:</span>
                            <span>Rp {transaction.cash_received.toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex justify-between text-sm border-t pt-2">
                            <span>Kembalian:</span>
                            <span className="font-bold text-green-600">
                                Rp {transaction.cash_change.toLocaleString('id-ID')}
                            </span>
                        </div>
                    </div>

                    {/* Messages */}
                    {message && (
                        <Alert>
                            <AlertDescription>{message}</AlertDescription>
                        </Alert>
                    )}

                    {error && (
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {/* WhatsApp Send */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium">
                            Kirim Struk via WhatsApp
                        </label>
                        <div className="flex gap-2">
                            <Input
                                placeholder="08123456789"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSendWhatsApp()}
                            />
                            <Button
                                onClick={handleSendWhatsApp}
                                disabled={isSending}
                            >
                                {isSending ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Send className="w-4 h-4" />
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={handlePrint}
                            disabled={isPrinting}
                        >
                            <Printer className="w-4 h-4 mr-2" />
                            Print
                        </Button>
                        <Button
                            className="flex-1"
                            onClick={onClose}
                        >
                            Selesai
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
