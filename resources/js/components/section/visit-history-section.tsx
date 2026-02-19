import { motion } from 'framer-motion';
import {
    MapPin,
    ChevronRight,
    History,
    Image as ImageIcon,
    ChevronLeft,
} from 'lucide-react';

interface HistoryUser {
    id: number;
    name: string;
}

interface HistoryVisitPhoto {
    file_path: string;
}

interface HistoryVisit {
    id: number;
    user: HistoryUser;
    activity_type: string;
    description?: string;
    visited_at: string;
    address?: string;
    photos?: HistoryVisitPhoto[];
}

interface VisitHistorySectionProps {
    totalItems: number;
    startIndex: number;
    endIndex: number;
    selectedSalesId: number | null;
    salesUsers: HistoryUser[];
    currentItems: HistoryVisit[];
    selectedVisit: HistoryVisit | null;
    onSelectVisit: (visit: HistoryVisit) => void;
    formatTimeOnly: (timeStr?: string | null) => string;
    itemsPerPage: number;
    currentPage: number;
    totalPages: number;
    onPrevPage: () => void;
    onNextPage: () => void;
}

export default function VisitHistorySection({
    totalItems,
    startIndex,
    endIndex,
    selectedSalesId,
    salesUsers,
    currentItems,
    selectedVisit,
    onSelectVisit,
    formatTimeOnly,
    itemsPerPage,
    currentPage,
    totalPages,
    onPrevPage,
    onNextPage,
}: VisitHistorySectionProps) {
    const selectedSalesName = selectedSalesId
        ? salesUsers.find(user => user.id === selectedSalesId)?.name
        : null;

    if (totalItems === 0) {
        return (
            <div className="text-center py-10 text-zinc-500">
                Tidak ada data kegiatan untuk periode yang dipilih
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden mb-10"
        >
            <div className="px-6 py-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-linear-to-r from-blue-100 via-blue-50 to-blue-200 dark:from-blue-950 dark:via-blue-900 dark:to-blue-800">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-800 rounded-2xl text-blue-700 dark:text-blue-300 shadow-sm">
                        <History size={24} strokeWidth={2} />
                    </div>

                    <div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight leading-none mb-1">
                            Riwayat Kegiatan Santri
                        </h3>
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                            Menampilkan data <span className="text-slate-900 dark:text-slate-200 font-bold">{startIndex + 1}-{Math.min(endIndex, totalItems)}</span> dari total <span className="text-slate-900 dark:text-slate-200 font-bold">{totalItems}</span> {selectedSalesName ? `untuk ${selectedSalesName}` : 'untuk semua sales'}
                        </p>
                    </div>
                </div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {currentItems.map((visit, index) => {
                    const itemNumber = startIndex + index + 1;
                    const isSelected = selectedVisit?.id === visit.id;
                    const isEven = index % 2 === 0;
                    const zebraClass = isEven
                        ? 'bg-orange-50/40 dark:bg-orange-500/5'
                        : 'bg-blue-50/40 dark:bg-blue-500/5';

                    return (
                        <button
                            key={visit.id}
                            onClick={() => onSelectVisit(visit)}
                            className={`w-full text-left p-4 sm:p-5 border-l-4 transition-all duration-200 group flex items-start sm:items-center gap-3 sm:gap-5
                                ${isSelected
                                    ? 'border-orange-500 bg-orange-100 dark:bg-orange-900/40 shadow-sm'
                                    : `border-transparent ${zebraClass} hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20`
                                }`}
                        >
                            <div className="shrink-0 mt-1 sm:mt-0">
                                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center transition-all duration-300 border shadow-sm
                                    ${isSelected
                                        ? 'bg-orange-500 border-orange-500 text-white'
                                        : 'bg-white dark:bg-slate-800 border-blue-100 dark:border-slate-700 group-hover:bg-orange-500 group-hover:border-orange-500 group-hover:text-white'
                                    }`}>
                                    <span className={`font-mono text-xs sm:text-lg font-bold transition-colors
                                        ${isSelected ? 'text-white' : 'text-blue-500 dark:text-blue-400 group-hover:text-white'}`}>
                                        {String(itemNumber).padStart(2, '0')}
                                    </span>
                                </div>
                            </div>

                            <div className={`shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden relative border transition-colors shadow-sm
                                ${isSelected
                                    ? 'border-orange-400'
                                    : 'border-white dark:border-slate-700 group-hover:border-orange-300'}`}>
                                {visit.photos?.[0] ? (
                                    <img
                                        src={`/storage/${visit.photos[0].file_path}`}
                                        alt="Bukti"
                                        className={`w-full h-full object-cover transition-transform duration-500 ${isSelected ? 'scale-110' : 'group-hover:scale-110'}`}
                                    />
                                ) : (
                                    <div className={`absolute inset-0 flex items-center justify-center bg-white dark:bg-slate-800 transition-colors
                                        ${isSelected ? 'text-orange-500' : 'text-blue-200 group-hover:text-orange-300'}`}>
                                        <ImageIcon size={18} />
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 min-w-0 pt-0.5">
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-1">
                                    <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border transition-colors
                                        ${isSelected
                                            ? 'bg-orange-500 text-white border-orange-500'
                                            : 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 group-hover:bg-orange-500 group-hover:text-white group-hover:border-orange-500'
                                        }`}>
                                        {visit.activity_type}
                                    </span>
                                    <span className={`text-xs font-semibold ${isSelected ? 'text-orange-700 dark:text-orange-300' : 'text-orange-500 group-hover:text-orange-600'}`}>
                                        {formatTimeOnly(visit.visited_at)}
                                    </span>
                                </div>

                                <span className={`text-xs font-semibold ${isSelected ? 'text-orange-700 dark:text-orange-300' : 'text-blue-400 group-hover:text-orange-600'}`}>
                                    • {visit.user.name}
                                </span>

                                <p className={`font-bold text-sm truncate pr-2 transition-colors
                                    ${isSelected ? 'text-orange-950 dark:text-orange-50' : 'text-slate-800 dark:text-slate-100 group-hover:text-orange-900'}`}>
                                    {visit.description || 'Tidak ada deskripsi'}
                                </p>

                                <div className={`mt-1 flex items-center gap-1 text-xs transition-colors font-medium
                                    ${isSelected ? 'text-orange-700/80' : 'text-slate-500 group-hover:text-orange-600'}`}>
                                    <MapPin size={12} className={`shrink-0 ${isSelected ? 'text-orange-500' : 'text-blue-300 group-hover:text-orange-500'}`} />
                                    <span className="truncate">
                                        {visit.address || 'Lokasi tidak diketahui'}
                                    </span>
                                </div>
                            </div>

                            <div className="self-center pl-1 hidden sm:block">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all 
                                    ${isSelected ? 'bg-orange-500 text-white' : 'bg-transparent group-hover:bg-orange-500 group-hover:text-white'}`}>
                                    <ChevronRight size={18} className="transition-transform group-hover:scale-110" />
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>

            {totalItems > itemsPerPage && (
                <div className="bg-slate-50/50 dark:bg-slate-900 px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <button
                        onClick={onPrevPage}
                        disabled={currentPage === 1}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors shadow-sm"
                    >
                        <ChevronLeft size={16} />
                        <span className="hidden sm:inline">Sebelumnya</span>
                    </button>

                    <div className="flex items-center">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800/50">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                            Halaman {String(currentPage).padStart(2, '0')} / {String(totalPages || 1).padStart(2, '0')}
                        </span>
                    </div>

                    <button
                        onClick={onNextPage}
                        disabled={currentPage === totalPages}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors shadow-sm"
                    >
                        <span className="hidden sm:inline">Selanjutnya</span>
                        <ChevronRight size={16} />
                    </button>
                </div>
            )}
        </motion.div>
    );
}
