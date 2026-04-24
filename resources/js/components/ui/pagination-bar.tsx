import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
    currentPage: number;
    lastPage: number;
    total: number;
    perPage?: number;
    onPageChange: (page: number) => void;
    label?: string;
}

export default function PaginationBar({ currentPage, lastPage, total, perPage, onPageChange, label }: Props) {
    if (lastPage <= 1) return null;
    const from = total === 0 ? 0 : (currentPage - 1) * (perPage ?? 15) + 1;
    const to = Math.min(currentPage * (perPage ?? 15), total);

    // Build page numbers with ellipsis
    const pages: (number | '...')[] = [];
    if (lastPage <= 7) {
        for (let i = 1; i <= lastPage; i++) pages.push(i);
    } else {
        pages.push(1);
        if (currentPage > 3) pages.push('...');
        for (let i = Math.max(2, currentPage - 1); i <= Math.min(lastPage - 1, currentPage + 1); i++) {
            pages.push(i);
        }
        if (currentPage < lastPage - 2) pages.push('...');
        pages.push(lastPage);
    }

    return (
        <div className="flex flex-col items-center justify-between gap-3 border-t border-gray-200 px-4 py-3 dark:border-gray-800 sm:flex-row">
            <p className="text-xs text-gray-500 dark:text-gray-400">
                {label && <span className="mr-1">{label}</span>}
                {total === 0 ? 'Tidak ada data' : `Menampilkan ${from}–${to} dari ${total} data`}
            </p>
            <div className="flex items-center gap-1">
                <button
                    disabled={currentPage <= 1}
                    onClick={() => onPageChange(currentPage - 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
                >
                    <ChevronLeft className="h-4 w-4" />
                </button>

                {pages.map((p, i) =>
                    p === '...' ? (
                        <span key={`ellipsis-${i}`} className="flex h-8 w-8 items-center justify-center text-xs text-gray-400">
                            …
                        </span>
                    ) : (
                        <button
                            key={p}
                            onClick={() => onPageChange(p)}
                            className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium transition-colors ${
                                p === currentPage
                                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                                    : 'border border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800'
                            }`}
                        >
                            {p}
                        </button>
                    )
                )}

                <button
                    disabled={currentPage >= lastPage}
                    onClick={() => onPageChange(currentPage + 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
                >
                    <ChevronRight className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}
