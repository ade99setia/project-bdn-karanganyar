import { AnimatePresence, motion } from 'framer-motion';
import { Search, ImageIcon, Plus, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface Product {
    id: number;
    name: string;
    sku: string;
    file_path?: string | null;
    stock_quantity?: number | null;
}

interface Props {
    products: Product[];
    value: string;
    onChange: (id: string) => void;
    placeholder?: string;
    label?: string;
    onPreviewImage?: (url: string) => void;
    selectedStock?: number | null;
}

export default function ProductSelect({ products, value, onChange, placeholder = 'Ketik nama atau SKU produk...', label, onPreviewImage, selectedStock }: Props) {
    const [searchQuery, setSearchQuery] = useState('');
    const [showResults, setShowResults] = useState(false);
    const rootRef = useRef<HTMLDivElement | null>(null);

    // Compute inputValue based on selection and searchQuery
    const selectedProduct = products.find(p => String(p.id) === String(value));
    const computedInputValue = selectedProduct ? selectedProduct.name : searchQuery;

    useEffect(() => {
        const onDocClick = (e: MouseEvent) => {
            if (!rootRef.current) return;
            if (!rootRef.current.contains(e.target as Node)) {
                setShowResults(false);
            }
        };
        document.addEventListener('click', onDocClick);
        return () => document.removeEventListener('click', onDocClick);
    }, []);

    const selectableProducts = products;

    return (
        <div className="space-y-2 relative" ref={rootRef}>
            {label && <label className="text-xs font-bold text-zinc-400 px-1 uppercase tracking-tight">{label}</label>}

            <div className="space-y-2">
                <div className="relative">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                        type="text"
                        placeholder={placeholder}
                        value={computedInputValue ?? ''}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setShowResults(true);
                            if (value) onChange('');
                        }}
                        onFocus={() => setShowResults(true)}
                        className="w-full h-12 pl-12 pr-4 bg-zinc-100 dark:bg-zinc-900 border-none rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                </div>

                {value && !showResults && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border-2 border-indigo-200 dark:border-indigo-800">
                        {(() => {
                            const selected = products.find(p => String(p.id) === String(value));
                            return (
                                <>
                                    <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 shadow-md border-2 border-indigo-200 dark:border-indigo-800">
                                        {selected?.file_path ? (
                                            <button
                                                onClick={() => onPreviewImage && onPreviewImage(`/storage/${selected.file_path}`)}
                                                className="w-full h-full block cursor-pointer group"
                                            >
                                                <img src={`/storage/${selected.file_path}`} alt={selected.name} className="w-full h-full object-cover group-hover:brightness-110 transition-all" />
                                            </button>
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-zinc-200 dark:bg-zinc-700"><ImageIcon size={24} className="text-zinc-400" /></div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-indigo-900 dark:text-indigo-100 wrap-break-word whitespace-normal">{selected?.name}</p>
                                        <p className="text-xs text-indigo-700 dark:text-indigo-300 font-mono">{selected?.sku}</p>
                                        <p className="text-[10px] font-semibold text-indigo-500 uppercase">Stok: {Math.max(0, Number((typeof selectedStock !== 'undefined' && selectedStock !== null) ? selectedStock : (selected?.stock_quantity ?? 0)) )}</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            onChange('');
                                            setSearchQuery('');
                                        }}
                                        className="p-1.5 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-900/40 transition-colors text-indigo-600"
                                    >
                                        <X size={18} />
                                    </button>
                                </>
                            );
                        })()}
                    </motion.div>
                )}
            </div>

            <AnimatePresence>
                {showResults && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute z-50 w-full mt-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl max-h-60 overflow-y-auto p-2 thin-scrollbar"
                    >
                        {(searchQuery.trim().length > 0
                            ? selectableProducts.filter(p =>
                                p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                p.sku.toLowerCase().includes(searchQuery.toLowerCase())
                            )
                            : selectableProducts.slice(0, 10)
                        )
                            .map(p => (
                                <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => {
                                        onChange(String(p.id));
                                        setShowResults(false);
                                    }}
                                    className="w-full flex items-center gap-3 p-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-colors text-left group"
                                >
                                    <div className="w-12 h-12 rounded-lg bg-zinc-100 dark:bg-zinc-800 overflow-hidden shrink-0 border border-zinc-200 dark:border-zinc-700">
                                        {p.file_path ? (
                                            <div
                                                role="button"
                                                tabIndex={0}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (onPreviewImage) {
                                                        onPreviewImage(`/storage/${p.file_path}`);
                                                    }
                                                }}
                                                className="w-full h-full block cursor-pointer group"
                                            >
                                                <img src={`/storage/${p.file_path}`} alt={p.name} className="w-full h-full object-cover group-hover:brightness-110 transition-all" />
                                            </div>
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center"><ImageIcon size={20} className="text-zinc-400" /></div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold dark:text-zinc-100 group-hover:text-indigo-600 transition-colors wrap-break-word whitespace-normal">{p.name}</p>
                                        <p className="text-[10px] text-zinc-500 font-mono tracking-tighter uppercase">{p.sku}</p>
                                        <p className="text-[10px] font-semibold text-indigo-500 uppercase">Stok: {Math.max(0, Number(p.stock_quantity ?? 0))}</p>
                                    </div>
                                    <Plus size={16} className="text-zinc-300 group-hover:text-indigo-500" />
                                </button>
                            ))}

                        {searchQuery.trim().length > 0 && selectableProducts.filter(p =>
                            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            p.sku.toLowerCase().includes(searchQuery.toLowerCase())
                        ).length === 0 && (
                            <div className="p-4 text-center text-zinc-500 text-xs italic">Produk tidak ditemukan...</div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
