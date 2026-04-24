import { useRef } from 'react';
import { Search, Package, Loader2, XCircle, ScanLine } from 'lucide-react';
import type { Product } from '@/types/pos';

interface Props {
    products: Product[];
    productQuery: string;
    isLoadingProducts: boolean;
    isVisible: boolean;
    onQueryChange: (q: string) => void;
    onAddToCart: (product: Product) => void;
    onOpenScanner: () => void;
    onFetchProducts: (q: string) => void;
    productInputRef: React.Ref<HTMLInputElement>;
}

export default function ProductSearch({
    products, productQuery, isLoadingProducts, isVisible,
    onQueryChange, onAddToCart, onOpenScanner, onFetchProducts, productInputRef,
}: Props) {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            const q = productQuery.trim().toLowerCase();
            const exact = products.find(p =>
                p.available_stock > 0 &&
                (p.sku.toLowerCase() === q || p.name.toLowerCase() === q)
            );
            if (exact) { onAddToCart(exact); return; }
            const single = products.length === 1 && products[0].available_stock > 0 ? products[0] : null;
            if (single) { onAddToCart(single); return; }
        }
        if (e.key === 'Escape') onQueryChange('');
    };

    return (
        <div className={`flex flex-col shrink-0 border-r border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900
            w-full md:w-72 xl:w-80
            ${!isVisible ? 'hidden md:flex' : 'flex'}
            pb-14 md:pb-0
        `}>
            {/* Search input */}
            <div className="px-3 pt-3 pb-2 border-b border-gray-100 dark:border-zinc-800 w-full overflow-hidden">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <Search size={11} /> Cari Produk
                </p>

                <div className="flex items-center gap-2">
                    <div className="flex-1 min-w-0 flex items-center gap-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
                        <Search size={14} className="text-gray-400 shrink-0" />
                        <input
                            ref={productInputRef}
                            type="text"
                            value={productQuery}
                            onChange={e => onQueryChange(e.target.value)}
                            onFocus={() => { if (products.length === 0) onFetchProducts(''); }}
                            onKeyDown={handleKeyDown}
                            placeholder="Nama / SKU / barcode..."
                            className="flex-1 min-w-0 bg-transparent text-sm outline-none text-gray-900 dark:text-white placeholder-gray-400"
                        />
                        <div className="flex items-center shrink-0 ml-1">
                            {isLoadingProducts
                                ? <Loader2 size={13} className="animate-spin text-gray-400" />
                                : productQuery && (
                                    <button onClick={() => onQueryChange('')} className="text-gray-400 hover:text-gray-600">
                                        <XCircle size={14} />
                                    </button>
                                )
                            }
                        </div>
                    </div>

                    <button
                        onClick={onOpenScanner}
                        title="Scan barcode dengan kamera"
                        className="flex md:hidden w-10 h-10 shrink-0 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white items-center justify-center transition-colors shadow-md active:scale-95"
                    >
                        <ScanLine size={18} />
                    </button>
                </div>

                <p className="md:hidden text-[10px] text-gray-400 mt-1.5 px-0.5 flex items-center gap-1">
                    Klik <ScanLine size={10} /> untuk scan menggunakan kamera
                </p>
            </div>

            {/* Product list */}
            <div className="flex-1 overflow-y-auto">
                {products.length === 0 && !isLoadingProducts && !productQuery && (
                    <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-300 dark:text-zinc-700 px-4 text-center">
                        <Package size={36} strokeWidth={1} />
                        <p className="text-xs">Ketik nama produk atau scan barcode untuk mencari</p>
                    </div>
                )}
                {isLoadingProducts && (
                    <div className="flex items-center justify-center h-20">
                        <Loader2 size={20} className="animate-spin text-indigo-400" />
                    </div>
                )}
                {!isLoadingProducts && products.map(p => {
                    const outOfStock = p.available_stock <= 0;
                    return (
                        <button
                            key={p.id}
                            type="button"
                            onClick={() => !outOfStock && onAddToCart(p)}
                            disabled={outOfStock}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 transition-colors text-left group border-b border-gray-100 dark:border-zinc-800 last:border-0
                                ${outOfStock
                                    ? 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-zinc-800/30'
                                    : 'hover:bg-indigo-50 dark:hover:bg-indigo-900/20 cursor-pointer'
                                }`}
                        >
                            <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 overflow-hidden">
                                {p.image
                                    ? <img src={`/storage/${p.image}`} alt={p.name} className="w-full h-full object-cover" />
                                    : <Package size={15} className="text-gray-400" />
                                }
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className={`text-sm font-semibold truncate transition-colors ${outOfStock ? 'text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-white group-hover:text-indigo-600'}`}>
                                    {p.name}
                                </p>
                                <p className="text-xs text-gray-400">{p.sku}</p>
                            </div>
                            <div className="text-right shrink-0">
                                <p className={`text-xs font-bold ${outOfStock ? 'text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                                    Rp {p.price.toLocaleString('id-ID')}
                                </p>
                                <p className={`text-xs font-medium ${p.available_stock > 10 ? 'text-emerald-600' : p.available_stock > 0 ? 'text-amber-500' : 'text-red-500'}`}>
                                    {outOfStock ? 'Stok habis' : `stok ${p.available_stock}`}
                                </p>
                            </div>
                        </button>
                    );
                })}
                {!isLoadingProducts && products.length === 0 && productQuery && (
                    <p className="text-center text-xs text-gray-400 py-8">Produk tidak ditemukan</p>
                )}
            </div>
        </div>
    );
}
