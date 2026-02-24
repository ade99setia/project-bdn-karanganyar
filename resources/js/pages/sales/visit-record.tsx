import { AppLauncher } from '@capacitor/app-launcher';
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { Head, router } from '@inertiajs/react';
import { MockLocationChecker } from 'capacitor-mock-location-checker';
import { motion } from 'framer-motion';
import {
    MapPin,
    ChevronRight,
    History,
    LogOut,
    Image as ImageIcon,
    Loader2,
    LogIn,
    ChevronLeft,
    CheckCircle2,
    Package,
    RefreshCw
} from 'lucide-react';
import { useState, useEffect } from 'react';
import AlertModal from '@/components/modal/alert-modal';
import FaceVerificationModal from '@/components/modal/face-verification-modal';
import ImagePreviewModal from '@/components/modal/image-preview-modal';
import VisitDetailModal from '@/components/modal/visit-detail-modal';
import VisitInputModalContainer from '@/components/modal/visit-input-modal-container';
import AppLayoutMobile from '@/layouts/app-layout-mobile';
import type { BreadcrumbItem } from '@/types';

// --- INTERFACES ---
interface AttendanceToday {
    check_in_at?: string | null;
    check_out_at?: string | null;
    location?: string | null;
    check_in_address?: string | null;
    check_out_address?: string | null;
}

interface VisitPhoto {
    file_path: string;
}

interface Customer {
    id: number;
    name: string;
    address: string;
    distance?: number; // Jarak dalam KM
    phone?: string;
    email?: string;
    notes?: string;
}

interface ProductPivot {
    quantity: number;
    action_type: string;
}

interface VisitProductHistory {
    id: number;
    name: string;
    sku: string;
    pivot: ProductPivot;
}

interface Visit {
    id: number;
    activity_type: string;
    description?: string;
    visited_at: string;
    address?: string;
    lat?: number;
    lng?: number;
    photos?: VisitPhoto[];
    products?: VisitProductHistory[];
    // Newly added customer field
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
    attendanceToday: AttendanceToday | null;
    recentVisits: Visit[];
    products: Product[];
    user: {
        name: string;
        avatar?: string | null;
    };
    serverTime: string;
    userFaceDescriptor: {
        descriptor: string;
        photo_path: string;
    } | null;
}

export default function SalesRecord({ attendanceToday, recentVisits, user, serverTime, products, userFaceDescriptor = null }: Props) {
    const [processing, setProcessing] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date(serverTime));
    const [openVisit, setOpenVisit] = useState(false);
    const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);

    // --- State Preview Modal ---
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string>("");

    // State untuk Alert Modal
    const [alertConfig, setAlertConfig] = useState({
        isOpen: false,
        title: "",
        message: "",
        type: "info" as "success" | "error" | "warning" | "info",
        onConfirm: () => { },
        isFatal: false
    });

    const showAlert = (title: string, message: string, type: "success" | "error" | "warning" | "info", onConfirm?: () => void, isFatal = false) => {
        setAlertConfig({
            isOpen: true,
            title,
            message,
            type,
            onConfirm: onConfirm || (() => setAlertConfig(prev => ({ ...prev, isOpen: false }))),
            isFatal
        });
    };

    // --- Pagination Logic ---
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;
    const totalItems = recentVisits.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = recentVisits.slice(startIndex, endIndex);

    const nextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));
    const prevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(prev => new Date(prev.getTime() + 1000));
        }, 1000);
        return () => clearInterval(timer);
    }, []);


    const checkForbiddenApps = async () => {
        if (!Capacitor.isNativePlatform()) return true;

        // Daftar Package Name Aplikasi Fake GPS Populer (Blacklist)
        const forbiddenApps = [
            'com.lexa.fakegps',
            'com.incorporateapps.fakegps.fre',
            'com.theappninjas.fakegpsjoystick',
            'com.blogspot.newapphorizons.fakegps',
            'ru.gavrikov.mocklocations'
        ];

        for (const appPackage of forbiddenApps) {
            try {
                const check = await AppLauncher.canOpenUrl({ url: appPackage });

                if (check.value) {
                    showAlert(
                        "Aplikasi Terlarang Terdeteksi",
                        `TERDETEKSI: Anda menggunakan aplikasi terlarang (${appPackage}). Harap hapus aplikasi Fake GPS untuk melanjutkan.`,
                        "error",
                        () => {
                            window.location.replace(window.location.origin);
                        },
                        true
                    );
                    return false;
                }
            } catch {
                // Ignore error kalau app tidak ditemukan
            }
        }

        return true; // Aman
    };

    // Helper Fake GPS
    const getVerifiedLocation = async () => {
        try {
            const isAppSafe = await checkForbiddenApps();
            if (!isAppSafe) return null;

            if (Capacitor.isNativePlatform()) {
                const checkResult = await MockLocationChecker.checkMock({ whiteList: [] });

                if (checkResult.isMock) {
                    showAlert(
                        "Keamanan Terancam",
                        "Terdeteksi penggunaan Lokasi Palsu (Fake GPS). Matikan aplikasi tambahan untuk melanjutkan.",
                        "warning"
                    );
                    return null;
                }
            }

            const position = await Geolocation.getCurrentPosition({
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            });

            if (!position) {
                showAlert(
                    "Gagal Mengambil Lokasi",
                    "Data lokasi tidak valid. Pastikan GPS aktif dan coba lagi.",
                    "error"
                );
                return null;
            }

            return position;

        } catch (error: unknown) {
            if (error instanceof Error && error.message && error.message.includes('location disabled')) {
                showAlert(
                    "GPS Tidak Aktif",
                    "Mohon nyalakan GPS Anda untuk melanjutkan.",
                    "warning"
                );
            } else {
                showAlert(
                    "Gagal Mengambil Lokasi",
                    "Pastikan izin lokasi diberikan dan GPS aktif.",
                    "error"
                );
            }
            return null;
        }
    };

    // --- Format Helpers ---
    const formatDateLong = (d: Date) =>
        new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(d);

    const formatTimeWithSeconds = (d: Date) =>
        d.toLocaleTimeString('id-ID', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const parseWIB = (timeStr: string) => new Date(timeStr.replace(' ', 'T'));

    const formatTimeOnly = (timeStr?: string | null) => {
        if (!timeStr) return '—';
        return parseWIB(timeStr).toLocaleTimeString('id-ID', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };

    const getXsrfToken = () => decodeURIComponent(document.cookie.split('; ').find(row => row.startsWith('XSRF-TOKEN='))?.split('=')[1] || '');

    const calculateDuration = (checkInStr: string | null | undefined, checkOutStr: string | null | undefined, now: Date) => {
        if (!checkInStr) return "--:--:--";
        const start = parseWIB(checkInStr).getTime();
        const end = checkOutStr ? parseWIB(checkOutStr).getTime() : now.getTime();
        const diff = Math.max(0, end - start);
        const hours = Math.floor(diff / 3_600_000);
        const minutes = Math.floor((diff % 3_600_000) / 60_000);
        const seconds = Math.floor((diff % 60_000) / 1_000);
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    const [isFaceModalOpen, setIsFaceModalOpen] = useState(false);
    const [faceCheckType, setFaceCheckType] = useState<'in' | 'out'>('in');

    const initCheckInOut = (type: 'in' | 'out') => {
        if (!userFaceDescriptor?.descriptor) {
            showAlert(
                "Data Wajah Belum Diatur",
                "Hubungi admin atau update profil untuk melanjutkan.",
                "error"
            );
            return;
        }

        setFaceCheckType(type);
        setIsFaceModalOpen(true);
    };

    const executeCheckInOut = async (type: 'in' | 'out') => {
        setProcessing(true);
        const pos = await getVerifiedLocation();

        if (!pos) {
            setProcessing(false);
            return;
        }
        const { latitude, longitude } = pos.coords;
        const platform = Capacitor.getPlatform();
        try {
            const geo = await fetch('/sales/utils/reverse-geocode', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-XSRF-TOKEN': getXsrfToken() },
                body: JSON.stringify({ lat: latitude, lng: longitude }),
            });
            const { address } = await geo.json();
            router.post(`/sales/attendance/check-${type}`, {
                lat: latitude,
                lng: longitude,
                device_id: platform,
                [`check_${type}_address`]: address ?? 'Lokasi tidak ditemukan',
            }, {
                preserveScroll: true,
                onFinish: () => setProcessing(false)
            });
        } catch {
            setProcessing(false);
            showAlert(
                'Gagal Mengambil Lokasi',
                'Terjadi kesalahan saat mengambil data alamat. Pastikan koneksi internet stabil dan coba lagi.',
                'error'
            );
        }
    };


    const isCheckedIn = !!attendanceToday;
    const isCheckedOut = isCheckedIn && !!attendanceToday.check_out_at;

    // Auto-open modal jika URL hash adalah #add-visit
    useEffect(() => {
        const handleHashChange = () => {
            if (window.location.hash === '#add-visit') {
                if (!isCheckedIn) {
                    showAlert(
                        "Presensi Diperlukan",
                        "Silakan lakukan check-in terlebih dahulu sebelum menambah kunjungan.",
                        "warning"
                    );
                } else if (isCheckedOut) {
                    showAlert(
                        "Presensi Sudah Selesai",
                        "Anda tidak dapat menambahkan laporan kunjungan setelah check-out.",
                        "error"
                    );
                } else {
                    setOpenVisit(true);
                }
                window.history.replaceState(null, '', window.location.pathname);
            }
        };

        handleHashChange();
        window.addEventListener('hashchange', handleHashChange);

        return () => {
            window.removeEventListener('hashchange', handleHashChange);
        };
    }, [isCheckedIn, isCheckedOut]);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Home', href: `/${user.name.toLowerCase()}/dashboard` },
        { title: 'Visit Record', href: `/${user.name.toLowerCase()}/visit-record` }
    ];

    return (
        <AppLayoutMobile breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="min-h-screen bg-blue-50/20 dark:bg-blue-950/10 pb-16 pt-8">
                <div className="mx-auto max-w-7xl space-y-10">
                    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="w-full mx-auto mb-8 px-2 md:px-4">

                        {/* HEADER & POWER CARD (SAMA SEPERTI SEBELUMNYA) */}
                        <div className="flex items-center justify-between mb-6 group">
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    {user?.avatar && typeof user.avatar === 'string' ? (
                                        <img
                                            src={`/storage/profiles/${user.avatar}`}
                                            alt={user.name}
                                            className="h-12 w-12 md:h-14 md:w-14 rounded-2xl object-cover shadow-lg"
                                        />
                                    ) : (
                                        <div className="h-12 w-12 md:h-14 md:w-14 rounded-2xl bg-linear-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold text-xl shadow-lg rotate-3">
                                            {user.name.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full"></div>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 dark:text-white">Halo, {user.name.split(' ')[0]}</h1>
                                        <span className="text-xl animate-bounce">👋</span>
                                    </div>
                                    <p className="text-[11px] md:text-xs font-bold uppercase tracking-[0.15em] text-blue-600 dark:text-blue-400 opacity-80">{formatDateLong(currentTime)}</p>
                                </div>
                            </div>
                            <div className="text-right px-3 py-1.5 rounded-xl border border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/30">
                                <p className="text-[8px] font-bold text-blue-500 dark:text-blue-300 uppercase tracking-wider">Server</p>
                                <p className="text-xs font-mono font-black text-blue-700 dark:text-blue-200">{formatTimeWithSeconds(currentTime)}</p>
                            </div>
                        </div>

                        {/* STATS CARD */}
                        <motion.div whileHover={{ scale: 1.005 }} className="relative w-full overflow-hidden rounded-4xl bg-linear-to-br from-slate-900 via-blue-900 to-blue-800 p-6 md:p-8 text-white shadow-2xl shadow-blue-500/30">
                            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-blue-400/10 blur-3xl" />
                            <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-indigo-500/10 blur-3xl" />
                            <div className="relative z-10">
                                <div className="flex flex-col items-center py-2 md:py-4 text-center">
                                    <div className="bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm mb-3">
                                        <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-[0.2em] text-blue-200">Durasi Kerja Hari Ini</span>
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-5xl md:text-7xl font-black tabular-nums tracking-tighter drop-shadow-md">
                                            {calculateDuration(attendanceToday?.check_in_at, attendanceToday?.check_out_at, currentTime).split(' ')[0] || "00:00"}
                                        </span>
                                        <span className="text-xs md:text-sm font-bold text-blue-300 uppercase">{attendanceToday?.check_in_at && !attendanceToday?.check_out_at ? 'Running' : 'Closed'}</span>
                                    </div>
                                </div>
                                <div className="mt-8 grid grid-cols-2 gap-4">
                                    <div className="flex flex-col items-center bg-white/5 rounded-2xl py-4 border border-white/10">
                                        <div className="mb-1 p-1.5 rounded-lg bg-blue-500/20 text-blue-300"><LogIn size={16} /></div>
                                        <span className="text-[9px] font-bold uppercase text-blue-200/50 tracking-wider">Check In</span>
                                        <p className="text-xl font-black">{attendanceToday?.check_in_at ? formatTimeOnly(attendanceToday.check_in_at) : '--:--'}</p>
                                    </div>
                                    <div className="flex flex-col items-center bg-white/5 rounded-2xl py-4 border border-white/10">
                                        <div className="mb-1 p-1.5 rounded-lg bg-orange-500/20 text-orange-400"><LogOut size={16} /></div>
                                        <span className="text-[9px] font-bold uppercase text-orange-200/50 tracking-wider">Check Out</span>
                                        <p className="text-xl font-black">{attendanceToday?.check_out_at ? formatTimeOnly(attendanceToday.check_out_at) : '--:--'}</p>
                                    </div>
                                </div>
                                <div className="mt-6 flex items-center justify-center gap-2 pt-4 border-t border-white/10">
                                    <MapPin size={14} className="text-blue-400 shrink-0" />
                                    <p className="truncate text-[11px] font-medium text-blue-100/80 italic">{attendanceToday?.check_out_address || recentVisits?.[0]?.address || attendanceToday?.check_in_address || 'Belum melakukan presensi...'}</p>
                                </div>
                            </div>
                        </motion.div>

                        {/* BUTTONS */}
                        <div className="mt-6 grid grid-cols-1 gap-4">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => window.location.reload()}
                                className={`
                                    w-full flex items-center justify-center gap-3 
                                    rounded-2xl bg-linear-to-r from-blue-50 via-blue-100 to-blue-200 
                                    dark:from-slate-800 dark:via-blue-950 dark:to-blue-900 
                                    py-4.5 text-base font-bold tracking-wide 
                                    text-blue-800 dark:text-blue-200 
                                    transition-all duration-300 h-16
                                    border border-blue-200/70 dark:border-blue-800/50
                                    hover:shadow-xl hover:shadow-blue-200/40 dark:hover:shadow-blue-950/30
                                    hover:border-blue-300 dark:hover:border-blue-700
                                    group overflow-hidden
                                `}
                            >
                                <div className="relative">
                                    <RefreshCw
                                        size={22}
                                        strokeWidth={2.5}
                                        className={`
                                            text-blue-600 dark:text-blue-400
                                            transition-transform duration-500 
                                            group-hover:rotate-180 
                                            group-hover:scale-110
                                        `}
                                    />
                                </div>
                                <span>MUAT ULANG</span>
                            </motion.button>

                            <div className="grid gap-4">
                                {!isCheckedIn ? (
                                    <button
                                        onClick={() => initCheckInOut('in')}
                                        disabled={processing}
                                        className="flex w-full items-center justify-center gap-3 rounded-2xl bg-blue-600 py-4.5 text-lg font-black text-white shadow-xl h-16 hover:bg-blue-700 transition-colors"
                                    >
                                        {processing ? <Loader2 className="animate-spin" /> : <LogIn size={24} />}
                                        <span>MULAI PRESENSI</span>
                                    </button>
                                ) : !isCheckedOut ? (
                                    <button
                                        onClick={() => initCheckInOut('out')}
                                        disabled={processing}
                                        className="flex w-full items-center justify-center gap-3 rounded-2xl bg-linear-to-r from-orange-500 to-red-600 py-4.5 text-lg font-black text-white h-16 hover:opacity-90 transition-opacity"
                                    >
                                        {processing ? <Loader2 className="animate-spin" /> : <LogOut size={24} />}
                                        <span>SELESAIKAN KERJA</span>
                                    </button>
                                ) : (
                                    <div className="flex w-full items-center justify-center gap-3 rounded-2xl bg-emerald-500/10 py-4.5 text-emerald-600 font-black border-2 border-emerald-500/20 h-16">
                                        <CheckCircle2 size={24} />
                                        TUGAS SELESAI
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>

                    {/* RIWAYAT LIST */}
                    {totalItems > 0 && (
                        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden mb-10">
                            <div className="px-6 py-8 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 bg-linear-to-br from-slate-50 via-blue-50/40 to-slate-50 dark:from-slate-900/50 dark:via-blue-950/20 dark:to-slate-900/50 backdrop-blur-sm">
                                <div className="flex items-start sm:items-center gap-5 flex-1">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-linear-to-br from-blue-500 to-indigo-600 rounded-2xl blur-lg opacity-20" />
                                        <div className="relative p-3.5 bg-linear-to-br from-blue-600 to-indigo-600 border border-blue-400/40 rounded-2xl text-white shadow-lg shadow-blue-600/20">
                                            <History size={26} strokeWidth={1.8} />
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-2">Riwayat Aktivitas</h3>
                                        <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 flex flex-wrap items-center gap-2">
                                            <span className="inline-flex items-center gap-1">
                                                Menampilkan
                                                <span className="inline-block px-2.5 py-1 rounded-lg bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-black text-xs">
                                                    {startIndex + 1}-{Math.min(endIndex, totalItems)}
                                                </span>
                                            </span>
                                            <span className="text-slate-400">dari</span>
                                            <span className="inline-block px-2.5 py-1 rounded-lg bg-orange-100 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300 font-black text-xs">
                                                {totalItems} total
                                            </span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                {currentItems.map((visit, index) => {
                                    const itemNumber = startIndex + index + 1;
                                    const isSelected = selectedVisit?.id === visit.id;
                                    const isEven = index % 2 === 0;
                                    const zebraClass = isEven ? 'bg-orange-50/40 dark:bg-orange-500/5' : 'bg-blue-50/40 dark:bg-blue-500/5';
                                    return (
                                        <button key={visit.id} onClick={() => setSelectedVisit(visit)} className={`w-full text-left p-4 sm:p-5 border-l-4 transition-all duration-200 group flex items-start sm:items-center gap-3 sm:gap-5 ${isSelected ? 'border-orange-500 bg-orange-100 dark:bg-orange-900/40' : `border-transparent ${zebraClass} hover:border-orange-500 hover:bg-orange-50`}`}>
                                            <div className="shrink-0 mt-1 sm:mt-0">
                                                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center transition-all duration-300 border shadow-sm ${isSelected ? 'bg-orange-500 border-orange-500 text-white' : 'bg-white dark:bg-slate-800 border-blue-100 dark:border-slate-700 group-hover:bg-orange-500 group-hover:text-white'}`}>
                                                    <span className={`font-mono text-xs sm:text-lg font-bold ${isSelected ? 'text-white' : 'text-blue-500 dark:text-blue-400 group-hover:text-white'}`}>{String(itemNumber).padStart(2, '0')}</span>
                                                </div>
                                            </div>
                                            <div className={`shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden relative border transition-colors shadow-sm ${isSelected ? 'border-orange-400' : 'border-white dark:border-slate-700 group-hover:border-orange-300'}`}>
                                                {visit.photos && visit.photos.length > 0 ? (
                                                    <div
                                                        role="button"
                                                        tabIndex={0}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setIsPreviewOpen(true);
                                                            setPreviewUrl(`/storage/${visit.photos?.[0]?.file_path || ''}`);
                                                        }}
                                                        className="w-full h-full block cursor-pointer group/image"
                                                    >
                                                        <img
                                                            src={`/storage/${visit.photos[0].file_path}`}
                                                            alt="Bukti"
                                                            className={`w-full h-full object-cover transition-transform duration-500 ${isSelected ? 'scale-110' : 'group-hover/image:scale-110'}`}
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className={`absolute inset-0 flex items-center justify-center bg-white dark:bg-slate-800 transition-colors ${isSelected ? 'text-orange-500' : 'text-blue-200 group-hover:text-orange-300'}`}>
                                                        <ImageIcon size={18} />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0 pt-0.5">
                                                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-1">
                                                    <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${isSelected ? 'bg-orange-500 text-white border-orange-500' : 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 group-hover:bg-orange-500 group-hover:text-white'}`}>{visit.activity_type}</span>
                                                    <span className={`text-xs font-semibold ${isSelected ? 'text-orange-700 dark:text-orange-300' : 'text-blue-400 group-hover:text-orange-600'}`}>• {formatTimeOnly(visit.visited_at)}</span>

                                                    {/* Badge Indikator Produk */}
                                                    {visit.products && visit.products.length > 0 && (
                                                        <span className="inline-flex items-center gap-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border border-emerald-200 dark:border-emerald-800">
                                                            <Package size={10} /> {visit.products.length} Item
                                                        </span>
                                                    )}
                                                </div>
                                                <p className={`font-bold text-sm truncate pr-2 ${isSelected ? 'text-orange-950 dark:text-orange-50' : 'text-slate-800 dark:text-slate-100 group-hover:text-orange-900'}`}>{visit.description || 'Tidak ada deskripsi'}</p>
                                                <div className={`mt-1 flex items-center gap-1 text-xs font-medium ${isSelected ? 'text-orange-700/80' : 'text-slate-500 group-hover:text-orange-600'}`}><MapPin size={12} className="shrink-0" /><span className="truncate">{visit.address || 'Lokasi terpin'}</span></div>
                                            </div>
                                            <div className="self-center pl-1 hidden sm:block">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isSelected ? 'bg-orange-500 text-white' : 'bg-transparent group-hover:bg-orange-500 group-hover:text-white'}`}><ChevronRight size={18} /></div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                            {/* Pagination (SAMA) */}
                            {totalItems > itemsPerPage && (
                                <div className="bg-slate-50/50 dark:bg-slate-900 px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-4">
                                    <button onClick={prevPage} disabled={currentPage === 1} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors shadow-sm"><ChevronLeft size={16} /><span className="hidden sm:inline">Sebelumnya</span></button>
                                    <div className="flex items-center self-start sm:self-center">
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800/50"><span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>Halaman {String(currentPage).padStart(2, '0')} / {String(totalPages || 1).padStart(2, '0')}</span>
                                    </div>
                                    <button onClick={nextPage} disabled={currentPage === totalPages} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors shadow-sm"><span className="hidden sm:inline">Selanjutnya</span><ChevronRight size={16} /></button>
                                </div>
                            )}
                        </motion.div>
                    )}
                </div>
            </div>

            {/* --- MODAL INPUT KUNJUNGAN */}
            <VisitInputModalContainer
                isOpen={openVisit}
                onClose={() => setOpenVisit(false)}
                products={products}
                getVerifiedLocation={getVerifiedLocation}
                onPreviewImage={(url) => {
                    setIsPreviewOpen(true);
                    setPreviewUrl(url);
                }}
            />

            {userFaceDescriptor && (
                <FaceVerificationModal
                    isOpen={isFaceModalOpen}
                    onClose={() => setIsFaceModalOpen(false)}
                    onVerified={(type: 'in' | 'out') => {
                        setIsFaceModalOpen(false);
                        executeCheckInOut(type);
                    }}
                    checkType={faceCheckType}
                    storedDescriptor={userFaceDescriptor.descriptor}
                    userName={user.name}
                />
            )}

            {
                selectedVisit && (
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
                )
            }

            {isPreviewOpen && Boolean(previewUrl) && (
                <ImagePreviewModal
                    isOpen={isPreviewOpen}
                    onClose={() => {
                        setIsPreviewOpen(false);
                        setPreviewUrl("");
                    }}
                    imageUrl={previewUrl}
                />
            )}

            <AlertModal
                isOpen={alertConfig.isOpen}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
                onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
                onPrimaryClick={alertConfig.onConfirm}
                primaryButtonText={alertConfig.type === 'error' ? 'Tutup' : 'OK Mengerti'}
                disableBackdropClick={alertConfig.isFatal}
            />

        </AppLayoutMobile>
    );
}