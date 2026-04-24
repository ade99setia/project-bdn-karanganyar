import { useEffect } from 'react';
import { Head } from '@inertiajs/react';
import type { Transaction } from '@/types/pos';
import { useGrayscaleImage } from '@/hooks/use-grayscale-image';

interface Props {
    transaction: Transaction;
}

export default function ReceiptPrint({ transaction }: Props) {
    const fmt = (v: number) => `Rp ${v.toLocaleString('id-ID')}`;
    const date = new Date(transaction.created_at);
    const dateStr = date.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const timeStr = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    // Detect paper width from URL param: ?size=58 or ?size=80 (default)
    const paperWidth = new URLSearchParams(window.location.search).get('size') === '58' ? '58mm' : '80mm';

    const logoSrc = transaction.warehouse?.file_path ? `/storage/${transaction.warehouse.file_path}` : null;
    const grayscaleLogo = useGrayscaleImage(logoSrc);

    // Auto-trigger print dialog — tunggu logo selesai dikonversi dulu
    useEffect(() => {
        // Kalau ada logo, tunggu sampai grayscale selesai (max 2 detik)
        const delay = logoSrc ? (grayscaleLogo ? 300 : 2000) : 500;
        const t = setTimeout(() => window.print(), delay);
        return () => clearTimeout(t);
    }, [grayscaleLogo]);

    return (
        <>
            <Head title={`Struk ${transaction.transaction_number}`} />

            <style>{`
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: 'Courier New', Courier, monospace; font-size: 11px; line-height: 1.5; background: white; color: #000; }
                .receipt { width: ${paperWidth}; margin: 0 auto; padding: 8px; }
                .center { text-align: center; }
                .bold { font-weight: bold; }
                .sep { border-top: 1px dashed #000; margin: 6px 0; }
                .sep-solid { border-top: 2px solid #000; margin: 6px 0; }
                .row { display: flex; justify-content: space-between; margin: 2px 0; }
                .row .label { flex: 1; }
                .row .val { text-align: right; min-width: 90px; }
                .item-name { flex: 1; padding-right: 4px; }
                .item-sub { font-size: 10px; color: #555; padding-left: 4px; display: flex; justify-content: space-between; }
                .grand { font-size: 13px; font-weight: bold; }
                .member-box { border: 1px dashed #000; padding: 4px 6px; margin: 4px 0; font-size: 10px; }
                .no-print { margin-top: 16px; text-align: center; }
                @media print {
                    .no-print { display: none; }
                    @page { margin: 0; size: ${paperWidth} auto; }
                }
            `}</style>

            <div className="receipt">
                {/* Header */}
                <div className="center" style={{ marginBottom: 6 }}>
                    {grayscaleLogo && (
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}>
                            <img
                                src={grayscaleLogo}
                                alt="Logo"
                                style={{ maxHeight: 48, maxWidth: 120, objectFit: 'contain' }}
                            />
                        </div>
                    )}
                    <div className="bold" style={{ fontSize: 13 }}>{transaction.warehouse?.name ?? 'Toko'}</div>
                    {transaction.warehouse?.receipt_header && <div>{transaction.warehouse.receipt_header}</div>}
                    {transaction.warehouse?.address && <div>{transaction.warehouse.address}</div>}
                    {transaction.warehouse?.phone && <div>Telp: {transaction.warehouse.phone}</div>}
                </div>

                <div className="sep-solid" />

                {/* Meta */}
                <div className="row"><span className="label">No</span><span className="val bold">{transaction.transaction_number}</span></div>
                <div className="row"><span className="label">Tanggal</span><span className="val">{dateStr} {timeStr}</span></div>
                {transaction.cashier && <div className="row"><span className="label">Kasir</span><span className="val">{transaction.cashier.name}</span></div>}

                {/* Member */}
                {transaction.member && (
                    <div className="member-box" style={{ marginTop: 6 }}>
                        <div className="bold">Member: {transaction.member.name}</div>
                        <div>{transaction.member.member_number}</div>
                        {transaction.member.membership_tier && (
                            <div>Tier: {transaction.member.membership_tier.name} (-{transaction.member.membership_tier.default_discount_percentage}%)</div>
                        )}
                    </div>
                )}

                <div className="sep" />

                {/* Items header */}
                <div className="row bold">
                    <span className="item-name">Item</span>
                    <span>Qty</span>
                    <span style={{ minWidth: 70, textAlign: 'right' }}>Total</span>
                </div>
                <div className="sep" />

                {/* Items */}
                {transaction.items.map((item, i) => (
                    <div key={i} style={{ marginBottom: 3 }}>
                        <div className="row">
                            <span className="item-name">{item.product_name}</span>
                            <span style={{ width: 24, textAlign: 'center' }}>{item.quantity}</span>
                            <span style={{ minWidth: 70, textAlign: 'right' }}>{fmt(item.unit_price * item.quantity)}</span>
                        </div>
                        <div className="item-sub">
                            <span>{item.quantity} × {fmt(item.unit_price)}</span>
                            {item.discount_amount > 0 && <span>-{fmt(item.discount_amount)}</span>}
                        </div>
                    </div>
                ))}

                <div className="sep" />

                {/* Totals */}
                <div className="row"><span className="label">Subtotal</span><span className="val">{fmt(transaction.subtotal)}</span></div>
                {transaction.total_discount > 0 && (
                    <div className="row"><span className="label">Diskon</span><span className="val">-{fmt(transaction.total_discount)}</span></div>
                )}

                <div className="sep-solid" />
                <div className="row grand"><span className="label">TOTAL</span><span className="val">{fmt(transaction.grand_total)}</span></div>
                <div className="sep-solid" />

                {/* Payment */}
                <div className="row"><span className="label">Tunai</span><span className="val">{fmt(transaction.cash_received)}</span></div>
                <div className="row bold"><span className="label">Kembali</span><span className="val">{fmt(transaction.cash_change)}</span></div>

                <div className="sep" />

                {/* Footer */}
                <div className="center bold" style={{ marginTop: 4 }}>Terima Kasih!</div>
                <div className="center" style={{ fontSize: 10, marginTop: 2 }}>
                    {transaction.warehouse?.receipt_footer ?? 'Belanja lagi ya 😊'}
                </div>
                <div className="center" style={{ fontSize: 9, marginTop: 4, color: '#666' }}>
                    {date.toLocaleString('id-ID')}
                </div>

                {/* Manual print button (hidden on print) */}
                <div className="no-print">
                    <button
                        onClick={() => window.print()}
                        style={{ padding: '8px 20px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}
                    >
                        Cetak Struk
                    </button>
                </div>
            </div>
        </>
    );
}
