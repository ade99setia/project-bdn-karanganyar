import { router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    Calendar,
    ChevronDown,
    Clock,
    Users,
    Filter,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import ImagePreviewModal from '@/components/modal/image-preview-modal';
import VisitDetailModal from '@/components/modal/visit-detail-modal';
import VisitHistorySection from '@/components/section/visit-history-section';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface User {
    id: number;
    name: string;
    avatar?: string | null;
}

interface Attendance {
    id: number;
    user: User;
    check_in_at?: string | null;
    check_out_at?: string | null;
    check_in_address?: string | null;
    check_out_address?: string | null;
}

interface VisitPhoto {
    file_path: string;
}

interface Customer {
    id?: number;
    name: string;
    address?: string;
    distance?: number;
    phone?: string;
    email?: string;
    notes?: string;
}

interface ProductPivot {
    quantity: number;
    action_type: string;
}

interface VisitProduct {
    id: number;
    name: string;
    sku: string;
    file_path?: string;
    pivot: ProductPivot;
}

interface Visit {
    id: number;
    user: User;
    activity_type: string;
    description?: string;
    visited_at: string;
    address?: string;
    lat?: number;
    lng?: number;
    photos?: VisitPhoto[];
    products?: VisitProduct[];
    customer?: Customer;
    customer_name?: string;
    customer_phone?: string;
    customer_email?: string;
}

interface Product {
    id: number;
    name: string;
    file_path?: string;
    sku: string;
    category?: string;
    pivot: ProductPivot;
}

interface Props {
    attendances: Attendance[];
    recentVisits: Visit[];
    products: Product[];
    salesUsers: User[];
    selectedDate: string;
    startDate: string;
    endDate: string;
    filterType: 'single' | 'range';
    serverTime: string;
    salesName: string;
    salesAvatar: string | null;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Riwayat Aktivitas Sales',
        href: '#',
    }
];

export default function Monitoring({ recentVisits, products, selectedDate, serverTime, salesUsers, startDate, endDate, filterType, salesName, salesAvatar }: Props) {
    const [currentTime, setCurrentTime] = useState(new Date(serverTime));
    const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string>('');

    // Date filter states
    const [filterDateType, setFilterDateType] = useState<'single' | 'range'>(filterType || 'single');
    const [singleDate, setSingleDate] = useState(selectedDate);
    const [rangeStart, setRangeStart] = useState(startDate || selectedDate);
    const [rangeEnd, setRangeEnd] = useState(endDate || selectedDate);

    // Sales user filter
    const [selectedSalesId, setSelectedSalesId] = useState<number | null>(null);

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Filter visits based on selected sales user
    const filteredByUser = selectedSalesId
        ? recentVisits.filter(visit => visit.user.id === selectedSalesId)
        : recentVisits;

    const totalItems = filteredByUser.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = filteredByUser.slice(startIndex, endIndex);

    const nextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));
    const prevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));

    // Reset page when filter changes
    const handleSalesFilterChange = (newSalesId: number | null) => {
        setSelectedSalesId(newSalesId);
        setCurrentPage(1);
    };

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(prev => new Date(prev.getTime() + 1000));
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const formatDateLong = (d: Date) =>
        new Intl.DateTimeFormat('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        }).format(d);

    const formatTimeWithSeconds = (d: Date) =>
        d.toLocaleTimeString('id-ID', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });

    const parseWIB = (timeStr: string) =>
        new Date(timeStr.replace(' ', 'T'));

    const formatTimeOnly = (timeStr?: string | null) => {
        if (!timeStr) return '—';
        return parseWIB(timeStr).toLocaleTimeString('id-ID', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    };

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newDate = e.target.value;
        setSingleDate(newDate);
        const baseurl = window.location.pathname;
        router.visit(`${baseurl}?date=${newDate}`, { preserveScroll: true });
    };

    const handleDateRangeChange = () => {
        const baseurl = window.location.pathname;
        router.visit(`${baseurl}?filterType=range&startDate=${rangeStart}&endDate=${rangeEnd}`, { preserveScroll: true });
    };





    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="min-h-screen bg-blue-50/20 dark:bg-blue-950/10 pb-16 pt-8 px-5 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-7xl space-y-10">
                    
                    <motion.div
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45, ease: "easeOut" }}
                        className="w-full mx-auto mb-6 sm:mb-8 px-1 sm:px-0"
                    >
                        <div className="relative bg-white dark:bg-slate-900 border-l-4 border-blue-600 dark:border-blue-500 rounded-xl shadow-lg shadow-slate-200/40 dark:shadow-black/25 p-5 sm:p-6">

                            {/* decorative gradient corner */}
                            <div className="absolute top-0 right-0 w-28 sm:w-32 h-28 sm:h-32 bg-linear-to-bl from-blue-50/70 to-transparent dark:from-blue-950/30 rounded-bl-full pointer-events-none" />

                            <div className="relative flex flex-col gap-5 sm:gap-6">

                                {/* ── Row 1: Profile + Date Badge ── */}
                                <div className="flex flex-wrap items-center justify-between gap-4 sm:gap-6">
                                    <div className="flex items-center gap-4">
                                        {/* Avatar */}
                                        <div className="relative shrink-0 flex items-center">
                                            {salesAvatar ? (
                                                <img
                                                    src={salesAvatar}
                                                    alt={salesName}
                                                    className="h-14 w-14 sm:h-16 sm:w-16 rounded-lg object-cover border-2 border-white dark:border-slate-800 shadow-sm"
                                                />
                                            ) : (
                                                <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-lg bg-linear-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center border-2 border-white dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-lg sm:text-xl shadow-sm">
                                                    {salesName?.charAt(0)?.toUpperCase() || "?"}
                                                </div>
                                            )}
                                            <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-70" />
                                                <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
                                            </span>
                                        </div>

                                        <div className="space-y-1">
                                            <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-50">
                                                Performa {salesName || "—"}
                                            </h1>

                                            <div className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300">
                                                <span className="inline-flex items-center gap-1.5 bg-blue-50/60 dark:bg-blue-900/30 px-2.5 py-0.5 rounded-lg border border-blue-200/50 dark:border-blue-700/40 text-blue-700 dark:text-blue-300">
                                                    {filterDateType === "single"
                                                        ? singleDate
                                                            ? formatDateLong(parseWIB(singleDate))
                                                            : "Pilih tanggal"
                                                        : rangeStart && rangeEnd
                                                            ? `${formatDateLong(parseWIB(rangeStart))} — ${formatDateLong(parseWIB(rangeEnd))}`
                                                            : "Pilih Periode tanggal"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Server time – hanya tampil di layar ≥ xl */}
                                    <div className="hidden xl:flex flex-col items-end text-right">
                                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                                            Server Time
                                        </span>
                                        <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-mono font-semibold text-sm">
                                            <Clock size={14} className="text-orange-500" />
                                            {formatTimeWithSeconds(currentTime)}
                                        </div>
                                    </div>
                                </div>

                                {/* ── Row 2: Filters ── */}
                                <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 sm:gap-4">

                                    {/* Toggle Harian / Periode */}
                                    <div className="flex-1 min-w-45 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                                        <div className="grid grid-cols-2 gap-1">
                                            <button
                                                onClick={() => setFilterDateType("single")}
                                                className={`px-4 py-1.5 text-xs sm:text-sm font-semibold rounded-md transition-all ${filterDateType === "single"
                                                    ? "bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400"
                                                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700/60"
                                                    }`}
                                            >
                                                Harian
                                            </button>
                                            <button
                                                onClick={() => setFilterDateType("range")}
                                                className={`px-4 py-1.5 text-xs sm:text-sm font-semibold rounded-md transition-all ${filterDateType === "range"
                                                    ? "bg-orange-500 dark:bg-orange-600 shadow-sm text-white dark:text-white"
                                                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700/60"
                                                    }`}
                                            >
                                                Periode
                                            </button>
                                        </div>
                                    </div>

                                    {/* Date picker(s) */}
                                    <div className="flex-1 min-w-55 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm p-1">
                                        {filterDateType === "single" ? (
                                            <div className="relative">
                                                <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                                <input
                                                    type="date"
                                                    value={singleDate ?? ""}
                                                    onChange={handleFilterChange}
                                                    className="w-full pl-10 pr-4 py-2 text-sm font-medium bg-transparent focus:outline-none cursor-pointer text-slate-700 dark:text-slate-200"
                                                />
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                                                <input
                                                    type="date"
                                                    value={rangeStart ?? ""}
                                                    onChange={(e) => setRangeStart(e.target.value)}
                                                    className="flex-1 min-w-27.5 px-3 py-2 text-sm font-medium bg-transparent focus:outline-none cursor-pointer text-center text-slate-700 dark:text-slate-200 border-r border-slate-200 dark:border-slate-700 sm:border-none"
                                                />
                                                <span className="text-slate-400 dark:text-slate-500 text-sm hidden sm:inline">s/d</span>
                                                <input
                                                    type="date"
                                                    value={rangeEnd ?? ""}
                                                    onChange={(e) => setRangeEnd(e.target.value)}
                                                    className="flex-1 min-w-27.5 px-3 py-2 text-sm font-medium bg-transparent focus:outline-none cursor-pointer text-center text-slate-700 dark:text-slate-200"
                                                />
                                                <button
                                                    onClick={handleDateRangeChange}
                                                    className="bg-orange-500 hover:bg-orange-600 text-white p-2.5 rounded-md transition-colors shrink-0"
                                                    title="Terapkan Periode tanggal"
                                                >
                                                    <Filter size={16} strokeWidth={2.5} />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Sales Dropdown */}
                                    <div className="relative flex-1 min-w-60 group">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Users size={16} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
                                        </div>
                                        <select
                                            value={selectedSalesId ?? ""}
                                            onChange={(e) => handleSalesFilterChange(e.target.value ? Number(e.target.value) : null)}
                                            className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-500 hover:border-blue-400 transition-all appearance-none cursor-pointer"
                                        >
                                            <option value="">Semua Sales ({salesUsers.length})</option>
                                            {salesUsers.map((user, i) => (
                                                <option key={user.id} value={user.id}>
                                                    {i + 1}. {user.name}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                            <ChevronDown size={16} className="text-slate-400" />
                                        </div>
                                    </div>
                                </div>

                                {/* Server time mobile version (jika diperlukan) */}
                                <div className="xl:hidden text-right text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    Server time: <span className="font-mono text-blue-600 dark:text-blue-400">{formatTimeWithSeconds(currentTime)}</span>
                                </div>

                            </div>
                        </div>
                    </motion.div>

                    <VisitHistorySection
                        totalItems={totalItems}
                        startIndex={startIndex}
                        endIndex={endIndex}
                        selectedSalesId={selectedSalesId}
                        salesUsers={salesUsers}
                        currentItems={currentItems}
                        selectedVisit={selectedVisit}
                        onSelectVisit={setSelectedVisit}
                        formatTimeOnly={formatTimeOnly}
                        itemsPerPage={itemsPerPage}
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPrevPage={prevPage}
                        onNextPage={nextPage}
                    />
                </div>

                {selectedVisit && (
                    <VisitDetailModal
                        visit={selectedVisit}
                        products={products}
                        onClose={() => setSelectedVisit(null)}
                        formatTime={formatTimeOnly}
                        onPreviewImage={(url: string) => {
                            setPreviewUrl(url);
                            setIsPreviewOpen(true);
                        }}
                    />
                )}

                {isPreviewOpen && selectedVisit?.photos && selectedVisit.photos.length > 0 && (
                    <ImagePreviewModal
                        isOpen={isPreviewOpen}
                        onClose={() => {
                            setIsPreviewOpen(false);
                            setPreviewUrl('');
                        }}
                        imageUrl={previewUrl}
                    />
                )}
            </div>
        </AppLayout>

    );

}