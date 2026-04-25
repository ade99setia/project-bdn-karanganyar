import { Head, usePage } from '@inertiajs/react';
import { ReceiptText, Printer, User, Package, Share2, MessageCircle } from 'lucide-react';
import type { Transaction } from '@/types/pos';

interface Props {
    transaction: Transaction;
}

const breadcrumbs = [
    { title: 'Point of Sales', href: '/pos' },
    { title: 'Struk', href: '#' },
];

export default function ReceiptShow({ transaction }: Props) {
    const { auth } = usePage<{ auth: { user: { role?: string } | null } }>().props;
    const isGuest   = !auth?.user;
    const isCashier = auth?.user?.role === 'kasir';

    const fmt = (v: number) => `Rp ${v.toLocaleString('id-ID')}`;
    const date = new Date(transaction.created_at);
    const dateStr = date.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
    const timeStr = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const logoUrl = transaction.warehouse?.file_path ? `/storage/${transaction.warehouse.file_path}` : null;
    const receiptUrl = window.location.href;

    const handleShare = async () => {
        const shareData = {
            title: `Struk ${transaction.transaction_number}`,
            text: `Struk belanja dari ${transaction.warehouse?.name ?? 'Toko'} — Total: Rp ${transaction.grand_total.toLocaleString('id-ID')}`,
            url: receiptUrl,
        };
        if (navigator.share) {
            try { await navigator.share(shareData); } catch { /* user cancel */ }
        } else {
            // Fallback: copy to clipboard
            await navigator.clipboard.writeText(receiptUrl);
            alert('Link struk disalin ke clipboard!');
        }
    };

    const handleShareWA = () => {
        const text = encodeURIComponent(
            `Struk belanja dari *${transaction.warehouse?.name ?? 'Toko'}*\nNo: ${transaction.transaction_number}\nTotal: Rp ${transaction.grand_total.toLocaleString('id-ID')}\n\n${receiptUrl}`
        );
        window.open(`https://wa.me/?text=${text}`, '_blank');
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-zinc-950 py-8 px-4">
            <Head title={`Struk ${transaction.transaction_number}`} />

            <div className="max-w-sm mx-auto py-8 px-4">

                {/* Receipt card */}
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 overflow-hidden shadow-md font-mono">

                    {/* Store header - Netral agar tidak nabrak logo */}
                    <div className="bg-white dark:bg-zinc-900 text-gray-800 dark:text-gray-100 text-center py-6 px-5 border-b border-dashed border-gray-200 dark:border-zinc-800">
                        {logoUrl && (
                            <div className="flex justify-center mb-4">
                                <div className="p-1.5 bg-white dark:bg-white rounded-xl shadow-sm border border-gray-50"> 
                                    <img
                                        src={logoUrl}
                                        alt="Logo"
                                        className="max-h-16 max-w-[160px] object-contain"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="flex items-center justify-center gap-2 mb-2">
                            <ReceiptText size={18} className="text-indigo-600 dark:text-indigo-400" />
                            <p className="font-extrabold text-base tracking-tight uppercase">
                                {transaction.warehouse?.name ?? 'Toko'}
                            </p>
                        </div>

                        <div className="space-y-0.5 opacity-80">
                            {transaction.warehouse?.receipt_header && (
                                <p className="text-[11px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide">
                                    {transaction.warehouse.receipt_header}
                                </p>
                            )}
                            {transaction.warehouse?.address && (
                                <p className="text-[10px] leading-relaxed italic text-gray-500 dark:text-gray-400">
                                    {transaction.warehouse.address}
                                </p>
                            )}
                            {transaction.warehouse?.phone && (
                                <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400">
                                    Telp: {transaction.warehouse.phone}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="px-5 py-5 space-y-5">
                        {/* Meta Info */}
                        <div className="space-y-1.5 text-[11px] text-gray-600 dark:text-gray-400">
                            <Row label="No. Transaksi" value={transaction.transaction_number} bold />
                            <Row label="Waktu" value={`${dateStr} • ${timeStr}`} />
                            {transaction.cashier && <Row label="Kasir" value={transaction.cashier.name} />}
                        </div>

                        {/* Member Section */}
                        {transaction.member && (
                            <div className="border border-dashed border-indigo-200 dark:border-indigo-800/50 rounded-xl px-3 py-3 bg-indigo-50/50 dark:bg-indigo-900/10 space-y-1.5 transition-colors">
                                <p className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.1em] flex items-center gap-1.5">
                                    <User size={10} strokeWidth={3} /> Member Loyalty
                                </p>
                                <Row label="Nama" value={transaction.member.name} />
                                <Row label="ID" value={transaction.member.member_number} />
                                {transaction.member.membership_tier && (
                                    <Row
                                        label="Tier"
                                        value={`${transaction.member.membership_tier.name} (-${transaction.member.membership_tier.default_discount_percentage}%)`}
                                        highlight
                                    />
                                )}
                            </div>
                        )}

                        <Dashed />

                        {/* Items Section */}
                        <div className="space-y-3">
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.1em] flex items-center gap-1.5">
                                <Package size={10} strokeWidth={3} /> Daftar Item
                            </p>
                            <div className="space-y-3">
                                {transaction.items.map((item, i) => (
                                    <div key={i} className="text-xs">
                                        <div className="flex justify-between text-gray-900 dark:text-gray-100 font-medium mb-0.5">
                                            <span className="flex-1 truncate pr-4">{item.product_name}</span>
                                            <span className="shrink-0 tabular-nums">{fmt(item.unit_price * item.quantity)}</span>
                                        </div>
                                        <div className="flex justify-between text-[10px] text-gray-500">
                                            <span className="font-mono">{item.quantity} × {fmt(item.unit_price)}</span>
                                            {item.discount_amount > 0 && (
                                                <span className="text-emerald-600 font-bold">-{fmt(item.discount_amount)}</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <Dashed />

                        {/* Totals Section */}
                        <div className="space-y-2">
                            <div className="space-y-1 text-gray-600 dark:text-gray-400">
                                <Row label="Subtotal" value={fmt(transaction.subtotal)} />
                                {transaction.total_discount > 0 && (
                                    <Row label="Diskon" value={`-${fmt(transaction.total_discount)}`} success />
                                )}
                            </div>

                            <div className="border-t-2 border-gray-900 dark:border-gray-100 pt-3 mt-1">
                                <Row label="TOTAL PEMBAYARAN" value={fmt(transaction.grand_total)} bold large />
                            </div>

                            <div className="space-y-1 pt-1 text-gray-600 dark:text-gray-400">
                                <Row label="Tunai" value={fmt(transaction.cash_received)} />
                                <Row label="Kembali" value={fmt(transaction.cash_change)} bold />
                            </div>
                        </div>

                        <Dashed />

                        {/* Footer Section */}
                        <div className="text-center space-y-2 pt-2">
                            <p className="font-bold text-gray-800 dark:text-gray-200 text-xs">Terima Kasih Atas Kunjungan Anda</p>
                            <p className="text-[10px] text-gray-400 leading-relaxed px-4">
                                {transaction.warehouse?.receipt_footer ?? 'Simpan struk ini sebagai bukti transaksi yang sah.'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Action buttons — beda berdasarkan role */}
                <div className="mt-6 flex flex-col gap-3">
                    {/* Guest / customer — tombol share */}
                    {isGuest && (
                        <>
                            <button
                                onClick={handleShareWA}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-green-500 hover:bg-green-600 text-white text-sm font-bold transition-all shadow-sm"
                            >
                                <MessageCircle size={16} /> Bagikan via WhatsApp
                            </button>
                            <button
                                onClick={handleShare}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 transition-all shadow-sm"
                            >
                                <Share2 size={16} /> Bagikan ke Sosmed / Lainnya
                            </button>
                        </>
                    )}

                    {/* Kasir / admin — tombol cetak */}
                    {!isGuest && (
                        <div className="flex flex-col sm:flex-row gap-3">
                            <a
                                href={`/pos/receipts/${transaction.transaction_number}/print?size=80`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-bold hover:opacity-90 transition-all shadow-sm"
                            >
                                <Printer size={14} /> Cetak 80mm
                            </a>
                            <a
                                href={`/pos/receipts/${transaction.transaction_number}/print?size=58`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 transition-all shadow-sm"
                            >
                                <Printer size={14} /> Cetak 58mm
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function Row({ label, value, bold, large, highlight, success }: {
    label: string; value: string;
    bold?: boolean; large?: boolean; highlight?: boolean; success?: boolean;
}) {
    return (
        <div className={`flex justify-between items-baseline gap-4 ${large ? 'text-[15px]' : 'text-[11px]'}`}>
            <span className="text-gray-500 dark:text-gray-500 shrink-0 font-medium">{label}</span>
            <span className={`text-right tabular-nums ${bold ? 'font-black' : 'font-semibold'} ${success ? 'text-emerald-600 dark:text-emerald-400' : highlight ? 'text-indigo-600 dark:text-indigo-400' : bold ? 'text-gray-950 dark:text-white' : 'text-gray-800 dark:text-gray-200'}`}>
                {value}
            </span>
        </div>
    );
}

function Dashed() {
    return <div className="py-1"><div className="border-t border-dashed border-gray-200 dark:border-zinc-800" /></div>;
}