import { Check, ChevronDown, Search, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

export interface MultiSelectFilterOption {
    label: string;
    value: string;
}

interface Props {
    options: MultiSelectFilterOption[];
    value: string[];
    onChange: (values: string[]) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    emptyLabel?: string;
    className?: string;
    buttonClassName?: string;
}

export default function MultiSelectFilter({
    options,
    value,
    onChange,
    placeholder = 'Pilih data...',
    searchPlaceholder = 'Cari data...',
    emptyLabel = 'Data tidak ditemukan',
    className,
    buttonClassName,
}: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const rootRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const onDocumentClick = (event: MouseEvent) => {
            if (!rootRef.current) return;
            if (!rootRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('click', onDocumentClick);
        return () => document.removeEventListener('click', onDocumentClick);
    }, []);

    const selectedSet = useMemo(() => new Set(value), [value]);

    const selectedLabels = useMemo(
        () => options.filter((option) => selectedSet.has(option.value)).map((option) => option.label),
        [options, selectedSet]
    );

    const filteredOptions = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();
        if (!normalizedQuery) return options;

        return options.filter((option) => option.label.toLowerCase().includes(normalizedQuery));
    }, [options, query]);

    const toggleValue = (nextValue: string) => {
        if (selectedSet.has(nextValue)) {
            onChange(value.filter((item) => item !== nextValue));
            return;
        }

        onChange([...value, nextValue]);
    };

    const clearAll = () => {
        onChange([]);
    };

    return (
        <div ref={rootRef} className={`relative ${className ?? ''}`}>
            <button
                type="button"
                onClick={() => setIsOpen((prev) => !prev)}
                className={buttonClassName ?? "flex w-full items-center justify-between gap-3 rounded-xl border border-gray-300 bg-white py-4.5 pl-4 pr-4 text-left focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800"}
            >
                <span className="truncate text-sm text-gray-700 dark:text-gray-200">
                    {selectedLabels.length > 0 ? selectedLabels.join(', ') : placeholder}
                </span>
                <ChevronDown className={`h-4 w-4 shrink-0 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute z-50 mt-2 w-full rounded-xl border border-gray-200 bg-white p-3 shadow-xl dark:border-gray-700 dark:bg-gray-900">
                    <div className="relative mb-3">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder={searchPlaceholder}
                            className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800"
                        />
                    </div>

                    <div className="max-h-56 space-y-1 overflow-y-auto pr-1">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((option) => {
                                const isSelected = selectedSet.has(option.value);

                                return (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => toggleValue(option.value)}
                                        className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-gray-700 transition hover:bg-indigo-50 dark:text-gray-200 dark:hover:bg-indigo-900/30"
                                    >
                                        <span className="truncate">{option.label}</span>
                                        {isSelected ? <Check className="h-4 w-4 text-indigo-600" /> : null}
                                    </button>
                                );
                            })
                        ) : (
                            <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">{emptyLabel}</div>
                        )}
                    </div>

                    {value.length > 0 && (
                        <button
                            type="button"
                            onClick={clearAll}
                            className="mt-3 inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                        >
                            <X className="h-3.5 w-3.5" />
                            Reset pilihan
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}