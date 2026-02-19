import { Head, router } from '@inertiajs/react';
import imageCompression from 'browser-image-compression';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MapPin,
    Camera,
    ChevronRight,
    History,
    LogOut,
    Plus,
    X,
    Image as ImageIcon,
    Loader2,
    ArrowRight,
    ArrowUpRight,
    ExternalLink,
    LogIn,
    ChevronLeft,
    CheckCircle2,
    PenLine,
    FileText,
} from 'lucide-react';
import { useRef } from 'react';
import { useState, useEffect } from 'react';
import AppLayout from '@/layouts/app-layout';
// import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';

interface AttendanceToday {
    check_in_at?: string | null;
    check_out_at?: string | null;
    location?: string | null;
    check_in_address?: string | null;
    check_out_address?: string | null;
    // Add other fields as needed
}

interface VisitPhoto {
    file_path: string;
    // Add other fields as needed
}

interface Visit {
    id: number;
    activity_type: string;
    description?: string;
    visited_at?: string;
    address?: string;
    lat?: number;
    lng?: number;
    photos?: VisitPhoto[];
    // Add other fields as needed
}

interface Props {
    attendanceToday: AttendanceToday | null;
    recentVisits: Visit[];
    user: {
        name: string;
    };
    serverTime: string;
}

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Dashboard', href: '/dashboard' }];

export default function Dashboard({ attendanceToday, recentVisits, user, serverTime }: Props & { serverTime: string }) {
    const [processing, setProcessing] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date(serverTime));
    const [openVisit, setOpenVisit] = useState(false);
    const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);

    const [showConfirmOut, setShowConfirmOut] = useState(false);


    const [visitType, setVisitType] = useState('visit');
    const [description, setDescription] = useState('');
    const [photo, setPhoto] = useState<File | null>(null);
    const [isCompressing, setIsCompressing] = useState(false);

    // Tambahkan ini di bagian atas komponen (sebelum return)
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    // Logika pemotongan data
    const totalItems = recentVisits.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = recentVisits.slice(startIndex, endIndex);

    // Fungsi navigasi
    const nextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));
    const prevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));

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

    const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsCompressing(true);
        try {
            const compressed = await imageCompression(file, {
                maxSizeMB: 0.6,
                maxWidthOrHeight: 1400,
                fileType: 'image/webp',
            });
            const finalFile = new File([compressed], `visit-${Date.now()}.webp`, { type: 'image/webp' });
            setPhoto(finalFile);
        } catch {
            alert('Gagal memproses foto. Coba lagi.');
        } finally {
            setIsCompressing(false);
        }
    };

    const getXsrfToken = () =>
        decodeURIComponent(
            document.cookie
                .split('; ')
                .find(row => row.startsWith('XSRF-TOKEN='))
                ?.split('=')[1] || ''
        );


    const handleCheckInOut = (type: 'in' | 'out') => {
        setProcessing(true);

        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const { latitude, longitude } = pos.coords;

                try {
                    const geo = await fetch('/utils/reverse-geocode', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-XSRF-TOKEN': getXsrfToken(),
                        },
                        body: JSON.stringify({
                            lat: latitude,
                            lng: longitude,
                        }),
                    });

                    const { address } = await geo.json();

                    router.post(
                        `/attendance/check-${type}`,
                        {
                            lat: latitude,
                            lng: longitude,
                            device_id: 'web',
                            [`check_${type}_address`]: address ?? 'Lokasi tidak ditemukan',
                        },
                        {
                            preserveScroll: true,
                            onFinish: () => setProcessing(false),
                        }
                    );
                } catch {
                    setProcessing(false);
                    alert('Gagal mengambil alamat lokasi');
                }
            },
            () => {
                setProcessing(false);
                alert('Izin lokasi ditolak');
            }
        );
    };


    const submitVisitReport = () => {
        if (!photo) return alert('Foto bukti wajib diunggah');

        setProcessing(true);

        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const { latitude, longitude } = pos.coords;

                try {
                    const geo = await fetch('/utils/reverse-geocode', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-XSRF-TOKEN': getXsrfToken(),
                        },
                        body: JSON.stringify({
                            lat: latitude,
                            lng: longitude,
                        }),
                    });

                    const { address } = await geo.json();

                    router.post(
                        '/visits',
                        {
                            activity_type: visitType,
                            description,
                            lat: latitude,
                            lng: longitude,
                            photo,
                            address: address ?? 'Lokasi tidak ditemukan',
                        },
                        {
                            forceFormData: true,
                            onSuccess: () => {
                                setOpenVisit(false);
                                setDescription('');
                                setPhoto(null);
                                setVisitType('visit');
                            },
                            onFinish: () => setProcessing(false),
                        }
                    );
                } catch {
                    setProcessing(false);
                    alert('Gagal mengambil alamat lokasi');
                }
            },
            () => {
                setProcessing(false);
                alert('Izin lokasi ditolak');
            }
        );
    };

    const isCheckedIn = !!attendanceToday;
    const isCheckedOut = isCheckedIn && !!attendanceToday.check_out_at;

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

    const calculateDuration = (
        checkInStr: string | null | undefined,
        checkOutStr: string | null | undefined,
        now: Date
    ) => {
        if (!checkInStr) return "--:--:--";

        const start = parseWIB(checkInStr).getTime();
        const end = checkOutStr
            ? parseWIB(checkOutStr).getTime()
            : now.getTime();

        const diff = Math.max(0, end - start);

        const hours = Math.floor(diff / 3_600_000);
        const minutes = Math.floor((diff % 3_600_000) / 60_000);
        const seconds = Math.floor((diff % 60_000) / 1_000);

        return `${hours.toString().padStart(2, '0')}:${minutes
            .toString()
            .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    // 1. Buat referensi untuk 2 input berbeda
    const cameraInputRef = useRef<HTMLInputElement>(null);
    const galleryInputRef = useRef<HTMLInputElement>(null);

    // 2. Fungsi trigger klik
    const onCameraClick = () => cameraInputRef.current?.click();
    const onGalleryClick = () => galleryInputRef.current?.click();

    // 3. Handler Hapus Foto (Opsional, untuk UX yang lebih baik)
    const handleRemovePhoto = (e: React.MouseEvent) => {
        e.stopPropagation();
        setPhoto(null);
        // Reset value input agar bisa pilih file yang sama jika perlu
        if (cameraInputRef.current) cameraInputRef.current.value = '';
        if (galleryInputRef.current) galleryInputRef.current.value = '';
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard • Sales" />

            <div className="min-h-screen bg-blue-50/20 dark:bg-blue-950/10 pb-16 pt-8 px-5 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-7xl space-y-10">
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="w-full mx-auto mb-8 px-2 md:px-4"
                    >
                        {/* --- HEADER SECTION --- */}
                        <div className="flex items-center justify-between mb-6 group">
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <div className="h-12 w-12 md:h-14 md:w-14 rounded-2xl bg-linear-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold text-xl shadow-lg rotate-3">
                                        U
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full"></div>
                                </div>

                                <div>
                                    <div className="flex items-center gap-2">
                                        <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                                            Halo, {user.name}
                                        </h1>
                                        <span className="text-xl animate-bounce">👋</span>
                                    </div>
                                    <p className="text-[11px] md:text-xs font-bold uppercase tracking-[0.15em] text-blue-600 dark:text-blue-400 opacity-80">
                                        {formatDateLong(currentTime)}
                                    </p>
                                </div>
                            </div>

                            <div className="text-right bg-blue-50 dark:bg-blue-900/30 backdrop-blur-md px-4 py-2 rounded-2xl border border-blue-200 dark:border-blue-700 shadow-inner">
                                <p className="text-[10px] font-bold text-blue-500 dark:text-blue-300 uppercase tracking-widest mb-0.5">Waktu Server</p>
                                <p className="text-sm md:text-base font-mono font-black text-blue-700 dark:text-blue-200 leading-none">
                                    {formatTimeWithSeconds(currentTime)}
                                </p>
                            </div>
                        </div>

                        {/* --- MAIN POWER CARD --- */}
                        <motion.div
                            whileHover={{ scale: 1.005 }}
                            className="relative w-full overflow-hidden rounded-4xl bg-linear-to-br from-slate-900 via-blue-900 to-blue-800 p-6 md:p-8 text-white shadow-2xl shadow-blue-500/30"
                        >
                            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-blue-400/10 blur-3xl" />
                            <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-indigo-500/10 blur-3xl" />

                            <div className="relative z-10">
                                <div className="flex flex-col items-center py-2 md:py-4 text-center">
                                    <div className="bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm mb-3">
                                        <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-[0.2em] text-blue-200">
                                            Durasi Online Hari Ini
                                        </span>
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-5xl md:text-7xl font-black tabular-nums tracking-tighter drop-shadow-md">
                                            {calculateDuration(attendanceToday?.check_in_at, attendanceToday?.check_out_at, currentTime).split(' ')[0] || "00:00"}
                                        </span>
                                        <span className="text-xs md:text-sm font-bold text-blue-300 uppercase">
                                            {attendanceToday?.check_in_at && !attendanceToday?.check_out_at ? 'Running' : 'Closed'}
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-8 grid grid-cols-2 gap-4">
                                    <div className="flex flex-col items-center bg-white/5 rounded-2xl py-4 border border-white/10">
                                        <div className="mb-1 p-1.5 rounded-lg bg-blue-500/20 text-blue-300">
                                            <LogIn size={16} />
                                        </div>
                                        <span className="text-[9px] font-bold uppercase text-blue-200/50 tracking-wider">Check In</span>
                                        <p className="text-xl font-black">{attendanceToday?.check_in_at ? formatTimeOnly(attendanceToday.check_in_at) : '--:--'}</p>
                                    </div>

                                    <div className="flex flex-col items-center bg-white/5 rounded-2xl py-4 border border-white/10">
                                        <div className="mb-1 p-1.5 rounded-lg bg-orange-500/20 text-orange-400">
                                            <LogOut size={16} />
                                        </div>
                                        <span className="text-[9px] font-bold uppercase text-orange-200/50 tracking-wider">Check Out</span>
                                        <p className="text-xl font-black">{attendanceToday?.check_out_at ? formatTimeOnly(attendanceToday.check_out_at) : '--:--'}</p>
                                    </div>
                                </div>

                                {/* --- REVISED MINIMALIST LOCATION FOOTER --- */}
                                <div className="mt-6 flex items-center justify-center gap-2 pt-4 border-t border-white/10">
                                    <MapPin size={14} className="text-blue-400 shrink-0" />
                                    <p className="truncate text-[11px] font-medium text-blue-100/80 italic">
                                        {attendanceToday?.check_out_address || recentVisits?.[0]?.address || attendanceToday?.check_in_address || 'Belum melakukan presensi...'}
                                    </p>
                                </div>
                            </div>
                        </motion.div>

                        {/* --- ACTION BUTTONS SECTION --- */}
                        <div className="mt-6 grid grid-cols-1 gap-4">
                            {!isCheckedIn ? (
                                <button
                                    onClick={() => handleCheckInOut('in')}
                                    disabled={processing}
                                    className="flex w-full items-center justify-center gap-3 rounded-2xl bg-blue-600 py-4.5 text-lg font-black text-white shadow-xl shadow-blue-600/20 active:scale-[0.97] h-16"
                                >
                                    {processing ? <Loader2 className="animate-spin" /> : <LogIn size={24} />}
                                    <span>MULAI PRESENSI</span>
                                </button>
                            ) : !isCheckedOut ? (
                                <div className="flex flex-col gap-3">
                                    <button
                                        onClick={() => setShowConfirmOut(true)}
                                        disabled={processing}
                                        className="flex w-full items-center justify-center gap-3 rounded-2xl bg-linear-to-r from-orange-500 to-red-600 py-4.5 text-lg font-black text-white active:scale-[0.97] h-16"
                                    >
                                        {processing ? <Loader2 className="animate-spin" /> : <LogOut size={24} />}
                                        <span>SELESAIKAN ONLINE</span>
                                    </button>
                                    {/* Modal Konfirmasi Check Out */}
                                    <AnimatePresence>
                                        {showConfirmOut && (
                                            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                                                <motion.div
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    onClick={() => setShowConfirmOut(false)}
                                                    className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm"
                                                />
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                                    className="relative w-full max-w-xs bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
                                                >
                                                    <div className="px-6 py-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                                                        <h3 className="text-base font-bold text-orange-700 dark:text-orange-300">Konfirmasi Check Out</h3>
                                                        <button
                                                            onClick={() => setShowConfirmOut(false)}
                                                            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-400 hover:text-orange-500"
                                                        >
                                                            <X size={20} />
                                                        </button>
                                                    </div>
                                                    <div className="p-6 space-y-4">
                                                        <p className="text-sm text-zinc-700 dark:text-zinc-200">
                                                            Apakah Anda yakin ingin menyelesaikan online hari ini?
                                                        </p>
                                                        <button
                                                            onClick={() => {
                                                                setShowConfirmOut(false);
                                                                handleCheckInOut('out');
                                                            }}
                                                            disabled={processing}
                                                            className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                                                        >
                                                            {processing ? <Loader2 className="animate-spin" size={18} /> : <>Konfirmasi <LogOut size={18} /></>}
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            </div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ) : (
                                <div className="flex w-full items-center justify-center gap-3 rounded-2xl bg-emerald-500/10 py-4.5 text-emerald-600 font-black border-2 border-emerald-500/20 h-16">
                                    <CheckCircle2 size={24} />
                                    TUGAS SELESAI
                                </div>
                            )}

                            <button
                                onClick={() => setOpenVisit(true)}
                                disabled={!isCheckedIn || processing || isCheckedOut}
                                className={`flex w-full items-center justify-center gap-3 rounded-2xl py-4.5 text-base font-black transition-all active:scale-[0.97] h-16
                                ${(!isCheckedIn || isCheckedOut)
                                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed border-2 border-transparent'
                                        : 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 border-2 border-blue-600 dark:border-blue-500 shadow-xl shadow-blue-500/10'
                                    }`}
                            >
                                <Plus size={22} strokeWidth={3} />
                                <span>TAMBAH LAPORAN KEGIATAN</span>
                            </button>
                        </div>
                    </motion.div>

                    {/* --- RIWAYAT SECTION: PAGINATED & CLEAN --- */}
                    {totalItems > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden mb-10"
                        >
                            {/* HEADER: Besar, Bold & Premium */}
                            <div className="px-6 py-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-linear-to-r from-blue-100 via-blue-50 to-blue-200 dark:from-blue-950 dark:via-blue-900 dark:to-blue-800">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-blue-100 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-800 rounded-2xl text-blue-700 dark:text-blue-300 shadow-sm">
                                        <History size={24} strokeWidth={2} />
                                    </div>

                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight leading-none mb-1">
                                            Riwayat Aktivitas
                                        </h3>
                                        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                                            Menampilkan data <span className="text-slate-900 dark:text-slate-200 font-bold">{startIndex + 1}-{Math.min(endIndex, totalItems)}</span> dari total <span className="text-slate-900 dark:text-slate-200 font-bold">{totalItems}</span>
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
                                            {/* 1. NOMOR: Warna lebih hidup */}
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

                                            {/* 2. THUMBNAIL: Border mengikuti warna tema */}
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

                                            {/* 3. CONTENT */}
                                            <div className="flex-1 min-w-0 pt-0.5">
                                                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-1">
                                                    <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border transition-colors
                                                        ${isSelected
                                                            ? 'bg-orange-500 text-white border-orange-500'
                                                            : 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 group-hover:bg-orange-500 group-hover:text-white group-hover:border-orange-500'
                                                        }`}>
                                                        {visit.activity_type}
                                                    </span>
                                                    <span className={`text-xs font-semibold ${isSelected ? 'text-orange-700 dark:text-orange-300' : 'text-blue-400 group-hover:text-orange-600'}`}>
                                                        • {formatTimeOnly(visit.visited_at)}
                                                    </span>
                                                </div>

                                                <p className={`font-bold text-sm truncate pr-2 transition-colors
                                                ${isSelected ? 'text-orange-950 dark:text-orange-50' : 'text-slate-800 dark:text-slate-100 group-hover:text-orange-900'}`}>
                                                    {visit.description || 'Tidak ada deskripsi'}
                                                </p>

                                                <div className={`mt-1 flex items-center gap-1 text-xs transition-colors font-medium
                                                ${isSelected ? 'text-orange-700/80' : 'text-slate-500 group-hover:text-orange-600'}`}>
                                                    <MapPin size={12} className={`shrink-0 ${isSelected ? 'text-orange-500' : 'text-blue-300 group-hover:text-orange-500'}`} />
                                                    <span className="truncate">
                                                        {visit.address || 'Lokasi terpin'}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* 4. CHEVRON */}
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

                            {/* FOOTER: Pagination Controls */}
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


                                    <div className="flex items-center self-start sm:self-center">
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
                    )}

                </div>
            </div>

            {/* --- MODAL BUAT KEGIATAN --- */}
            <AnimatePresence>
                {openVisit && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setOpenVisit(false)}
                            className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm"
                        />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-4xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
                        >
                            <div className="px-6 py-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between sticky top-0 bg-white dark:bg-zinc-900 z-10">
                                <div>
                                    <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100">Input Kegiatan</h3>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Isi detail laporan harian Anda</p>
                                </div>
                                <button
                                    onClick={() => setOpenVisit(false)}
                                    className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-400 hover:text-blue-500"
                                >
                                    <X size={22} />
                                </button>
                            </div>

                            <div className="p-6 space-y-6 overflow-y-auto thin-scrollbar">
                                <div className="space-y-3">
                                    <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Jenis Aktivitas</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { id: 'Tahajud', label: 'Tahajud' },
                                            { id: 'Subuh', label: 'Subuh' },
                                            { id: 'Dhuha', label: 'Dhuha' },
                                            { id: 'Dhuhur', label: 'Dhuhur' },
                                            { id: 'Asar', label: 'Asar' },
                                            { id: 'Maghrib', label: 'Maghrib' },
                                            { id: 'Isya', label: 'Isya' },
                                            { id: 'Bekerja', label: 'Bekerja' },
                                            { id: 'Submit-Photo', label: 'Submit-Photo' },
                                            { id: 'Kegiatan-Lain', label: 'Kegiatan-Lain' },
                                        ].map((item) => (
                                            <button
                                                key={item.id}
                                                onClick={() => setVisitType(item.id)}
                                                className={`py-2.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${visitType === item.id
                                                    ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200 dark:shadow-none'
                                                    : 'bg-white dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:border-blue-300 hover:text-blue-500'
                                                    }`}
                                            >
                                                {item.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 flex justify-between">
                                        <span>Catatan Kegiatan</span>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${description.trim().split(/\s+/).length < 10 ? 'bg-orange-100 text-orange-600 border border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800' : 'bg-emerald-100 text-emerald-600 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800'}`}>
                                            {description.trim().split(/\s+/).length} / 10 kata
                                        </span>
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute top-3.5 left-3.5 text-zinc-400 group-focus-within:text-blue-500 transition-colors pointer-events-none">
                                            <FileText size={18} />
                                        </div>

                                        <textarea
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            rows={4}
                                            className="w-full pl-10 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-2xl 
                                            focus:outline-none 
                                            focus:bg-white dark:focus:bg-zinc-900
                                            focus:border-blue-500 
                                            focus:ring-4 focus:ring-blue-500/10 
                                            caret-orange-500 
                                            transition-all text-sm leading-relaxed text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 resize-none"
                                            placeholder="Tulis detail kegiatan yang dilakukan..."
                                        />

                                        <div className="absolute right-3 bottom-3 pointer-events-none opacity-50">
                                            <PenLine size={14} className="text-zinc-300 dark:text-zinc-600" />
                                        </div>
                                    </div>
                                    {description.trim().split(/\s+/).length < 10 && (
                                        <p className="text-xs text-orange-600 mt-1">Minimal 10 kata diperlukan.</p>
                                    )}
                                </div>

                                {/* Input Foto Bukti */}
                                {description.trim().split(/\s+/).length >= 10 && (
                                    <div className="space-y-2">
                                        <input
                                            ref={cameraInputRef}
                                            type="file"
                                            accept="image/*"
                                            capture="environment"
                                            className="hidden"
                                            onChange={handlePhotoChange}
                                        />

                                        <input
                                            ref={galleryInputRef}
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handlePhotoChange}
                                        />

                                        <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 flex justify-between items-center">
                                            <span>Foto Bukti</span>
                                            <span className="text-orange-600 dark:text-orange-400 text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">*Wajib</span>
                                        </label>

                                        <div className={`border-2 border-dashed rounded-2xl h-60 flex flex-col items-center justify-center transition-all overflow-hidden relative ${photo
                                            ? 'border-orange-400 bg-orange-50/30 dark:bg-orange-900/10'
                                            : 'border-zinc-200 dark:border-zinc-700'
                                            }`}>

                                            {isCompressing ? (
                                                <div className="flex flex-col items-center text-blue-500">
                                                    <Loader2 className="animate-spin mb-2" size={24} />
                                                    <span className="text-[10px] font-bold uppercase tracking-widest">Memproses...</span>
                                                </div>
                                            ) : photo ? (
                                                <div className="relative w-full h-full group">
                                                    <img src={URL.createObjectURL(photo)} className="w-full h-full object-cover" alt="Preview" />

                                                    <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-3">
                                                        <button
                                                            onClick={handleRemovePhoto}
                                                            className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transition-colors"
                                                            title="Hapus Foto"
                                                        >
                                                            <X size={20} />
                                                        </button>
                                                        <span className="text-white text-xs font-medium">Hapus untuk mengganti</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="w-full px-8 flex flex-col items-center gap-4">
                                                    <p className="text-sm font-bold text-zinc-500 dark:text-zinc-400 mb-2">
                                                        Pilih metode upload:
                                                    </p>

                                                    <div className="flex w-full gap-4">
                                                        {/* TOMBOL 1: KAMERA */}
                                                        <button
                                                            type="button"
                                                            onClick={onCameraClick}
                                                            className="flex-1 flex flex-col items-center justify-center gap-2 py-6 px-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 border-2 border-transparent hover:border-blue-300 transition-all active:scale-95"
                                                        >
                                                            <Camera size={28} />
                                                            <span className="text-xs font-bold">Kamera</span>
                                                        </button>

                                                        {/* TOMBOL 2: GALERI */}
                                                        <button
                                                            type="button"
                                                            onClick={onGalleryClick}
                                                            className="flex-1 flex flex-col items-center justify-center gap-2 py-6 px-4 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/40 border-2 border-transparent hover:border-purple-300 transition-all active:scale-95"
                                                        >
                                                            <ImageIcon size={28} />
                                                            <span className="text-xs font-bold">Galeri</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                            </div>

                            {/* Footer Actions */}
                            <div className="p-6 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30">
                                <button
                                    onClick={submitVisitReport}
                                    disabled={processing || isCompressing || !photo}
                                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:shadow-none"
                                >
                                    {processing ? <Loader2 className="animate-spin" size={20} /> : <>Kirim Laporan <ArrowRight size={18} /></>}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* --- MODAL DETAIL KEGIATAN --- */}
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
                                <div className="flex items-center gap-3 mb-5">
                                    <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 text-[10px] font-bold uppercase tracking-wider shadow-sm">
                                        {selectedVisit.activity_type}
                                    </span>
                                    <span className="text-zinc-400 text-xs font-medium">
                                        {formatTimeOnly(selectedVisit.visited_at)}
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
        </AppLayout>
    );
}