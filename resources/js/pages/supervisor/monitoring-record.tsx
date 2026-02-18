import { router } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MapPin,
    ChevronRight,
    History,
    X,
    Image as ImageIcon,
    ArrowUpRight,
    ExternalLink,
    Calendar,
    ChevronLeft,
} from 'lucide-react';
import { useState, useEffect } from 'react';
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

interface Visit {
    id: number;
    user: User;
    activity_type: string;
    description?: string;
    visited_at?: string;
    address?: string;
    lat?: number;
    lng?: number;
    photos?: VisitPhoto[];
}

interface Props {
    attendances: Attendance[];
    recentVisits: Visit[];
    salesUsers: User[];
    selectedDate: string;
    startDate: string;
    endDate: string;
    filterType: 'single' | 'range';
    serverTime: string;
    supervisorName: string;
    supervisorAvatar: string | null;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Monitoring Teams',
        href: '/supervisor/monitoring',
    },
    {
        title: 'Riwayat Aktivitas Sales',
        href: '#',
    }
];

export default function Monitoring({ recentVisits, selectedDate, serverTime, salesUsers, startDate, endDate, filterType, supervisorName, supervisorAvatar }: Props) {
    const [currentTime, setCurrentTime] = useState(new Date(serverTime));
    const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);

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
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="w-full mx-auto mb-8 px-2 md:px-4"
                    >
                        {/* --- HEADER SECTION --- */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                            <div className="flex items-center gap-4 flex-1">
                                <div className="relative">
                                    {supervisorAvatar ? (
                                        <img
                                            src={supervisorAvatar}
                                            alt={supervisorName}
                                            className="h-12 w-12 md:h-14 md:w-14 rounded-2xl shadow-lg object-cover"
                                        />
                                    ) : (
                                        <div className="h-12 w-12 md:h-14 md:w-14 rounded-2xl bg-linear-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                                            {supervisorName.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full"></div>
                                </div>

                                <div>
                                    <div className="flex items-center gap-2">
                                        <h1 className="text-lg md:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                                            Tim {supervisorName}
                                        </h1>
                                        <span className="text-xl animate-bounce text-blue-500">
                                            <History size={24} />
                                        </span>
                                    </div>
                                    <p className="text-[10px] md:text-xs font-bold uppercase tracking-[0.15em] text-blue-600 dark:text-blue-400 opacity-80">
                                        {filterDateType === 'single' ? formatDateLong(parseWIB(singleDate)) : `${rangeStart} s/d ${rangeEnd}`}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 w-full sm:w-auto flex-wrap">
                                {/* Filter Type Toggle */}
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4, ease: "easeOut" }}
                                    className="flex gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg"
                                >
                                    <button
                                        onClick={() => setFilterDateType('single')}
                                        className={`px-3 py-1 text-xs font-bold rounded transition-all ${filterDateType === 'single' ? 'bg-blue-500 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:text-blue-500'}`}
                                    >
                                        Hari
                                    </button>
                                    <button
                                        onClick={() => setFilterDateType('range')}
                                        className={`px-3 py-1 text-xs font-bold rounded transition-all ${filterDateType === 'range' ? 'bg-blue-500 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:text-blue-500'}`}
                                    >
                                        Rentang
                                    </button>
                                </motion.div>

                                {/* Date Filters */}
                                {filterDateType === 'single' ? (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.4, ease: "easeOut" }}
                                        className="flex-1 sm:flex-none relative group"
                                    >
                                        <div className="relative overflow-hidden rounded-2xl p-2 shadow-inner ring-1 ring-orange-300 dark:ring-orange-700 focus-within:ring-2 focus-within:ring-orange-500 dark:focus-within:ring-orange-400 transition-all duration-300 ease-in-out bg-orange-50/20 dark:bg-orange-900/10">
                                            <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-500 dark:text-orange-400 transition-colors z-10" />
                                            <input
                                                type="date"
                                                value={singleDate}
                                                onChange={handleFilterChange}
                                                className="w-full pl-10 pr-4 py-2 bg-transparent text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none appearance-none cursor-pointer transition-colors duration-300 hover:bg-orange-100/20 dark:hover:bg-orange-800/20"
                                            />
                                            <div className="absolute inset-0 bg-linear-to-r from-transparent to-orange-100/20 dark:to-orange-800/20 pointer-events-none transition-colors duration-300"></div>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.4, ease: "easeOut" }}
                                        className="flex gap-2 flex-1 sm:flex-none flex-wrap"
                                    >
                                        <div className="relative group">
                                            <div className="relative overflow-hidden rounded-2xl p-2 shadow-inner ring-1 ring-blue-300 dark:ring-blue-700 focus-within:ring-2 focus-within:ring-blue-500 dark:focus-within:ring-blue-400 transition-all duration-300 ease-in-out bg-blue-50/20 dark:bg-blue-900/10">
                                                <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500 dark:text-blue-400 transition-colors z-10" />
                                                <input
                                                    type="date"
                                                    value={rangeStart}
                                                    onChange={(e) => setRangeStart(e.target.value)}
                                                    className="w-full pl-9 pr-4 py-2 bg-transparent text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none appearance-none cursor-pointer transition-colors duration-300"
                                                />
                                            </div>
                                        </div>
                                        <span className="text-slate-500 px-2 py-2 text-sm font-bold">-</span>
                                        <div className="relative group">
                                            <div className="relative overflow-hidden rounded-2xl p-2 shadow-inner ring-1 ring-purple-300 dark:ring-purple-700 focus-within:ring-2 focus-within:ring-purple-500 dark:focus-within:ring-purple-400 transition-all duration-300 ease-in-out bg-purple-50/20 dark:bg-purple-900/10">
                                                <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-500 dark:text-purple-400 transition-colors z-10" />
                                                <input
                                                    type="date"
                                                    value={rangeEnd}
                                                    onChange={(e) => setRangeEnd(e.target.value)}
                                                    className="w-full pl-9 pr-4 py-2 bg-transparent text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none appearance-none cursor-pointer transition-colors duration-300"
                                                />
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleDateRangeChange}
                                            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-bold shadow-sm transition-colors"
                                        >
                                            Terapkan
                                        </button>
                                    </motion.div>
                                )}

                                {/* Sales User Filter */}
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4, ease: "easeOut" }}
                                    className="flex-1 sm:flex-none"
                                >
                                    <div className="relative overflow-hidden rounded-2xl shadow-inner ring-1 ring-green-300 dark:ring-green-700 focus-within:ring-2 focus-within:ring-green-500 dark:focus-within:ring-green-400 transition-all duration-300 ease-in-out bg-green-50/20 dark:bg-green-900/10">
                                        <select
                                            value={selectedSalesId || ''}
                                            onChange={(e) => handleSalesFilterChange(e.target.value ? Number(e.target.value) : null)}
                                            className="w-full px-4 py-2.5 bg-transparent text-sm font-semibold text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none cursor-pointer transition-colors duration-300 appearance-none hover:bg-green-100/20 dark:hover:bg-green-800/20 pr-8"
                                        >
                                            <option value="">👥 Semua Sales ({salesUsers.length} orang)</option>
                                            {salesUsers.map(user => (
                                                <option key={user.id} value={user.id}>
                                                    👤 {user.name}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-green-600 dark:text-green-400 font-bold">
                                            ▼
                                        </div>
                                    </div>
                                </motion.div>

                                <div className="text-right bg-blue-50 dark:bg-blue-900/30 backdrop-blur-md px-4 py-2 rounded-2xl border border-blue-200 dark:border-blue-700 shadow-inner hidden sm:block">
                                    <p className="text-[10px] font-bold text-blue-500 dark:text-blue-300 uppercase tracking-widest mb-0.5">Waktu Server</p>
                                    <p className="text-sm md:text-base font-mono font-black text-blue-700 dark:text-blue-200 leading-none">
                                        {formatTimeWithSeconds(currentTime)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* --- RIWAYAT SECTION: PAGINATED & CLEAN --- */}
                    {totalItems > 0 ? (
                        <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden mb-10"
                        >
                            {/* HEADER */}
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
                                            Menampilkan data <span className="text-slate-900 dark:text-slate-200 font-bold">{startIndex + 1}-{Math.min(endIndex, totalItems)}</span> dari total <span className="text-slate-900 dark:text-slate-200 font-bold">{totalItems}</span> {selectedSalesId && salesUsers.find(u => u.id === selectedSalesId) ? `untuk ${salesUsers.find(u => u.id === selectedSalesId)?.name}` : 'untuk semua sales'}
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
                                            onClick={() => setSelectedVisit(visit)}
                                            className={`w-full text-left p-4 sm:p-5 border-l-4 transition-all duration-200 group flex items-start sm:items-center gap-3 sm:gap-5
                                        ${isSelected
                                                    ? 'border-orange-500 bg-orange-100 dark:bg-orange-900/40 shadow-sm'
                                                    : `border-transparent ${zebraClass} hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20`
                                                }`}
                                        >
                                            {/* NOMOR */}
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

                                            {/* THUMBNAIL */}
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

                                            {/* CONTENT */}
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

                                            {/* CHEVRON */}
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

                            {/* FOOTER: Pagination */}
                            {totalItems > itemsPerPage && (
                                <div className="bg-slate-50/50 dark:bg-slate-900 px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                    <button
                                        onClick={prevPage}
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
                                        onClick={nextPage}
                                        disabled={currentPage === totalPages}
                                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors shadow-sm"
                                    >
                                        <span className="hidden sm:inline">Selanjutnya</span>
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    ) : (
                        <div className="text-center py-10 text-zinc-500">
                            Tidak ada data kegiatan untuk periode yang dipilih
                        </div>
                    )}
                </div>

                <AnimatePresence>
                    {selectedVisit && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setSelectedVisit(null)}
                                className="absolute inset-0 bg-zinc-900/70 backdrop-blur-sm"
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-4xl shadow-2xl overflow-hidden"
                            >
                                <div className="relative h-56 bg-zinc-100 dark:bg-zinc-800 group">
                                    {selectedVisit.photos?.[0] ? (
                                        <>
                                            <img
                                                src={`/storage/${selectedVisit.photos[0].file_path}`}
                                                alt="Detail Kegiatan"
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                            />
                                            <div className="absolute inset-0 bg-linear-to-t from-blue-900/60 to-transparent pointer-events-none"></div>

                                            <a
                                                href={`/storage/${selectedVisit.photos[0].file_path}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="absolute bottom-4 right-4 bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-full text-[11px] font-bold uppercase flex items-center gap-1.5 shadow-lg transition-transform hover:scale-105"
                                            >
                                                Ukuran Penuh <ExternalLink size={12} />
                                            </a>
                                        </>
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-zinc-300"><ImageIcon size={48} /></div>
                                    )}
                                    <button
                                        onClick={() => setSelectedVisit(null)}
                                        className="absolute top-4 right-4 bg-black/20 hover:bg-black/40 text-white p-2 rounded-full backdrop-blur-md transition"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="p-6">
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 text-[10px] font-bold uppercase tracking-wider shadow-sm">
                                            {selectedVisit.activity_type}
                                        </span>
                                        <span className="text-zinc-400 text-xs font-medium">
                                            {formatTimeOnly(selectedVisit.visited_at)}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1 mb-4">
                                        <span className="px-3 py-1 rounded-full bg-orange-500 text-white dark:bg-orange-600 dark:text-white text-[10px] font-bold uppercase tracking-wider shadow-sm">
                                            {selectedVisit.user.name}
                                        </span>
                                    </div>

                                    <div className="mb-6">
                                        <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Catatan Kegiatan</h4>
                                        <p className="text-zinc-800 dark:text-zinc-200 leading-relaxed bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl text-sm border border-zinc-100 dark:border-zinc-800">
                                            {selectedVisit.description || 'Tidak ada catatan yang ditambahkan.'}
                                        </p>
                                    </div>

                                    <div>
                                        <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Lokasi Terdeteksi</h4>
                                        <div className="flex items-start gap-3">
                                            <MapPin className="text-orange-500 mt-0.5 shrink-0 drop-shadow-sm" size={18} />
                                            <div>
                                                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 leading-snug">
                                                    {selectedVisit.address || `GPS: ${selectedVisit.lat?.toFixed(6)}, ${selectedVisit.lng?.toFixed(6)}`}
                                                </p>
                                                {selectedVisit.lat && (
                                                    <a
                                                        href={`https://www.google.com/maps?q=${selectedVisit.lat},${selectedVisit.lng}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 font-bold text-xs mt-2 hover:underline decoration-blue-300"
                                                    >
                                                        Buka Google Maps <ArrowUpRight size={12} />
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </AppLayout>

    );

}