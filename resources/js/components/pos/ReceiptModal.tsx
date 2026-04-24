import { useState, useRef } from 'react';
import { X, Printer, MessageCircle, Loader2, CheckCircle2, ExternalLink, XCircle, ShoppingCart, Plus, ArrowLeft, Ban } from 'lucide-react';
import axios from 'axios';
import type { Transaction } from '@/types/pos';

interface Props {
    transaction: Transaction;
    onClose: () => void;
    onNewTransaction?: () => void;
    onAddMore?: () => void;
    waAutoSent?: boolean;
    onVoid?: (transactionId: number) => Promise<void>;
}

/** Strip +62 / 62 prefix agar input hanya tampilkan 8xxx */
function stripPrefix(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (digits.startsWith('62')) return digits.slice(2);
    return digits;
}

export default function ReceiptModal({ transaction, onClose, onNewTransaction, onAddMore, waAutoSent, onVoid }: Props) {
    const [phoneNumber, setPhoneNumber] = useState(() => stripPrefix(transaction.member?.phone ?? ''));
    const [isSending, setIsSending] = useState(false);
    const [waSent, setWaSent] = useState(waAutoSent ?? false);
    const [waError, setWaError] = useState('');
    const [showConfirm, setShowConfirm] = useState(false);
    const [isVoiding, setIsVoiding] = useState(false);
    const [voidError, setVoidError] = useState('');
    const receiptRef = useRef<HTMLDivElement>(null);

    const logoSrc = transaction.warehouse?.file_path ? `/storage/${transaction.warehouse.file_path}` : null;

    const fmt = (v: number) => `Rp ${v.toLocaleString('id-ID')}`;
    const date = new Date(transaction.created_at);
    const dateStr = date.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
    const timeStr = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    const handlePrint = (size: '80' | '58' = '80') => {
        window.open(`/pos/receipts/${transaction.transaction_number}/print?size=${size}`, '_blank', 'width=420,height=700');
    };

    const handleSendWhatsApp = async () => {
        const phone = phoneNumber.trim();
        if (!phone) { setWaError('Masukkan nomor WhatsApp'); return; }
        setIsSending(true); setWaError('');
        try {
            await axios.post(`/pos/receipts/${transaction.transaction_number}/send-whatsapp`, { phone_number: phone });
            setWaSent(true);
        } catch (err: any) {
            setWaError(err.response?.data?.error || 'Gagal mengirim struk');
        } finally {
            setIsSending(false);
        }
    };

    // Tombol X atau klik backdrop → tampilkan konfirmasi, bukan langsung tutup
    const handleRequestClose = () => setShowConfirm(true);

    const handleVoid = async () => {
        if (!onVoid) return;
        if (!confirm(`Batalkan transaksi ${transaction.transaction_number}? Stok akan dikembalikan.`)) return;
        setIsVoiding(true); setVoidError('');
        try {
            await onVoid(transaction.id);
            onNewTransaction?.();
            onClose();
        } catch (err: any) {
            setVoidError(err.response?.data?.error || 'Gagal membatalkan transaksi');
            setIsVoiding(false);
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={handleRequestClose}
        >
            {/* Stop propagation agar klik di dalam modal tidak trigger backdrop */}
            <div
                className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-sm shadow-2xl flex flex-col max-h-[95vh] relative"
                onClick={e => e.stopPropagation()}
            >
                {/* Confirm overlay — muncul di atas konten modal */}
                {showConfirm && (
                    <div className="absolute inset-0 z-10 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center px-6 gap-4">
                        <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                            <ShoppingCart size={22} className="text-amber-500" />
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-bold text-gray-900 dark:text-white">Transaksi sudah selesai?</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Struk transaksi <span className="font-semibold text-gray-700 dark:text-gray-300">{transaction.transaction_number}</span> masih terbuka.
                            </p>
                        </div>

                        <div className="w-full space-y-2">
                            {/* Transaksi baru */}
                            <button
                                onClick={() => { onNewTransaction?.(); onClose(); }}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
                            >
                                <ShoppingCart size={16} className="shrink-0" />
                                <div className="text-left">
                                    <p className="text-sm font-bold">Transaksi Baru</p>
                                    <p className="text-[10px] text-indigo-200">Tutup struk & mulai pelanggan berikutnya</p>
                                </div>
                            </button>

                            {/* Tambah produk */}
                            {onAddMore && (
                                <button
                                    onClick={onAddMore}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 transition-colors"
                                >
                                    <Plus size={16} className="shrink-0" />
                                    <div className="text-left">
                                        <p className="text-sm font-bold">Tambah Produk</p>
                                        <p className="text-[10px] text-amber-600 dark:text-amber-400">Customer ada tambahan — lanjutkan belanja</p>
                                    </div>
                                </button>
                            )}

                            {/* Batalkan transaksi */}
                            {onVoid && (
                                <button
                                    onClick={handleVoid}
                                    disabled={isVoiding}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 transition-colors disabled:opacity-50"
                                >
                                    {isVoiding
                                        ? <Loader2 size={16} className="shrink-0 animate-spin" />
                                        : <Ban size={16} className="shrink-0" />
                                    }
                                    <div className="text-left">
                                        <p className="text-sm font-bold">Batalkan Transaksi</p>
                                        <p className="text-[10px] text-red-500 dark:text-red-400">Void — stok dikembalikan, shift masih berjalan</p>
                                    </div>
                                </button>
                            )}

                            {voidError && (
                                <p className="flex items-center gap-1.5 text-xs text-red-500 px-1">
                                    <XCircle size={12} /> {voidError}
                                </p>
                            )}

                            {/* Kembali ke struk */}
                            <button
                                onClick={() => setShowConfirm(false)}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-600 dark:text-gray-300 transition-colors"
                            >
                                <ArrowLeft size={16} className="shrink-0" />
                                <div className="text-left">
                                    <p className="text-sm font-semibold">Kembali ke Struk</p>
                                    <p className="text-[10px] text-gray-400">Cetak atau kirim struk dulu</p>
                                </div>
                            </button>
                        </div>
                    </div>
                )}

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-zinc-800 shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                            <CheckCircle2 size={16} className="text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">Transaksi Berhasil</p>
                            <p className="text-xs text-gray-400">{transaction.transaction_number}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleRequestClose}
                        className="w-7 h-7 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X size={15} />
                    </button>
                </div>

                {/* Receipt body — scrollable */}
                <div className="flex-1 overflow-y-auto">

                    {/* Thermal receipt */}
                    <div ref={receiptRef} className="mx-4 my-4 bg-gray-50 dark:bg-zinc-800/50 rounded-xl border border-gray-200 dark:border-zinc-700 overflow-hidden font-mono text-xs">

                        {/* Store header */}
                        <div className="bg-indigo-600 text-white text-center py-3 px-4">
                            {logoSrc && (
                                <div className="flex justify-center mb-2">
                                    <img
                                        src={logoSrc}
                                        alt="Logo"
                                        className="max-h-12 max-w-[120px] object-contain rounded"
                                    />
                                </div>
                            )}
                            <p className="font-bold text-sm tracking-wide">{transaction.warehouse?.name ?? 'Toko'}</p>
                            {transaction.warehouse?.receipt_header && (
                                <p className="text-indigo-200 text-[10px] mt-0.5">{transaction.warehouse.receipt_header}</p>
                            )}
                            {transaction.warehouse?.address && (
                                <p className="text-indigo-200 text-[10px] mt-0.5">{transaction.warehouse.address}</p>
                            )}
                            {transaction.warehouse?.phone && (
                                <p className="text-indigo-200 text-[10px]">Telp: {transaction.warehouse.phone}</p>
                            )}
                        </div>

                        <div className="px-4 py-3 space-y-3">
                            {/* Transaction meta */}
                            <div className="space-y-0.5 text-gray-600 dark:text-gray-400">
                                <ReceiptRow label="No" value={transaction.transaction_number} bold />
                                <ReceiptRow label="Tanggal" value={dateStr} />
                                <ReceiptRow label="Jam" value={timeStr} />
                                {transaction.cashier && <ReceiptRow label="Kasir" value={transaction.cashier.name} />}
                            </div>

                            {/* Member info */}
                            {transaction.member && (
                                <div className="border border-dashed border-emerald-300 dark:border-emerald-700 rounded-lg px-3 py-2 bg-emerald-50 dark:bg-emerald-900/20 space-y-0.5">
                                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide mb-1">Member</p>
                                    <ReceiptRow label="Nama" value={transaction.member.name} />
                                    <ReceiptRow label="No." value={transaction.member.member_number} />
                                    {transaction.member.membership_tier && (
                                        <ReceiptRow
                                            label="Tier"
                                            value={`${transaction.member.membership_tier.name} (-${transaction.member.membership_tier.default_discount_percentage}%)`}
                                            highlight
                                        />
                                    )}
                                </div>
                            )}

                            {/* Divider */}
                            <DashedLine />

                            {/* Items */}
                            <div className="space-y-2">
                                {transaction.items.map((item, i) => (
                                    <div key={i}>
                                        <div className="flex justify-between text-gray-800 dark:text-gray-200">
                                            <span className="flex-1 truncate pr-2">{item.product_name}</span>
                                            <span className="shrink-0">{fmt(item.unit_price * item.quantity)}</span>
                                        </div>
                                        <div className="flex justify-between text-gray-400 text-[10px] pl-1">
                                            <span>{item.quantity} × {fmt(item.unit_price)}</span>
                                            {item.discount_amount > 0 && (
                                                <span className="text-emerald-600">-{fmt(item.discount_amount)}</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <DashedLine />

                            {/* Totals */}
                            <div className="space-y-0.5 text-gray-600 dark:text-gray-400">
                                <ReceiptRow label="Subtotal" value={fmt(transaction.subtotal)} />
                                {transaction.total_discount > 0 && (
                                    <ReceiptRow label="Diskon" value={`-${fmt(transaction.total_discount)}`} highlight />
                                )}
                            </div>

                            <div className="border-t-2 border-gray-800 dark:border-gray-200 pt-2">
                                <ReceiptRow label="TOTAL" value={fmt(transaction.grand_total)} bold large />
                            </div>

                            <DashedLine />

                            {/* Payment */}
                            <div className="space-y-0.5 text-gray-600 dark:text-gray-400">
                                <ReceiptRow label="Tunai" value={fmt(transaction.cash_received)} />
                                <ReceiptRow label="Kembali" value={fmt(transaction.cash_change)} bold />
                            </div>

                            <DashedLine />

                            {/* Footer */}
                            <div className="text-center text-gray-400 space-y-0.5 pb-1">
                                <p className="font-bold text-gray-600 dark:text-gray-300">Terima Kasih!</p>
                                <p className="text-[10px]">{transaction.warehouse?.receipt_footer ?? 'Simpan struk ini sebagai bukti pembelian'}</p>
                                <a
                                    href={`/pos/receipts/${transaction.transaction_number}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-[10px] text-indigo-500 hover:text-indigo-700 transition-colors"
                                >
                                    Lihat struk digital <ExternalLink size={9} />
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* WhatsApp section */}
                    <div className="px-4 pb-4 space-y-2">
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                            Kirim via WhatsApp
                        </p>

                        {/* Auto-sent banner */}
                        {waAutoSent && (
                            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                                <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                                <p className="text-xs text-emerald-700 dark:text-emerald-400">
                                    Struk otomatis terkirim ke member
                                </p>
                            </div>
                        )}

                        <div className="flex gap-2">
                            <div className="flex-1 flex items-center gap-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-green-500 transition-all">
                                <span className="text-sm text-gray-400 shrink-0">+62</span>
                                <input
                                    type="tel"
                                    value={phoneNumber}
                                    onChange={e => { setPhoneNumber(stripPrefix(e.target.value)); setWaSent(false); setWaError(''); }}
                                    onKeyDown={e => e.key === 'Enter' && handleSendWhatsApp()}
                                    placeholder="85XXXXXXXXX"
                                    className="flex-1 bg-transparent text-sm outline-none text-gray-900 dark:text-white placeholder-gray-400"
                                />
                            </div>
                            <button
                                onClick={handleSendWhatsApp}
                                disabled={isSending || waSent}
                                className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center transition-all ${waSent ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' : 'bg-green-500 hover:bg-green-600 text-white disabled:opacity-50'}`}
                            >
                                {isSending ? <Loader2 size={15} className="animate-spin" /> : waSent ? <CheckCircle2 size={15} /> : <MessageCircle size={15} />}
                            </button>
                        </div>
                        {waError && (
                            <p className="flex items-center gap-1 text-xs text-red-500">
                                <XCircle size={11} /> {waError}
                            </p>
                        )}
                        {waSent && !waAutoSent && (
                            <p className="flex items-center gap-1 text-xs text-emerald-600">
                                <CheckCircle2 size={11} /> Struk berhasil dikirim
                            </p>
                        )}
                    </div>
                </div>

                {/* Footer actions */}
                <div className="px-4 py-3 border-t border-gray-100 dark:border-zinc-800 flex gap-2 shrink-0">
                    <div className="flex gap-1.5 flex-1">
                        <button
                            onClick={() => handlePrint('80')}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                            title="Printer 80mm (standar)"
                        >
                            <Printer size={13} /> 80mm
                        </button>
                        <button
                            onClick={() => handlePrint('58')}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                            title="Printer 58mm (bluetooth/mini)"
                        >
                            <Printer size={11} /> 58mm
                        </button>
                    </div>
                    <button
                        onClick={() => { onNewTransaction?.(); onClose(); }}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-sm font-bold text-white transition-colors"
                    >
                        Selesai
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Helpers ────────────────────────────────────────────────────────────────
function ReceiptRow({ label, value, bold, large, highlight }: {
    label: string; value: string;
    bold?: boolean; large?: boolean; highlight?: boolean;
}) {
    return (
        <div className={`flex justify-between gap-2 ${large ? 'text-sm' : 'text-xs'}`}>
            <span className="text-gray-500 dark:text-gray-400 shrink-0">{label}</span>
            <span className={`text-right ${bold ? 'font-bold text-gray-900 dark:text-white' : ''} ${highlight ? 'text-emerald-600 font-semibold' : ''}`}>
                {value}
            </span>
        </div>
    );
}

function DashedLine() {
    return <div className="border-t border-dashed border-gray-300 dark:border-zinc-600" />;
}
