import { Head, router } from '@inertiajs/react';
import imageCompression from 'browser-image-compression';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CalendarDays,
    Clock,
    MapPin,
    Camera,
    ChevronRight,
    History,
    LogOut,
    Plus,
    X,
    Building2,
    Image as ImageIcon,
    Navigation,
    Loader2,
    ArrowRight,
    ArrowUpRight,
    ExternalLink,
    Timer,
    LogIn,
    ChevronLeft,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';

interface AttendanceToday {
    check_in_at?: string | null;
    check_out_at?: string | null;
    location?: string | null;
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
}

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Dashboard', href: dashboard().url }];

export default function Dashboard({ attendanceToday, recentVisits }: Props) {
    const [processing, setProcessing] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [openVisit, setOpenVisit] = useState(false);
    const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);

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
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
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

    const formatTimeOnly = (timeStr?: string | null) => {
        if (!timeStr) return '—';
        const match = timeStr.match(/(\d{2}:\d{2}:\d{2})/);
        return match ? match[1] : '—';
    };

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

    const requestLocation = (onSuccess: (pos: GeolocationPosition) => void) => {
        if (!navigator.geolocation) return alert('Geolocation tidak didukung');

        setProcessing(true);
        navigator.geolocation.getCurrentPosition(
            onSuccess,
            (err) => {
                setProcessing(false);
                const messages = {
                    1: 'Izin lokasi ditolak',
                    2: 'Lokasi tidak dapat ditentukan',
                    3: 'Permintaan lokasi timeout',
                };
                alert(messages[err.code as keyof typeof messages] || 'Gagal mendapatkan lokasi');
            },
            { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
        );
    };

    const handleCheckInOut = (type: 'in' | 'out') => {
        requestLocation((pos) => {
            router.post(
                `/attendance/check-${type}`,
                { lat: pos.coords.latitude, lng: pos.coords.longitude, device_id: 'web' },
                { preserveScroll: true, onFinish: () => setProcessing(false) }
            );
        });
    };

    const submitVisitReport = () => {
        if (!photo) return alert('Foto bukti wajib diunggah');

        requestLocation((pos) => {
            router.post(
                '/visits',
                {
                    activity_type: visitType,
                    description,
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                    photo,
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
        });
    };

    const isCheckedIn = !!attendanceToday;
    const isCheckedOut = isCheckedIn && !!attendanceToday.check_out_at;

    const calculateDuration = (
        checkInStr: string | null | undefined,
        checkOutStr: string | null | undefined,
        now: Date
    ) => {
        if (!checkInStr) return "--:--:--";

        const start = new Date(checkInStr).getTime();
        // Jika sudah checkout, pakai waktu checkout. Jika belum, pakai waktu sekarang (realtime).
        const end = checkOutStr ? new Date(checkOutStr).getTime() : now.getTime();

        const diff = end - start;

        // Validasi jika waktu negatif (opsional)
        if (diff < 0) return "00:00:00";

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        // Format 00:00:00
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard • Sales" />

            <div className="min-h-screen bg-blue-50/20 dark:bg-blue-950/10 pb-16 pt-8 px-5 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-7xl space-y-10">

                    {/* --- HERO SECTION: DATA RINGKAS --- */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="mb-8"
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 lg:p-8 shadow-sm mb-8 relative overflow-hidden"
                        >
                            {/* Dekorasi Background Halus */}
                            <div className="absolute top-0 right-0 w-80 h-80 bg-blue-50/50 dark:bg-blue-900/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

                            <div className="relative flex flex-col xl:flex-row items-start xl:items-center justify-between gap-8">

                                {/* BAGIAN KIRI: Info User & Status */}
                                <div className="flex-1 min-w-0 w-full">
                                    <div className="flex items-center justify-between xl:justify-start gap-4 mb-2">
                                        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                                            Dashboard Aktivitas
                                        </h1>
                                    </div>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm lg:text-base leading-relaxed max-w-xl">
                                        Pantau jam masuk, jam pulang, dan durasi kerja Anda hari ini secara real-time.
                                    </p>
                                </div>

                                {/* BAGIAN KANAN: Metrik Waktu (Masuk - Pulang - Durasi) */}
                                <div className="w-full xl:w-auto bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-800">

                                    {/* 1. Jam Masuk (Aksen Biru) */}
                                    <div className="flex items-center gap-4 p-4 sm:px-6 sm:py-4 flex-1 sm:flex-none min-w-35">
                                        <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl text-blue-600 shadow-sm border border-slate-100 dark:border-slate-800">
                                            <LogIn size={20} strokeWidth={2} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-0.5">Jam Masuk</p>
                                            <p className="text-lg font-bold text-slate-900 dark:text-slate-100 font-mono">
                                                {attendanceToday?.check_in_at
                                                    ? formatTimeOnly(attendanceToday.check_in_at)
                                                    : '--:--'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* 2. Jam Pulang (Aksen Oranye) */}
                                    <div className="flex items-center gap-4 p-4 sm:px-6 sm:py-4 flex-1 sm:flex-none min-w-35">
                                        <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl text-orange-500 shadow-sm border border-slate-100 dark:border-slate-800">
                                            <LogOut size={20} strokeWidth={2} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-0.5">Jam Pulang</p>
                                            <p className="text-lg font-bold text-slate-900 dark:text-slate-100 font-mono">
                                                {attendanceToday?.check_out_at
                                                    ? formatTimeOnly(attendanceToday.check_out_at)
                                                    : '--:--'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* 3. Durasi (Netral/Hitam) */}
                                    <div className="flex items-center gap-4 p-4 sm:px-6 sm:py-4 flex-1 sm:flex-none min-w-35 bg-white/50 dark:bg-white/5 sm:rounded-r-2xl">
                                        <div className="p-2.5 bg-slate-200 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 border border-transparent">
                                            {/* Tambahkan animasi pulse hanya jika sedang berjalan (belum checkout) */}
                                            <Timer
                                                size={20}
                                                strokeWidth={2}
                                                className={attendanceToday?.check_in_at && !attendanceToday?.check_out_at ? "animate-pulse text-blue-600 dark:text-blue-400" : ""}
                                            />
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-0.5">Durasi Kerja</p>
                                            <p className="text-lg font-bold text-slate-900 dark:text-slate-100 font-mono">
                                                {calculateDuration(
                                                    attendanceToday?.check_in_at,
                                                    attendanceToday?.check_out_at,
                                                    currentTime
                                                )}
                                            </p>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </motion.div>

                        {/* 3 Grid Info - Seragam & Bersih */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Kartu Waktu */}
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-sm flex items-center gap-4">
                                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
                                    <Clock size={24} strokeWidth={1.5} />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Waktu Lokal</p>
                                    <p className="text-xl font-bold text-slate-900 dark:text-slate-100 font-mono">
                                        {formatTimeWithSeconds(currentTime)}
                                    </p>
                                </div>
                            </div>

                            {/* Kartu Tanggal */}
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-sm flex items-center gap-4">
                                <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-orange-600 dark:text-orange-500">
                                    <CalendarDays size={24} strokeWidth={1.5} />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Tanggal</p>
                                    <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
                                        {formatDateLong(currentTime).split(', ')[1]}
                                    </p>
                                </div>
                            </div>

                            {/* Kartu Shift/Status */}
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-sm flex items-center gap-4">
                                <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400">
                                    <MapPin size={24} strokeWidth={1.5} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Posisi Terakhir</p>
                                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100 wrap-break-word">
                                        {recentVisits?.[0]?.address || attendanceToday?.location || '-'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>


                    {/* --- MAIN ACTION GRID: SEIMBANG & PROFESIONAL --- */}
                    <div className="grid md:grid-cols-2 gap-6 mb-8">

                        {/* CARD 1: PRESENSI */}
                        <motion.div
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between h-full hover:border-blue-300 dark:hover:border-blue-700 transition-colors duration-300"
                            whileHover={{ y: -2 }}
                        >
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-700 dark:text-blue-400">
                                        <Navigation size={28} />
                                    </div>
                                    {isCheckedIn && !isCheckedOut && (
                                        <span className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold uppercase rounded dark:bg-green-900/30 dark:text-green-400">Running</span>
                                    )}
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Presensi Harian</h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                                    Catat waktu kedatangan dan kepulangan Anda berbasis lokasi.
                                </p>
                            </div>

                            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                                {!isCheckedIn ? (
                                    <button
                                        onClick={() => handleCheckInOut('in')}
                                        disabled={processing}
                                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2"
                                    >
                                        {processing ? <Loader2 className="animate-spin" size={18} /> : 'Check In Masuk'}
                                    </button>
                                ) : !isCheckedOut ? (
                                    <button
                                        onClick={() => handleCheckInOut('out')}
                                        disabled={processing}
                                        className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2"
                                    >
                                        {processing ? <Loader2 className="animate-spin" size={18} /> : 'Check Out Pulang'}
                                    </button>
                                ) : (
                                    <div className="w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium rounded-lg text-center cursor-not-allowed">
                                        Tugas Hari Ini Selesai
                                    </div>
                                )}
                            </div>
                        </motion.div>

                        {/* CARD 2: KUNJUNGAN (Desain Identik dengan Card 1 agar Seragam) */}
                        <motion.div
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between h-full hover:border-orange-300 dark:hover:border-orange-700 transition-colors duration-300"
                            whileHover={{ y: -2 }}
                        >
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    {/* Menggunakan Oranye sebagai pembeda visual ikon */}
                                    <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl text-orange-700 dark:text-orange-400">
                                        <Building2 size={28} />
                                    </div>
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Laporan Kunjungan</h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                                    Buat laporan aktivitas sales atau kunjungan klien baru di sini.
                                </p>
                            </div>

                            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    onClick={() => setOpenVisit(true)}
                                    disabled={processing || !isCheckedIn || isCheckedOut}
                                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2"
                                >
                                    <Plus size={18} />
                                    <span>Tambah Laporan</span>
                                </button>
                            </div>
                        </motion.div>
                    </div>


                    {/* --- RIWAYAT SECTION: PAGINATED & CLEAN --- */}
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden mb-10"
                    >
                        {/* HEADER: Besar, Bold & Premium */}
                        <div className="px-6 py-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900">
                            <div className="flex items-center gap-4">
                                {/* ICON BOX: Lebih Besar & Menonjol */}
                                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-2xl text-blue-600 dark:text-blue-400 shadow-sm">
                                    <History size={24} strokeWidth={2} />
                                </div>

                                <div>
                                    {/* JUDUL: Ukuran XL & Tracking Tight */}
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight leading-none mb-1">
                                        Riwayat Aktivitas
                                    </h3>
                                    {/* SUBJUDUL: Lebih jelas */}
                                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                        Menampilkan data <span className="text-slate-900 dark:text-slate-200 font-bold">{startIndex + 1}-{Math.min(endIndex, totalItems)}</span> dari total <span className="text-slate-900 dark:text-slate-200 font-bold">{totalItems}</span>
                                    </p>
                                </div>
                            </div>

                        </div>

                        {/* CONTENT: List Items */}
                        <div className="min-h-50">
                            {totalItems === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 text-center">
                                    <div className="w-16 h-16 bg-blue-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 text-blue-300 dark:text-slate-600">
                                        <History size={32} strokeWidth={1.5} />
                                    </div>
                                    <p className="text-slate-500 font-medium">Belum ada aktivitas tercatat.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {currentItems.map((visit, index) => {
                                        const itemNumber = startIndex + index + 1;

                                        return (
                                            <button
                                                key={visit.id}
                                                onClick={() => setSelectedVisit(visit)}
                                                className="w-full text-left p-4 sm:p-5 
                                 border-l-4 border-transparent 
                                 bg-white dark:bg-slate-900
                                 hover:border-orange-500 
                                 hover:bg-orange-50 dark:hover:bg-orange-900/10 
                                 transition-all duration-200 group flex items-start sm:items-center gap-3 sm:gap-5"
                                            >
                                                {/* 1. NOMOR: TAMPIL DI MOBILE SEBAGAI BADGE KOTAK */}
                                                {/* Ini mengisi kekosongan visual di sebelah kiri */}
                                                <div className="shrink-0 mt-1 sm:mt-0">
                                                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl 
                                            bg-blue-50 dark:bg-slate-800 
                                            border border-blue-100 dark:border-slate-700
                                            group-hover:bg-orange-500 group-hover:border-orange-500
                                            flex items-center justify-center transition-all duration-300 shadow-sm">
                                                        <span className="font-mono text-xs sm:text-lg font-bold text-blue-600 dark:text-blue-400 group-hover:text-white transition-colors">
                                                            {String(itemNumber).padStart(2, '0')}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* 2. THUMBNAIL */}
                                                <div className="shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 relative border border-slate-200 dark:border-slate-700 group-hover:border-orange-200 transition-colors">
                                                    {visit.photos?.[0] ? (
                                                        <img
                                                            src={`/storage/${visit.photos[0].file_path}`}
                                                            alt="Bukti"
                                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                        />
                                                    ) : (
                                                        <div className="absolute inset-0 flex items-center justify-center text-slate-300 dark:text-slate-600 group-hover:text-orange-300 transition-colors">
                                                            <ImageIcon size={18} />
                                                        </div>
                                                    )}
                                                </div>

                                                {/* 3. CONTENT */}
                                                <div className="flex-1 min-w-0 pt-0.5">
                                                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-1">
                                                        {/* BADGE */}
                                                        <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border transition-colors
                                    bg-blue-50 text-blue-600 border-blue-100 
                                    dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800
                                    group-hover:bg-white group-hover:text-orange-600 group-hover:border-white/50">
                                                            {visit.activity_type}
                                                        </span>

                                                        {/* WAKTU */}
                                                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 group-hover:text-orange-800 dark:group-hover:text-orange-200 transition-colors">
                                                            • {formatTimeOnly(visit.visited_at)}
                                                        </span>
                                                    </div>

                                                    <p className="font-bold text-slate-900 dark:text-slate-100 text-sm truncate pr-2 group-hover:text-orange-900 dark:group-hover:text-orange-100 transition-colors">
                                                        {visit.description || 'Tidak ada deskripsi'}
                                                    </p>

                                                    <div className="mt-1 flex items-center gap-1 text-xs text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-400 transition-colors">
                                                        <MapPin size={12} className="shrink-0 text-slate-300 group-hover:text-orange-500 transition-colors" />
                                                        <span className="truncate max-w-35 sm:max-w-md">
                                                            {visit.address || 'Lokasi terpin'}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* 4. CHEVRON */}
                                                <div className="self-center pl-1 hidden sm:block">
                                                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-transparent group-hover:bg-white/50 transition-all">
                                                        <ChevronRight size={18} className="text-slate-300 group-hover:text-orange-500 transition-colors" />
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* FOOTER: Pagination Controls */}
                        {totalItems > itemsPerPage && (
                            <div className="bg-slate-50/50 dark:bg-slate-900 px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">

                                {/* Tombol Sebelumnya */}
                                <button
                                    onClick={prevPage}
                                    disabled={currentPage === 1}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors shadow-sm"
                                >
                                    <ChevronLeft size={16} />
                                    <span className="hidden sm:inline">Sebelumnya</span>
                                </button>

                                {/* Info Halaman (Desktop) */}

                                <div className="flex items-center self-start sm:self-center">
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800/50">
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                                        Halaman {String(currentPage).padStart(2, '0')} / {String(totalPages || 1).padStart(2, '0')}
                                    </span>
                                </div>

                                {/* Tombol Selanjutnya */}
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

                </div>
            </div>

            {/* --- MODAL BUAT KUNJUNGAN (Lebih Rapi & Proporsional) --- */}
            <AnimatePresence>
                {openVisit && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setOpenVisit(false)}
                            // Backdrop biru gelap transparan
                            className="absolute inset-0 bg-blue-950/70 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            // Modal shape dan warna dominan biru/putih
                            className="relative w-full max-w-md bg-white dark:bg-blue-900 rounded-4xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
                        >
                            <div className="px-6 py-5 border-b border-blue-100 dark:border-blue-800 flex items-center justify-between sticky top-0 bg-white dark:bg-blue-900 z-10">
                                <div>
                                    <h3 className="text-lg font-bold text-blue-900 dark:text-white">Input Kunjungan</h3>
                                    <p className="text-xs text-blue-500 dark:text-blue-300 mt-0.5">Lengkapi data di bawah ini</p>
                                </div>
                                <button
                                    onClick={() => setOpenVisit(false)}
                                    className="p-2 hover:bg-blue-50 dark:hover:bg-blue-800 rounded-full transition-colors text-blue-400 dark:text-blue-500"
                                >
                                    <X size={22} />
                                </button>
                            </div>

                            <div className="p-6 space-y-6 overflow-y-auto thin-scrollbar">
                                {/* Type Selection - Biru aktif */}
                                <div className="space-y-3">
                                    <label className="text-sm font-bold text-blue-800 dark:text-blue-200">Jenis Aktivitas</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {['visit', 'canvassing', 'collection', 'delivery'].map((type) => (
                                            <button
                                                key={type}
                                                onClick={() => setVisitType(type)}
                                                className={`py-2.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${visitType === type
                                                    // State Aktif: Biru
                                                    ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200 dark:shadow-none'
                                                    // State Tidak Aktif: Outline Biru Tipis
                                                    : 'bg-white dark:bg-blue-800/50 text-blue-600 dark:text-blue-300 border-blue-200 dark:border-blue-700 hover:border-blue-400 hover:bg-blue-50/50'
                                                    }`}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Description - Fokus Oranye */}
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-blue-800 dark:text-blue-200">Catatan</label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        rows={3}
                                        // Aksen fokus oranye
                                        className="w-full rounded-xl border-blue-200 dark:border-blue-700 bg-blue-50/30 dark:bg-blue-800/30 focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all text-sm p-3 text-blue-900 dark:text-blue-100 placeholder-blue-400 dark:placeholder-blue-600"
                                        placeholder="Contoh: Bertemu Bpk. Budi, prospek tertarik..."
                                    />
                                </div>

                                {/* Photo Input - Aksen Oranye saat terisi */}
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-blue-800 dark:text-blue-200 flex justify-between items-center">
                                        <span>Foto Bukti</span>
                                        <span className="text-orange-500 text-[10px] font-bold uppercase bg-orange-50 dark:bg-orange-900/30 px-2 py-0.5 rounded-full">*Wajib</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            capture="environment"
                                            onChange={handlePhotoChange}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        />
                                        {/* Container Foto: Tinggi disesuaikan (h-40) */}
                                        <div className={`border-2 border-dashed rounded-2xl h-40 flex flex-col items-center justify-center transition-all overflow-hidden ${photo
                                            // Jika ada foto: Border & BG Oranye Aksen
                                            ? 'border-orange-400 bg-orange-50 dark:bg-orange-900/10'
                                            // Default: Border Biru
                                            : 'border-blue-200 dark:border-blue-700 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-800/50'
                                            }`}>
                                            {isCompressing ? (
                                                <div className="flex flex-col items-center text-blue-600 dark:text-blue-400">
                                                    <Loader2 className="animate-spin mb-3" size={24} />
                                                    <span className="text-xs font-bold uppercase tracking-wider animate-pulse">Memproses...</span>
                                                </div>
                                            ) : photo ? (
                                                <div className="relative w-full h-full">
                                                    <img
                                                        src={URL.createObjectURL(photo)}
                                                        className="w-full h-full object-cover"
                                                        alt="Preview"
                                                    />
                                                    <div className="absolute inset-0 flex items-center justify-center bg-blue-900/40 opacity-0 hover:opacity-100 transition-opacity">
                                                        <span className="text-white text-xs font-bold flex items-center gap-2 bg-blue-900/70 px-3 py-1.5 rounded-full"><Camera size={14} /> Ganti Foto</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-center p-4">
                                                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm">
                                                        <Camera size={24} />
                                                    </div>
                                                    <p className="text-sm font-bold text-blue-700 dark:text-blue-300">Tap untuk ambil foto</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 border-t border-blue-100 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-800/30">
                                {/* Tombol Submit: Biru Dominan */}
                                <button
                                    onClick={submitVisitReport}
                                    disabled={processing || isCompressing || !photo}
                                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-60 disabled:shadow-none"
                                >
                                    {processing ? <Loader2 className="animate-spin" size={20} /> : <>Kirim Laporan <ArrowRight size={18} /></>}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* --- MODAL DETAIL (Lebih Rapi & Proporsional) --- */}
            <AnimatePresence>
                {selectedVisit && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedVisit(null)}
                            className="absolute inset-0 bg-blue-950/70 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            // Ukuran modal detail proporsional
                            className="relative w-full max-w-md bg-white dark:bg-blue-900 rounded-4xl shadow-2xl overflow-hidden"
                        >
                            {/* Header Gambar - Tinggi disesuaikan (h-56) */}
                            <div className="relative h-56 bg-blue-100 dark:bg-blue-800 group">
                                {selectedVisit.photos?.[0] ? (
                                    <>
                                        <img
                                            src={`/storage/${selectedVisit.photos[0].file_path}`}
                                            alt="Detail"
                                            className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-700"
                                        />
                                        <div className="absolute inset-0 bg-linear-to-t from-blue-900/60 to-transparent pointer-events-none"></div>

                                        {/* Tombol Lihat Penuh - Aksen Oranye */}
                                        <a
                                            href={`/storage/${selectedVisit.photos[0].file_path}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="absolute bottom-4 right-4 bg-orange-500/90 hover:bg-orange-600 text-white px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wide flex items-center gap-1.5 transition shadow-sm backdrop-blur-sm"
                                        >
                                            Lihat Penuh <ExternalLink size={12} />
                                        </a>
                                    </>
                                ) : (
                                    <div className="flex items-center justify-center h-full text-blue-300 dark:text-blue-600">
                                        <ImageIcon size={48} opacity={0.5} />
                                    </div>
                                )}
                                <button
                                    onClick={() => setSelectedVisit(null)}
                                    className="absolute top-4 right-4 bg-blue-950/40 hover:bg-blue-950/70 text-white p-2 rounded-full backdrop-blur-sm transition"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-6">
                                <div className="flex items-center gap-3 mb-5">
                                    {/* Tag Tipe - Biru */}
                                    <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-200 text-[11px] font-bold uppercase tracking-wide shadow-sm">
                                        {selectedVisit.activity_type}
                                    </span>
                                    <span className="text-blue-400 dark:text-blue-500 text-xs font-medium">
                                        {formatTimeOnly(selectedVisit.visited_at)}
                                    </span>
                                </div>

                                <div className="mb-6">
                                    <h4 className="text-xs font-bold text-blue-500 dark:text-blue-400 uppercase tracking-wider mb-2">Deskripsi</h4>
                                    <p className="text-blue-900 dark:text-blue-100 leading-relaxed bg-blue-50/50 dark:bg-blue-800/30 p-4 rounded-xl text-sm border border-blue-100 dark:border-blue-800/50">
                                        {selectedVisit.description || 'Tidak ada catatan.'}
                                    </p>
                                </div>

                                <div>
                                    <h4 className="text-xs font-bold text-blue-500 dark:text-blue-400 uppercase tracking-wider mb-2">Lokasi</h4>
                                    <div className="flex items-start gap-3">
                                        {/* Ikon Lokasi - Aksen Oranye */}
                                        <MapPin className="text-orange-500 mt-0.5 shrink-0" size={18} />
                                        <div>
                                            <p className="text-sm font-medium text-blue-800 dark:text-blue-200 line-clamp-2 leading-snug">
                                                {selectedVisit.address || `GPS: ${selectedVisit.lat?.toFixed(6)}, ${selectedVisit.lng?.toFixed(6)}`}
                                            </p>
                                            {selectedVisit.lat && (
                                                // Link Maps - Aksen Oranye
                                                <a
                                                    href={`http://googleusercontent.com/maps.google.com/?q=${selectedVisit.lat},${selectedVisit.lng}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 text-orange-500 hover:text-orange-600 dark:text-orange-400 font-bold text-xs mt-2 hover:underline"
                                                >
                                                    Buka di Google Maps <ArrowUpRight size={12} />
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