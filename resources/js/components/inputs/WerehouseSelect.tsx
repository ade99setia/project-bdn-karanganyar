import { AnimatePresence, motion } from 'framer-motion';
import { Search, ImageIcon, Plus, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

type Item = {
    id: string | number;
    title: string;
    subtitle?: string;
    image?: string | null;
    meta?: string;
};

interface Props {
    items: Item[];
    value: string | number;
    onChange: (id: string) => void;
    label?: string;
    placeholder?: string;
    onPreviewImage?: (url: string) => void;
}

export default function WerehouseSelect({ items, value, onChange, label, placeholder = 'Cari...', onPreviewImage }: Props) {
    const [query, setQuery] = useState('');
    const [showResults, setShowResults] = useState(false);
    const rootRef = useRef<HTMLDivElement | null>(null);

    const resolveImageSrc = (path?: string | null) => {
        if (!path) return null;
        if (path.startsWith('http://') || path.startsWith('https://')) return path;
        if (path.startsWith('/')) return path;
        if (path.startsWith('storage/')) return `/${path}`;
        return `/storage/${path}`;
    };

    const selectedItem = items.find(i => String(i.id) === String(value));
    const derivedInputValue = selectedItem ? selectedItem.title : '';

    useEffect(() => {
        const onDocClick = (e: MouseEvent) => {
            if (!rootRef.current) return;
            if (!rootRef.current.contains(e.target as Node)) setShowResults(false);
        };
        document.addEventListener('click', onDocClick);
        return () => document.removeEventListener('click', onDocClick);
    }, []);

    const filtered = query.trim().length > 0
        ? items.filter(i => i.title.toLowerCase().includes(query.toLowerCase()) || (i.subtitle || '').toLowerCase().includes(query.toLowerCase()))
        : items.slice(0, 10);

    return (
        <div className="space-y-2 relative" ref={rootRef}>
            {label && <label className="text-xs font-bold text-zinc-400 px-1 uppercase tracking-tight">{label}</label>}

            <div className="relative">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                    type="text"
                    placeholder={placeholder}
                    value={query.length > 0 ? query : derivedInputValue}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setShowResults(true);
                        if (value) onChange('');
                    }}
                    onFocus={() => setShowResults(true)}
                    className="w-full h-12 pl-12 pr-4 bg-zinc-100 dark:bg-zinc-900 border-none rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500 transition-all"
                />
            </div>

            <AnimatePresence>
                {showResults && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute z-50 w-full mt-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl max-h-60 overflow-y-auto p-2 thin-scrollbar"
                    >
                        {filtered.map(i => (
                            <button
                                key={i.id}
                                type="button"
                                onClick={() => {
                                    onChange(String(i.id));
                                    setQuery('');
                                    setShowResults(false);
                                }}
                                className="w-full flex items-center gap-3 p-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-colors text-left group"
                            >
                                <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 overflow-hidden shrink-0 border border-zinc-200 dark:border-zinc-700">
                                    {i.image ? (
                                        (() => {
                                            const src = resolveImageSrc(i.image);
                                            if (!src) return (
                                                <div className="w-full h-full flex items-center justify-center"><ImageIcon size={18} className="text-zinc-400" /></div>
                                            );
                                            return (
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); if (onPreviewImage) onPreviewImage(String(src)); }}
                                                    className="w-full h-full block cursor-pointer group"
                                                >
                                                    <img src={String(src)} alt={i.title} className="w-full h-full object-cover group-hover:brightness-110 transition-all" />
                                                </button>
                                            );
                                        })()
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center"><ImageIcon size={18} className="text-zinc-400" /></div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold dark:text-zinc-100 group-hover:text-indigo-600 transition-colors truncate">{i.title}</p>
                                    {i.subtitle && <p className="text-[11px] text-zinc-500 font-mono truncate">{i.subtitle}</p>}
                                    {i.meta && <p className="text-[10px] font-semibold text-indigo-500 uppercase">{i.meta}</p>}
                                </div>
                                <Plus size={14} className="text-zinc-300 group-hover:text-indigo-500" />
                            </button>
                        ))}

                        {query.trim().length > 0 && filtered.length === 0 && (
                            <div className="p-4 text-center text-zinc-500 text-xs italic">Data tidak ditemukan...</div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {value && !showResults && (
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border-2 border-indigo-200 dark:border-indigo-800">
                    {(() => {
                        const sel = selectedItem;
                        return (
                            <>
                                <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 shadow-md border-2 border-indigo-200 dark:border-indigo-800">
                                    {sel?.image ? (
                                        (() => {
                                            const src = resolveImageSrc(sel.image);
                                            if (!src) return (
                                                <div className="w-full h-full flex items-center justify-center bg-zinc-200 dark:bg-zinc-700">
                                                    <ImageIcon size={24} className="text-zinc-400" />
                                                </div>
                                            );
                                            return (
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); if (onPreviewImage) onPreviewImage(String(src)); }}
                                                    className="w-full h-full block cursor-pointer group"
                                                >
                                                    <img src={String(src)} alt={sel.title} className="w-full h-full object-cover group-hover:brightness-110 transition-all" />
                                                </button>
                                            );
                                        })()
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-zinc-200 dark:bg-zinc-700">
                                            <ImageIcon size={24} className="text-zinc-400" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-indigo-900 dark:text-indigo-100 wrap-break-word whitespace-normal">{sel?.title}</p>
                                    {sel?.subtitle && <p className="text-xs text-indigo-700 dark:text-indigo-300 font-mono">{sel.subtitle}</p>}
                                    {sel?.meta && <p className="text-[10px] font-semibold text-indigo-500 uppercase">{sel.meta}</p>}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        onChange('');
                                        setQuery('');
                                        setShowResults(false);
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
    );
}
