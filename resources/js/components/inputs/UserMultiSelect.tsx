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
    value: Array<string | number>;
    onChange: (ids: Array<string | number>) => void;
    label?: string;
    placeholder?: string;
    onPreviewImage?: (url: string) => void;
    onQueryChange?: (q: string) => void;
}

export default function UserMultiSelect({ items, value, onChange, label, placeholder = 'Cari...', onPreviewImage, onQueryChange }: Props) {
    const [query, setQuery] = useState('');
    const [showResults, setShowResults] = useState(false);
    const rootRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const onDocClick = (e: MouseEvent) => {
            if (!rootRef.current) return;
            if (!rootRef.current.contains(e.target as Node)) setShowResults(false);
        };
        document.addEventListener('click', onDocClick);
        return () => document.removeEventListener('click', onDocClick);
    }, []);

    const selectedSet = new Set(value.map((v) => String(v)));
    const showPlaceholder = value.length === 0 && query.trim().length === 0;

    const baseFiltered = query.trim().length > 0
        ? items.filter(i => i.title.toLowerCase().includes(query.toLowerCase()) || (i.subtitle || '').toLowerCase().includes(query.toLowerCase()))
        : items.slice(0, 20);

    const filtered = baseFiltered.filter(i => !selectedSet.has(String(i.id)));

    const add = (id: string | number) => {
        if (selectedSet.has(String(id))) return;
        onChange([...value, id]);
        setQuery('');
        setShowResults(true);
    };

    const remove = (id: string | number) => {
        onChange(value.filter(v => String(v) !== String(id)));
    };

    return (
        <div className="space-y-2 relative" ref={rootRef}>
            {label && <label className="text-xs font-bold text-zinc-400 px-1 uppercase tracking-tight">{label}</label>}

            <div className="relative">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                <div
                    onClick={() => setShowResults(true)}
                    className={`w-full pl-12 pr-4 bg-zinc-100 dark:bg-zinc-900 border-none rounded-2xl text-sm font-semibold flex ${showPlaceholder ? 'items-center' : 'items-start'} gap-2 transition-all`}
                    style={{ resize: 'vertical', minHeight: 48, maxHeight: 240, overflow: 'auto' }}
                >
                    <div className={`flex-1 flex flex-wrap ${showPlaceholder ? 'items-center' : 'items-start'} gap-2 min-w-0 p-2`}>
                        {value.length === 0 && !query && (
                            <div className="text-zinc-500 truncate">{placeholder}</div>
                        )}

                        {value.map((id) => {
                            const item = items.find(i => String(i.id) === String(id));
                            if (!item) return null;
                            return (
                                <div key={id} className="flex items-center gap-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-2 py-1 rounded-xl text-xs font-semibold max-w-xs">
                                    <div className="w-6 h-6 rounded-md bg-zinc-100 dark:bg-zinc-800 overflow-hidden shrink-0 border border-zinc-200 dark:border-zinc-700">
                                        {item.image ? (
                                            <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center"><ImageIcon size={14} className="text-zinc-400" /></div>
                                        )}
                                    </div>
                                    <div className="min-w-0 truncate">{item.title}</div>
                                    <button type="button" onClick={(e) => { e.stopPropagation(); remove(id); }} className="text-zinc-400 hover:text-zinc-600">
                                        <X size={14} />
                                    </button>
                                </div>
                            );
                        })}

                        <input
                            type="text"
                            value={query}
                            onChange={(e) => { setQuery(e.target.value); setShowResults(true); if (typeof (onQueryChange) === 'function') onQueryChange(e.target.value); }}
                            onFocus={() => setShowResults(true)}
                            className="flex-1 bg-transparent outline-none min-w-0 text-sm"
                            style={{ minWidth: 120 }}
                        />
                    </div>
                </div>
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
                                onClick={() => add(i.id)}
                                className="w-full flex items-center gap-3 p-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-colors text-left group"
                            >
                                <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 overflow-hidden shrink-0 border border-zinc-200 dark:border-zinc-700">
                                    {i.image ? (
                                        <div
                                            role="button"
                                            tabIndex={0}
                                            onClick={(e) => { e.stopPropagation(); if (onPreviewImage) onPreviewImage(i.image!); }}
                                            className="w-full h-full block cursor-pointer group"
                                        >
                                            <img src={i.image} alt={i.title} className="w-full h-full object-cover group-hover:brightness-110 transition-all" />
                                        </div>
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center"><ImageIcon size={18} className="text-zinc-400" /></div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold dark:text-zinc-100 group-hover:text-indigo-600 transition-colors truncate">{i.title}</p>
                                    {i.subtitle && <p className="text-[11px] text-zinc-500 font-mono truncate">{i.subtitle}</p>}
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
        </div>
    );
}
