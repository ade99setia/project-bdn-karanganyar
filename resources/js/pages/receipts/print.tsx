import { useEffect, useCallback } from 'react';
import { Head } from '@inertiajs/react';
import type { Transaction } from '@/types/pos';
import { useGrayscaleImage } from '@/hooks/use-grayscale-image';
import { useThermalPrinter } from '@/hooks/use-thermal-printer';
import { EscPos, loadImageData, type PaperWidth } from '@/lib/escpos';
import { Printer, Loader2, CheckCircle2, AlertCircle, Usb, ExternalLink, RefreshCw } from 'lucide-react';

interface Props {
    transaction: Transaction;
}

export default function ReceiptPrint({ transaction }: Props) {
    const fmt = (v: number) => `Rp ${v.toLocaleString('id-ID')}`;
    const date = new Date(transaction.created_at);
    const dateStr = date.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
    const timeStr = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    const sizeParam = new URLSearchParams(window.location.search).get('size');
    const paperWidth: PaperWidth = sizeParam === '58' ? 58 : 80;
    const paperMm = `${paperWidth}mm`;

    const logoSrc = transaction.warehouse?.file_path ? `/storage/${transaction.warehouse.file_path}` : null;
    const grayscaleLogo = useGrayscaleImage(logoSrc);

    const { print, status, error, isSupported, mode, resetPort } = useThermalPrinter();
    const w = transaction.warehouse;

    // ── Build ESC/POS bytes ────────────────────────────────────────────────

    const buildEscPos = useCallback(async (): Promise<Uint8Array> => {
        const enc = new EscPos(paperWidth);

        enc.align('center');
        if (logoSrc) {
            try {
                const imgData = await loadImageData(logoSrc, 160);
                enc.image(imgData);
            } catch { /* skip */ }
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
        enc.println(date.toLocaleString('id-ID'));
        enc.feed(4).cut();

        return enc.build();
    }, [transaction, paperWidth, dateStr, timeStr, logoSrc, w]);

    const handleThermalPrint = useCallback(async () => {
        await print(await buildEscPos());
    }, [buildEscPos, print]);

    // Auto CSS print jika tidak ada WebSerial/WebUSB
    useEffect(() => {
        if (!isSupported) {
            const delay = logoSrc ? (grayscaleLogo ? 300 : 2000) : 500;
            const t = setTimeout(() => window.print(), delay);
            return () => clearTimeout(t);
        }
    }, [isSupported, grayscaleLogo, logoSrc]);

    const statusLabel: Record<typeof status, string> = {
        idle: '', connecting: 'Menghubungkan...', printing: 'Mencetak...',
        done: 'Berhasil dicetak!', error: error ?? 'Gagal mencetak',
    };

    return (
        <>
            <Head title={`Struk ${transaction.transaction_number}`} />

            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    @page { margin: 0; size: ${paperMm} auto; }
                }
            `}</style>

            {/* Page background */}
            <div className="min-h-screen bg-gray-100 flex flex-col items-center py-6 px-3 pb-10">
                <div className={`w-full ${paperWidth === 58 ? 'max-w-xs' : 'max-w-sm'}`}>

                    {/* ── Receipt card — identik dengan ReceiptModal ── */}
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden font-mono text-xs shadow-sm">

                        {/* Store header */}
                        <div className="text-center py-4 px-4 border-b-2 border-gray-900">
                            {grayscaleLogo && (
                                <div className="flex justify-center mb-1">
                                    <img
                                        src={grayscaleLogo}
                                        alt="Logo"
                                        className="max-h-15 max-w-[150px] object-contain"
                                        style={{ filter: 'grayscale(100%)' }}
                                    />
                                </div>
                            )}
                            <p className="font-bold text-sm tracking-wide text-gray-900">{w?.name ?? 'Toko'}</p>                            {w?.receipt_header && <p className="text-gray-500 text-[10px] mt-0.5">{w.receipt_header}</p>}
                            {w?.address && <p className="text-gray-500 text-[10px] mt-0.5">{w.address}</p>}
                            {w?.phone && <p className="text-gray-500 text-[10px]">Telp: {w.phone}</p>}
                        </div>

                        <div className="px-4 py-3 space-y-3">
                            {/* Transaction meta */}
                            <div className="space-y-0.5 text-gray-600">
                                <Row label="No" value={transaction.transaction_number} bold />
                                <Row label="Tanggal" value={dateStr} />
                                <Row label="Jam" value={timeStr} />
                                {transaction.cashier && <Row label="Kasir" value={transaction.cashier.name} />}
                            </div>

                            {/* Member */}
                            {transaction.member && (
                                <div className="border border-indigo-300 rounded-lg px-3 py-2 bg-indigo-50 space-y-0.5">
                                    <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wide mb-1">Member Loyality</p>
                                    <Row label="Nama" value={transaction.member.name} bold />
                                    <Row label="No." value={transaction.member.member_number} />
                                    {transaction.member.membership_tier && (
                                        <div className="flex justify-between items-center mt-1 pt-1 border-t border-indigo-200">
                                            <span className="text-gray-500 text-xs shrink-0">Tier</span>
                                            <span className="inline-flex items-center gap-1 bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                                {transaction.member.membership_tier.name}
                                                <span className="opacity-80">· -{transaction.member.membership_tier.default_discount_percentage}%</span>
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}

                            <Dashed />

                            {/* Items */}
                            <div className="space-y-2">
                                <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-wide border-b border-dashed border-gray-200 pb-1">
                                    <span className="flex-1">Item</span>
                                    <span className="w-8 text-center">Qty</span>
                                    <span className="w-20 text-right">Total</span>
                                </div>
                                {transaction.items.map((item, i) => (
                                    <div key={i}>
                                        <div className="flex justify-between text-gray-800">
                                            <span className="flex-1 truncate pr-2">{item.product_name}</span>
                                            <span className="w-8 text-center text-gray-500 text-[11px]">{item.quantity}</span>
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

                            <Dashed />

                            {/* Totals */}
                            <div className="space-y-0.5 text-gray-600">
                                <Row label="Subtotal" value={fmt(transaction.subtotal)} />
                                {transaction.total_discount > 0 && (
                                    <Row label="Diskon" value={`-${fmt(transaction.total_discount)}`} highlight />
                                )}
                            </div>

                            <div className="border-t-2 border-gray-800 pt-2">
                                <Row label="TOTAL" value={fmt(transaction.grand_total)} bold large />
                            </div>

                            <Dashed />

                            {/* Payment */}
                            <div className="space-y-0.5 text-gray-600">
                                <Row label="Tunai" value={fmt(transaction.cash_received)} />
                                <Row label="Kembali" value={fmt(transaction.cash_change)} bold />
                            </div>

                            <Dashed />

                            {/* Footer */}
                            <div className="text-center text-gray-400 space-y-0.5 pb-1">
                                <p className="font-bold text-gray-600">Terima Kasih!</p>
                                <p className="text-[10px]">{w?.receipt_footer ?? 'Simpan struk ini sebagai bukti pembelian'}</p>
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

                    {/* Action buttons — sticky, always visible */}
                    <div className="actions" style={{ position: 'sticky', bottom: 0, zIndex: 50, background: '#f3f4f6', padding: '10px 0 4px', marginTop: 16 }}>
                        <div className="no-print flex gap-2 flex-wrap justify-center">
                            {isSupported && (
                                <button
                                    onClick={handleThermalPrint}
                                    disabled={status === 'connecting' || status === 'printing'}
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold disabled:opacity-50 transition-colors"
                                >
                                    {(status === 'connecting' || status === 'printing')
                                        ? <Loader2 size={13} className="animate-spin" />
                                        : status === 'done' ? <CheckCircle2 size={13} /> : <Usb size={13} />
                                    }
                                    {status === 'idle' || status === 'done' || status === 'error'
                                        ? `Cetak Thermal${mode ? ` (${mode === 'usb' ? 'USB' : 'Serial'})` : ''}`
                                        : statusLabel[status]
                                    }
                                </button>
                            )}
                            <button
                                onClick={() => window.print()}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold transition-colors"
                            >
                                <Printer size={13} /> Cetak / PDF
                            </button>
                            {isSupported && (
                                <button
                                    onClick={resetPort}
                                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-500 text-xs transition-colors"
                                    title="Paksa pilih port printer lagi"
                                >
                                    <RefreshCw size={13} /> Ganti Port Thermal
                                </button>
                            )}
                        </div>

                        {/* Status message */}
                        {status !== 'idle' && (
                            <div className={`no-print mt-2 flex items-center justify-center gap-1.5 text-xs ${status === 'done' ? 'text-emerald-600' : status === 'error' ? 'text-red-500' : 'text-indigo-500'}`}>
                                {status === 'done' && <CheckCircle2 size={12} />}
                                {status === 'error' && <AlertCircle size={12} />}
                                {statusLabel[status]}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

// ── Helpers (sama persis dengan ReceiptModal) ──────────────────────────────

function Row({ label, value, bold, large, highlight }: {
    label: string; value: string;
    bold?: boolean; large?: boolean; highlight?: boolean;
}) {
    return (
        <div className={`flex justify-between gap-2 ${large ? 'text-sm' : 'text-xs'}`}>
            <span className="text-gray-500 shrink-0">{label}</span>
            <span className={`text-right ${bold ? 'font-bold text-gray-900' : ''} ${highlight ? 'text-emerald-600 font-semibold' : ''}`}>
                {value}
            </span>
        </div>
    );
}

function Dashed() {
    return <div className="border-t border-dashed border-gray-300" />;
}
