import { useState, useEffect } from 'react';
import { ShoppingCart, Trash2, Plus, Minus, ImageIcon, Loader2, Package } from 'lucide-react';
import type { CartItem, CartPreview } from '@/types/pos';
import CartItemDetailModal from '@/components/pos/CartItemDetailModal';

interface Props {
    cart: CartItem[];
    cartPreview: CartPreview | null;
    isLoadingPreview: boolean;
    totalItems: number;
    isVisible: boolean;
    onUpdateQty: (productId: number, qty: number) => void;
    onRemoveItem: (productId: number) => void;
    onClearCart: () => void;
    onPreviewImage: (url: string) => void;
    onFocusProductSearch: () => void;
}

export default function CartPanel({
    cart, cartPreview, isLoadingPreview, totalItems, isVisible,
    onUpdateQty, onRemoveItem, onClearCart, onPreviewImage, onFocusProductSearch,
}: Props) {
    const [detailProductId, setDetailProductId] = useState<number | null>(null);

    const detailIndex = detailProductId !== null ? cart.findIndex(i => i.product_id === detailProductId) : -1;
    const detailItem = detailIndex >= 0 ? cart[detailIndex] : null;
    const detailPreview = detailIndex >= 0 ? cartPreview?.items?.[detailIndex] : undefined;

    useEffect(() => {
        if (detailProductId !== null && detailIndex < 0) {
            setDetailProductId(null);
        }
    }, [detailProductId, detailIndex]);

    return (
        <>
            {/* Detail modal */}
            {detailItem && (
                <CartItemDetailModal
                    item={detailItem}
                    previewItem={detailPreview}
                    onUpdateQty={onUpdateQty}
                    onRemove={onRemoveItem}
                    onClose={() => setDetailProductId(null)}
                    onPreviewImage={onPreviewImage}
                />
            )}

            <div className={`flex flex-col flex-1 overflow-hidden border-r border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-950
                ${!isVisible ? 'hidden md:flex' : 'flex'}
                pb-14 md:pb-0
            `}>
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 shrink-0">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                        <ShoppingCart size={11} /> Keranjang
                        {totalItems > 0 && (
                            <span className="ml-1 bg-indigo-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{totalItems}</span>
                        )}
                    </p>
                    {cart.length > 0 && (
                        <button onClick={onClearCart} className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors">
                            <Trash2 size={11} /> Kosongkan
                        </button>
                    )}
                </div>

                {/* Items */}
                <div className="flex-1 overflow-y-auto">
                    {cart.length === 0 ? (
                        <div
                            className="flex flex-col items-center justify-center h-full gap-3 text-gray-300 dark:text-zinc-700 cursor-pointer select-none"
                            onClick={onFocusProductSearch}
                        >
                            <ShoppingCart size={44} strokeWidth={1} />
                            <p className="text-sm font-medium text-gray-400">Keranjang kosong</p>
                            <p className="text-xs text-gray-400 text-center">Pilih produk dari kolom kiri<br />atau klik di sini untuk fokus ke pencarian</p>
                        </div>
                    ) : (
                        <div className="p-2 space-y-2">
                            {cart.map((item, idx) => {
                                const previewItem = cartPreview?.items?.[idx];
                                const discountPct = previewItem?.discount_percentage ?? 0;
                                const discountAmt = previewItem?.discount_amount ?? 0;
                                const subtotal = previewItem?.subtotal ?? (item.unit_price * item.quantity);
                                return (
                                    <CartItemRow
                                        key={item.product_id}
                                        item={item}
                                        index={idx}
                                        discountPct={discountPct}
                                        discountAmt={discountAmt}
                                        subtotal={subtotal}
                                        onUpdateQty={onUpdateQty}
                                        onRemove={onRemoveItem}
                                        onOpenDetail={() => setDetailProductId(item.product_id)}
                                    />
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {cart.length > 0 && (
                    <div className="border-t border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-2 flex items-center justify-between shrink-0">
                        <span className="text-xs text-gray-400">{cart.length} jenis • {totalItems} item</span>
                        {isLoadingPreview && <Loader2 size={12} className="animate-spin text-indigo-400" />}
                    </div>
                )}
            </div>
        </>
    );
}

// ── Cart item row ──────────────────────────
interface CartItemRowProps {
    item: CartItem;
    index: number;
    discountPct: number;
    discountAmt: number;
    subtotal: number;
    onUpdateQty: (productId: number, qty: number) => void;
    onRemove: (productId: number) => void;
    onOpenDetail: () => void;
}

function CartItemRow({ item, index, discountPct, discountAmt, subtotal, onUpdateQty, onRemove, onOpenDetail }: CartItemRowProps) {
    const fmt = (v: number) => `Rp ${v.toLocaleString('id-ID')}`;

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 overflow-hidden shadow-sm hover:shadow-md transition-all group">

            {/* --- TAMPILAN MOBILE --- */}
            <div className="md:hidden">
                <button
                    type="button"
                    onClick={onOpenDetail}
                    className="w-full flex items-center gap-3 px-3 pt-3 pb-2 text-left hover:bg-gray-50 dark:hover:bg-zinc-800/50"
                >
                    <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                        <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">{index + 1}</span>
                    </div>
                    <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-gray-200 dark:border-zinc-700 bg-gray-100 flex items-center justify-center">
                        {item.image
                            ? <img src={`/storage/${item.image}`} alt={item.product_name} className="w-full h-full object-cover" />
                            : <Package size={16} className="text-gray-300" />
                        }
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight line-clamp-2 uppercase">{item.product_name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{fmt(item.unit_price)}</p>
                    </div>
                    <div className="text-right shrink-0">
                        <p className="text-sm font-black text-gray-900 dark:text-white tabular-nums">{fmt(subtotal)}</p>
                        {discountAmt > 0 && <p className="text-[10px] text-emerald-600 font-bold">-{fmt(discountAmt)}</p>}
                    </div>
                </button>

                <div className="flex items-center gap-2 px-3 pb-2.5">
                    <div className="flex items-center bg-gray-100 dark:bg-zinc-800 rounded-lg overflow-hidden border border-gray-200 dark:border-zinc-700">
                        <button onClick={() => onUpdateQty(item.product_id, item.quantity - 1)} className="w-8 h-7 flex items-center justify-center text-gray-500 hover:bg-red-50"><Minus size={11} /></button>
                        <button onClick={onOpenDetail} className="min-w-[2rem] px-2 h-7 text-center text-sm font-black border-x border-gray-200 dark:border-zinc-700 tabular-nums">{item.quantity}</button>
                        <button onClick={() => onUpdateQty(item.product_id, item.quantity + 1)} className="w-8 h-7 flex items-center justify-center text-gray-500 hover:bg-indigo-50"><Plus size={11} /></button>
                    </div>
                    <span className={`text-[10px] font-semibold flex-1 ${item.available_stock <= 5 ? 'text-amber-500' : 'text-gray-300'}`}>stok {item.available_stock}</span>
                    <button onClick={() => onRemove(item.product_id)} className="w-7 h-7 text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={13} /></button>
                </div>
            </div>

            {/* --- TAMPILAN DESKTOP --- */}
            <div className="hidden md:flex items-center px-3 py-3 gap-3 relative">
                <button
                    onClick={onOpenDetail}
                    className="absolute inset-0 w-full h-full text-left hover:bg-gray-50/50 dark:hover:bg-zinc-800/30 transition-colors cursor-pointer z-0"
                    aria-label="Detail Produk"
                />

                {/* Nomor + Gambar + Nama — flex-1 agar menyesuaikan sisa ruang */}
                <div className="relative flex items-center gap-3 flex-1 min-w-0 pointer-events-none z-10">
                    <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center shrink-0 border border-indigo-200 dark:border-indigo-800/50">
                        <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">{index + 1}</span>
                    </div>
                    <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-gray-100 dark:border-zinc-800 bg-gray-50 flex items-center justify-center shadow-sm">
                        {item.image
                            ? <img src={`/storage/${item.image}`} alt={item.product_name} className="w-full h-full object-cover" />
                            : <Package size={18} className="text-gray-300" />
                        }
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-gray-900 dark:text-white truncate uppercase tracking-tight">{item.product_name}</p>
                        <p className="text-[10px] text-gray-500 font-medium truncate">{fmt(item.unit_price)} / unit</p>
                    </div>
                </div>

                {/* Stok — lebar tetap tapi lebih kecil */}
                <div className="relative shrink-0 pointer-events-none z-10">
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border tracking-wider uppercase whitespace-nowrap ${item.available_stock <= 5
                            ? 'bg-red-50 text-red-600 border-red-100 dark:bg-red-900/20 dark:border-red-900/30'
                            : 'bg-gray-50 text-gray-500 border-gray-200 dark:bg-zinc-800 dark:border-zinc-700'
                        }`}>
                        {item.available_stock}
                    </span>
                </div>

                {/* Qty control */}
                <div className="relative shrink-0 flex justify-center z-20">
                    <div className="flex items-center bg-white dark:bg-zinc-950 rounded-lg border border-gray-200 dark:border-zinc-700 shadow-sm overflow-hidden">
                        <button onClick={() => onUpdateQty(item.product_id, item.quantity - 1)} className="w-7 h-7 flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-900/40 text-gray-400 hover:text-red-500 transition-colors"><Minus size={11} /></button>
                        <button onClick={onOpenDetail} className="min-w-[2rem] px-1 h-7 flex items-center justify-center text-sm font-black border-x border-gray-200 dark:border-zinc-700 tabular-nums hover:bg-indigo-50 dark:hover:bg-indigo-900/30">{item.quantity}</button>
                        <button onClick={() => onUpdateQty(item.product_id, item.quantity + 1)} className="w-7 h-7 flex items-center justify-center hover:bg-indigo-50 dark:hover:bg-indigo-900/40 text-gray-400 hover:text-indigo-600 transition-colors"><Plus size={11} /></button>
                    </div>
                </div>

                {/* Subtotal */}
                <div className="relative shrink-0 text-right pointer-events-none z-10 min-w-[5rem]">
                    <p className="text-sm font-black text-indigo-600 dark:text-indigo-400 tabular-nums">{fmt(subtotal)}</p>
                    {discountAmt > 0 && (
                        <div className="flex items-center justify-end gap-1 mt-0.5">
                            <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-500/20 px-1 rounded">-{discountPct}%</span>
                            <span className="text-[10px] text-emerald-600 font-bold whitespace-nowrap">-{fmt(discountAmt)}</span>
                        </div>
                    )}
                </div>

                {/* Hapus */}
                <div className="relative shrink-0 z-20">
                    <button onClick={() => onRemove(item.product_id)} className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/40 rounded-lg transition-all">
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
}
