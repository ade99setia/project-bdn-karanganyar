import { useState, useRef, useCallback } from 'react';
import { X, Printer, MessageCircle, Loader2, CheckCircle2, ExternalLink, XCircle, ShoppingCart, Plus, ArrowLeft, Ban, ArrowRight, Usb } from 'lucide-react';
import axios from 'axios';
import type { Transaction } from '@/types/pos';
import { useThermalPrinter } from '@/hooks/use-thermal-printer';
import { EscPos, loadImageData, type PaperWidth } from '@/lib/escpos';

interface Props {
    transaction: Transaction;
    onClose: () => void;
    onNewTransaction?: () => void;
    onAddMore?: () => void;
    waAutoSent?: boolean;
    onVoid?: (transactionId: number) => Promise<void>;
}

/** Strip prefix agar input hanya tampilkan 8xxx (tanpa leading 0, 62, atau +62) */
function stripPrefix(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (digits.startsWith('62')) return digits.slice(2);   // 628xxx → 8xxx
    if (digits.startsWith('0')) return digits.slice(1);    // 08xxx  → 8xxx
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

    const { print, status: printStatus, isSupported: thermalSupported, hasCachedPort } = useThermalPrinter();

    const buildAndPrint = useCallback(async (size: PaperWidth) => {
        const w = transaction.warehouse;
        const enc = new EscPos(size);

        enc.align('center');
        if (logoSrc) {
            try { const img = await loadImageData(logoSrc, 160); enc.image(img); } catch { /* skip */ }
        }
        enc.bold(true).println(w?.name ?? 'Toko').bold(false);
        if (w?.receipt_header) enc.println(w.receipt_header);
        if (w?.address) enc.println(w.address);
        if (w?.phone) enc.println(`Telp: ${w.phone}`);

        enc.doubleSep();
        enc.align('left');
        enc.row('No', transaction.transaction_number);
        enc.row('Tanggal', dateStr);
        enc.row('Jam', timeStr);
        if (transaction.cashier) enc.row('Kasir', transaction.cashier.name);

        if (transaction.member) {
            enc.separator();
            enc.bold(true).println(`Member: ${transaction.member.name}`).bold(false);
            enc.println(transaction.member.member_number);
            if (transaction.member.membership_tier) {
                enc.println(`Tier: ${transaction.member.membership_tier.name} (-${transaction.member.membership_tier.default_discount_percentage}%)`);
            }
        }

        enc.separator();
        enc.bold(true).itemRow('Item', 'Qty', 'Total').bold(false);
        enc.separator();
        for (const item of transaction.items) {
            enc.itemRow(item.product_name, String(item.quantity), fmt(item.unit_price * item.quantity));
            if (item.discount_amount > 0) enc.println(`  Diskon: -${fmt(item.discount_amount)}`);
        }

        enc.separator();
        enc.row('Subtotal', fmt(transaction.subtotal));
        if (transaction.total_discount > 0) enc.row('Diskon', `-${fmt(transaction.total_discount)}`);
        enc.doubleSep();
        enc.bold(true).row('TOTAL', fmt(transaction.grand_total)).bold(false);
        enc.doubleSep();
        enc.row('Tunai', fmt(transaction.cash_received));
        enc.bold(true).row('Kembali', fmt(transaction.cash_change)).bold(false);
        enc.separator();
        enc.align('center');
        enc.bold(true).println('Terima Kasih!').bold(false);
        enc.println(w?.receipt_footer ?? 'Belanja lagi ya :)');
        enc.feed(4).cut();

        await print(enc.build());
    }, [transaction, logoSrc, dateStr, timeStr, print]);

    const handlePrint = useCallback((size: '80' | '58' = '80') => {
        const pw = size === '58' ? 58 : 80 as PaperWidth;
        // Kalau sudah ada port ter-cache → langsung cetak thermal tanpa buka tab baru
        if (thermalSupported && hasCachedPort) {
            buildAndPrint(pw);
        } else {
            window.open(`/pos/receipts/${transaction.transaction_number}/print?size=${size}`, '_blank', 'width=420,height=700');
        }
    }, [thermalSupported, hasCachedPort, buildAndPrint, transaction.transaction_number]);

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
                            <p className="text-sm font-bold text-gray-900 dark:text-white">Transaksi Berhasil Tersimpan</p>
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
                    <div ref={receiptRef} className="mx-4 my-4 bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-700 overflow-hidden font-mono text-xs shadow-sm">

                        {/* Store header — hitam putih */}
                        <div className="text-center py-4 px-4 border-b-2 border-gray-900">
                            {logoSrc && (
                                <div className="flex justify-center mb-1">
                                    <img
                                        src={logoSrc}
                                        alt="Logo"
                                        className="max-h-15 max-w-[140px] object-contain"
                                        // style={{ filter: 'grayscale(100%)' }}
                                    />
                                </div>
                            )}
                            <p className="font-bold text-sm tracking-wide text-gray-900 dark:text-white leading-tight">{transaction.warehouse?.name ?? 'Toko'}</p>
                            {transaction.warehouse?.receipt_header && (
                                <p className="text-gray-500 dark:text-gray-400 text-[10px] mt-0.5">{transaction.warehouse.receipt_header}</p>
                            )}
                            {transaction.warehouse?.address && (
                                <p className="text-gray-500 dark:text-gray-400 text-[10px] mt-0.5">{transaction.warehouse.address}</p>
                            )}
                            {transaction.warehouse?.phone && (
                                <p className="text-gray-500 dark:text-gray-400 text-[10px]">Telp: {transaction.warehouse.phone}</p>
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
                                <div className="border border-indigo-300 dark:border-indigo-700 rounded-lg px-3 py-2 bg-indigo-50 dark:bg-indigo-900/20 space-y-0.5">
                                    <p className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-wide mb-1">Member Loyality</p>
                                    <ReceiptRow label="Nama" value={transaction.member.name} bold />
                                    <ReceiptRow label="No." value={transaction.member.member_number} />
                                    {transaction.member.membership_tier && (
                                        <div className="flex justify-between items-center mt-1 pt-1 border-t border-indigo-200 dark:border-indigo-700">
                                            <span className="text-gray-500 dark:text-gray-400 text-xs shrink-0">Tier</span>
                                            <span className="inline-flex items-center gap-1 bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                                {transaction.member.membership_tier.name}
                                                <span className="opacity-80">· -{transaction.member.membership_tier.default_discount_percentage}%</span>
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Divider */}
                            <DashedLine />

                            {/* Items */}
                            <div className="space-y-2">
                                {/* Header */}
                                <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-wide border-b border-dashed border-gray-200 dark:border-zinc-700 pb-1">
                                    <span className="flex-1">Item</span>
                                    <span className="w-8 text-center">Qty</span>
                                    <span className="w-20 text-right">Total</span>
                                </div>
                                {transaction.items.map((item, i) => (
                                    <div key={i}>
                                        <div className="flex justify-between text-gray-800 dark:text-gray-200">
                                            <span className="flex-1 truncate pr-2">{item.product_name}</span>
                                            <span className="w-8 text-center text-gray-500 dark:text-gray-400 text-[11px]">{item.quantity}</span>
                                            <span className="w-20 text-right shrink-0">{fmt(item.unit_price * item.quantity)}</span>
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
                </div>

                {/* Footer Container - Premium Elegant (Blue Accent) */}
                <div className="mt-auto border-t border-zinc-200/80 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md shrink-0 p-3.5 space-y-2">

                    <div className="space-y-1.5">
                        <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-zinc-800 rounded-xl pl-2 pr-1 h-11 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all relative group shadow-sm shadow-zinc-100 dark:shadow-none">
                            <span className="flex items-center justify-center bg-blue-100 dark:bg-blue-900/40 h-7 px-2.5 rounded text-sm font-semibold text-blue-600 dark:text-blue-400 shrink-0">
                                ID +62
                            </span>
                            <input
                                type="tel"
                                value={phoneNumber}
                                onChange={e => { setPhoneNumber(stripPrefix(e.target.value)); setWaSent(false); setWaError(''); }}
                                onKeyDown={e => e.key === 'Enter' && handleSendWhatsApp()}
                                placeholder="85XXXXXXXXX"
                                className="flex-1 bg-transparent text-sm font-medium outline-none text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 min-w-0 px-1"
                            />
                            {waAutoSent && !waError && !waSent && (
                                <span className="hidden xs:block text-[10px] font-bold text-emerald-600 dark:text-emerald-400 tracking-wide px-2 shrink-0">
                                    Auto-Send
                                </span>
                            )}
                            <button
                                onClick={handleSendWhatsApp}
                                disabled={isSending || waSent}
                                className={`h-9 px-3 rounded-lg flex items-center justify-center transition-all shrink-0 ${waSent
                                    ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400'
                                    : 'bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:bg-zinc-200 dark:disabled:bg-zinc-800 active:scale-95 shadow-sm shadow-blue-600/20'
                                    }`}
                            >
                                {isSending ? <Loader2 size={15} className="animate-spin" /> : waSent ? <CheckCircle2 size={16} /> : <MessageCircle size={15} />}
                            </button>
                        </div>
                        {(waError || (waSent && !waAutoSent)) && (
                            <div className="flex items-center gap-1.5 px-1.5 animate-in fade-in slide-in-from-top-1">
                                <div className={`w-1.5 h-1.5 rounded-full ${waError ? 'bg-red-500' : 'bg-emerald-500'} shadow-[0_0_8px_rgba(0,0,0,0.2)] ${waError ? 'shadow-red-500/50' : 'shadow-emerald-500/50'}`} />
                                <p className={`text-[11px] font-medium tracking-tight truncate ${waError ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                    {waError || "Struk telah dikirim via WhatsApp"}
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-2.5">
                        <div className="flex items-center bg-zinc-100/80 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 p-1 rounded-xl h-11 shrink-0">
                            <div className="px-2 text-zinc-400 flex items-center">
                                {printStatus === 'connecting' || printStatus === 'printing'
                                    ? <Loader2 size={15} className="animate-spin text-indigo-500" />
                                    : printStatus === 'done'
                                        ? <CheckCircle2 size={15} className="text-emerald-500" />
                                        : thermalSupported && hasCachedPort
                                            ? <Usb size={15} className="text-indigo-400" />
                                            : <Printer size={15} />
                                }
                            </div>
                            <div className="w-px h-5 bg-zinc-300 dark:bg-zinc-700 mx-0.5 shrink-0" />
                            <button
                                onClick={() => handlePrint('80')}
                                disabled={printStatus === 'connecting' || printStatus === 'printing'}
                                className="px-3.5 h-full rounded-lg hover:bg-white dark:hover:bg-zinc-800 hover:shadow-sm text-xs font-semibold text-zinc-600 dark:text-zinc-300 transition-all active:scale-95 disabled:opacity-50"
                            >
                                80mm
                            </button>
                            <div className="w-px h-5 bg-zinc-300 dark:bg-zinc-700 mx-0.5 shrink-0" />
                            <button
                                onClick={() => handlePrint('58')}
                                disabled={printStatus === 'connecting' || printStatus === 'printing'}
                                className="px-3.5 h-full rounded-lg hover:bg-white dark:hover:bg-zinc-800 hover:shadow-sm text-xs font-semibold text-zinc-600 dark:text-zinc-300 transition-all active:scale-95 disabled:opacity-50"
                            >
                                58mm
                            </button>
                        </div>

                        <button
                            onClick={() => { onNewTransaction?.(); onClose(); }}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all active:scale-[0.98] h-11 shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 group border border-transparent"
                        >
                            <span>Selesai</span>
                            <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
                        </button>
                    </div>
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
