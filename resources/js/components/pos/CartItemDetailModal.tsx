import { useEffect, useRef, useState } from 'react';
import { X, Trash2, Minus, Plus, Package } from 'lucide-react';
import type { CartItem, CartPreview } from '@/types/pos';

interface Props {
    item: CartItem;
    previewItem?: CartPreview['items'][number];
    onUpdateQty: (productId: number, qty: number) => void;
    onRemove: (productId: number) => void;
    onClose: () => void;
    onPreviewImage: (url: string) => void;
}

export default function CartItemDetailModal({
    item, previewItem, onUpdateQty, onRemove, onClose, onPreviewImage,
}: Props) {
    const [inputQty, setInputQty] = useState(String(item.quantity));
    const inputRef = useRef<HTMLInputElement>(null);

    const discountPct = previewItem?.discount_percentage ?? 0;
    const discountAmt = previewItem?.discount_amount ?? 0;
    const subtotal    = previewItem?.subtotal ?? (item.unit_price * item.quantity);
    const fmt = (v: number) => `Rp ${v.toLocaleString('id-ID')}`;

    useEffect(() => {
        const t = setTimeout(() => {
            inputRef.current?.focus();
            inputRef.current?.select();
        }, 80);
        return () => clearTimeout(t);
    }, []);

    useEffect(() => {
        setInputQty(String(item.quantity));
    }, [item.quantity]);

    const commit = (raw: string) => {
        const n = parseInt(raw);
        if (!isNaN(n) && n > 0 && n <= item.available_stock) {
            onUpdateQty(item.product_id, n);
        } else {
            setInputQty(String(item.quantity));
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter')     { commit(inputQty); onClose(); }
        if (e.key === 'Escape')    { onClose(); }
        if (e.key === 'ArrowUp')   { e.preventDefault(); step(1); }
        if (e.key === 'ArrowDown') { e.preventDefault(); step(-1); }
    };

    const step = (delta: number) => {
        const next = item.quantity + delta;
        if (next < 1) { onRemove(item.product_id); onClose(); return; }
        if (next > item.available_stock) return;
        onUpdateQty(item.product_id, next);
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <div
                className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-zinc-800">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">Detail Item Keranjang</p>
                    <button type="button" onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 flex items-center justify-center text-gray-400 transition-colors">
                        <X size={15} />
                    </button>
                </div>

                {/* Product info */}
                <div className="px-4 py-4 flex gap-4 items-start">
                    <button
                        type="button"
                        onClick={() => item.image && onPreviewImage(`/storage/${item.image}`)}
                        className={`w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-gray-200 dark:border-zinc-700 bg-gray-100 dark:bg-zinc-800 flex items-center justify-center ${item.image ? 'cursor-zoom-in hover:opacity-80 transition-opacity' : 'cursor-default'}`}
                    >
                        {item.image
                            ? <img src={`/storage/${item.image}`} alt={item.product_name} className="w-full h-full object-cover" />
                            : <Package size={28} className="text-gray-300 dark:text-zinc-600" />
                        }
                    </button>

                    <div className="flex-1 min-w-0 space-y-1">
                        <p className="text-base font-bold text-gray-900 dark:text-white leading-tight">{item.product_name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{fmt(item.unit_price)} / item</p>
                        <div className="flex items-center gap-2 flex-wrap">
                            {discountPct > 0 && (
                                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
                                    Diskon {discountPct}%
                                </span>
                            )}
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                item.available_stock > 10 ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20'
                                : item.available_stock > 0 ? 'text-amber-600 bg-amber-50 dark:bg-amber-900/20'
                                : 'text-red-500 bg-red-50 dark:bg-red-900/20'
                            }`}>
                                Stok: {item.available_stock}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Qty input */}
                <div className="px-4 pb-4 space-y-3">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => step(-1)}
                            className="w-11 h-11 rounded-xl bg-gray-100 dark:bg-zinc-800 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 flex items-center justify-center text-gray-600 dark:text-gray-400 transition-colors shrink-0"
                        >
                            <Minus size={16} />
                        </button>

                        <div className="flex-1">
                            <input
                                ref={inputRef}
                                type="number"
                                value={inputQty}
                                onChange={e => setInputQty(e.target.value)}
                                onBlur={() => commit(inputQty)}
                                onKeyDown={handleKeyDown}
                                min={1}
                                max={item.available_stock}
                                className="w-full text-center text-2xl font-black text-gray-900 dark:text-white bg-gray-50 dark:bg-zinc-800 border-2 border-indigo-300 dark:border-indigo-700 rounded-xl py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <p className="text-center text-[10px] text-gray-400 mt-1">
                                ↑↓ atau ketik langsung • Enter konfirmasi
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => step(1)}
                            disabled={item.quantity >= item.available_stock}
                            className="w-11 h-11 rounded-xl bg-gray-100 dark:bg-zinc-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 hover:text-indigo-600 flex items-center justify-center text-gray-600 dark:text-gray-400 transition-colors shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <Plus size={16} />
                        </button>
                    </div>

                    {/* Subtotal */}
                    <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800">
                        <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">Subtotal</span>
                        <div className="text-right">
                            <p className="text-base font-black text-indigo-700 dark:text-indigo-300">{fmt(subtotal)}</p>
                            {discountAmt > 0 && (
                                <p className="text-[10px] text-emerald-600">hemat {fmt(discountAmt)}</p>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-1">
                        <button
                            type="button"
                            onClick={() => { onRemove(item.product_id); onClose(); }}
                            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 dark:border-red-800 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm font-semibold transition-colors"
                        >
                            <Trash2 size={14} /> Hapus
                        </button>
                        <button
                            type="button"
                            onClick={() => { commit(inputQty); onClose(); }}
                            className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition-colors"
                        >
                            Simpan
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
