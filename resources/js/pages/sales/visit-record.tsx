import { AppLauncher } from '@capacitor/app-launcher';
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { Head, router } from '@inertiajs/react';
import axios from 'axios';
import imageCompression from 'browser-image-compression';
import { MockLocationChecker } from 'capacitor-mock-location-checker';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Store,
    User,
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
    LogIn,
    ChevronLeft,
    CheckCircle2,
    Package,
    Trash2,
    Search,
    PenLine,
    CalendarDays,
    Phone,
    Mail,
    StickyNote,
    RefreshCw
} from 'lucide-react';
import { useState, useEffect } from 'react';
import AlertModal from '@/components/modal/alert-modal';
import FaceVerificationModal from '@/components/modal/face-verification-modal';
import ImagePreviewModal from '@/components/modal/image-preview-modal';
import VisitDetailModal from '@/components/modal/visit-detail-modal';
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

interface CartItem {
    product_id: number;
    quantity: number;
    action_type: string;
    product_name?: string;
}

interface Props {
    attendanceToday: AttendanceToday | null;
    recentVisits: Visit[];
    products: Product[];
    user: {
        name: string;
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

    const [customerMode, setCustomerMode] = useState<'database' | 'manual'>('database');
    const [nearbyCustomers, setNearbyCustomers] = useState<Customer[]>([]);
    const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
    const [manualCustomerName, setManualCustomerName] = useState('');
    const [manualCustomerNote, setManualCustomerNote] = useState('');
    const [manualCustomerPhone, setManualCustomerPhone] = useState('');
    const [manualCustomerEmail, setManualCustomerEmail] = useState('');
    const [showContactModal, setShowContactModal] = useState(false);
    const [tempContactData, setTempContactData] = useState({ phone: '', email: '' });
    const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);

    // --- State Visit Form ---
    const [visitType, setVisitType] = useState('visit');
    const [description, setDescription] = useState('');
    const [photo, setPhoto] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [isCompressing, setIsCompressing] = useState(false);

    // --- State Produk (Input) ---
    const [cart, setCart] = useState<CartItem[]>([]);
    const [tempProdId, setTempProdId] = useState<string>('');
    const [tempQty, setTempQty] = useState<number>(0);
    const [tempAction, setTempAction] = useState<string>('sold');
    const [searchQuery, setSearchQuery] = useState('');
    const [showResults, setShowResults] = useState(false);

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

    useEffect(() => {
        if (!photo) {
            setPhotoPreview(null);
            return;
        }

        const objectUrl = URL.createObjectURL(photo);
        setPhotoPreview(objectUrl);

        return () => URL.revokeObjectURL(objectUrl);
    }, [photo]);

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

    const getXsrfToken = () => decodeURIComponent(document.cookie.split('; ').find(row => row.startsWith('XSRF-TOKEN='))?.split('=')[1] || '');

    // --- Handlers ---
    const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsCompressing(true);
        try {
            const compressed = await imageCompression(file, { maxSizeMB: 0.6, maxWidthOrHeight: 1400, fileType: 'image/webp' });
            const finalFile = new File([compressed], `visit-${Date.now()}.webp`, { type: 'image/webp' });
            setPhoto(finalFile);
        } catch {
            showAlert(
                'Gagal Memproses Foto',
                'Terjadi kesalahan saat mengompresi foto. Silakan coba lagi dengan foto yang berbeda.',
                'error'
            );
        } finally { setIsCompressing(false); }
    };

    const addToCart = () => {
        if (!tempProdId) return;
        const selectedProduct = products.find(p => p.id === Number(tempProdId));
        if (!selectedProduct) return;

        const existingIndex = cart.findIndex(c => c.product_id === Number(tempProdId) && c.action_type === tempAction);

        if (existingIndex >= 0) {
            const newCart = [...cart];
            newCart[existingIndex].quantity += tempQty;
            setCart(newCart);
        } else {
            setCart([...cart, {
                product_id: Number(tempProdId),
                quantity: tempQty,
                action_type: tempAction,
                product_name: selectedProduct.name
            }]);
        }
        setTempProdId('');
        setTempQty(1);
    };

    const removeFromCart = (index: number) => {
        setCart(cart.filter((_, i) => i !== index));
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

    const handleOpenVisitModal = async () => {
        setOpenVisit(true);
        setNearbyCustomers([]);
        setSelectedCustomerId(null);
        setCustomerMode('database');
        setIsLoadingCustomers(true);

        const pos = await getVerifiedLocation();

        if (!pos) {
            setCustomerMode('manual');
            setIsLoadingCustomers(false);
            return;
        }

        if (!navigator.geolocation) {
            showAlert(
                'Geolocation Tidak Didukung',
                'Browser ini tidak mendukung Geolocation.',
                'error'
            );
            setCustomerMode('manual');
            setIsLoadingCustomers(false);
            return;
        }

        try {
            const { latitude, longitude } = pos.coords;

            const res = await axios.post('/sales/utils/nearby-customers', {
                lat: latitude,
                lng: longitude
            });

            // Validasi response adalah array
            const customers = Array.isArray(res.data) ? res.data : res.data.data || [];

            setNearbyCustomers(customers);

            if (customers.length > 0) {
                setCustomerMode('database');
            } else {
                setCustomerMode('manual');
            }
        } catch (error: unknown) {
            console.error('❌ Error fetching nearby customers:', error);

            // Show error alert untuk debug
            if (error instanceof Error) {
                showAlert(
                    'Gagal Mengambil Lokasi Terdekat',
                    `Error: ${error.message || 'Tidak ada customer terdekat dalam radius 2km'}`,
                    'warning'
                );
            }

            setCustomerMode('manual');
        } finally {
            setIsLoadingCustomers(false);
        }
    };

    const submitVisitReport = async () => {
        if (!photo) {
            showAlert(
                'Foto Wajib Diunggah',
                'Silakan unggah foto bukti kehadiran terlebih dahulu.',
                'error'
            );
            return;
        }
        setProcessing(true);
        const pos = await getVerifiedLocation();

        if (!pos) {
            setProcessing(false);
            return;
        }

        const { latitude, longitude } = pos.coords;
        try {
            const geo = await fetch('/sales/utils/reverse-geocode', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-XSRF-TOKEN': getXsrfToken() },
                body: JSON.stringify({ lat: latitude, lng: longitude }),
            });
            const { address } = await geo.json();

            if (manualCustomerPhone) {
                const phoneRegex = /^628\d{8,11}$/;

                if (!phoneRegex.test(manualCustomerPhone)) {
                    showAlert(
                        'Nomor Telepon Tidak Valid',
                        'Nomor telepon harus diawali dengan "628" dan memiliki panjang 11-14 digit.',
                        'error'
                    );
                    setProcessing(false);
                    return;
                }
            }

            if (manualCustomerEmail) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

                if (!emailRegex.test(manualCustomerEmail)) {
                    showAlert(
                        'Format Email Tidak Valid',
                        'Format email tidak valid! (contoh: example@gmail.com)',
                        'error'
                    );
                    setProcessing(false);
                    return;
                }
            }

            router.post('/sales/visits', {
                activity_type: visitType,
                description,
                lat: latitude,
                lng: longitude,
                photo,
                address: address ?? 'Lokasi tidak ditemukan',
                products: cart.map(item => ({
                    product_id: item.product_id,
                    quantity: item.quantity,
                    action_type: item.action_type
                })),
                customer_mode: customerMode,
                customer_id: selectedCustomerId,
                customer_name: manualCustomerName,
                customer_note: manualCustomerNote,
                customer_phone: manualCustomerPhone,
                customer_email: manualCustomerEmail,
            }, {
                forceFormData: true,
                onSuccess: () => {
                    setOpenVisit(false);
                    setDescription('');
                    setPhoto(null);
                    setVisitType('visit');
                    setCart([]);
                    setTempProdId('');
                    setTempQty(1);
                },
                onFinish: () => setProcessing(false),
            });
        } catch {
            setProcessing(false);
            showAlert(
                'Gagal Mengambil Lokasi',
                'Terjadi kesalahan saat mengambil data lokasi. Pastikan koneksi internet stabil dan coba lagi.',
                'error'
            );
        }

    };

    const handleSelectCustomer = (cust: Customer) => {
        setSelectedCustomerId(cust.id);

        if (!cust.phone || !cust.email) {
            setTempContactData({
                phone: cust.phone || '',
                email: cust.email || ''
            });
            setShowContactModal(true);
        }
    };

    const handleSaveContactUpdate = () => {
        const { phone, email } = tempContactData;

        if (phone) {
            const phoneRegex = /^628\d{8,11}$/;

            if (!phoneRegex.test(phone)) {
                showAlert(
                    'Nomor Telepon Tidak Valid',
                    'Nomor telepon harus diawali dengan "628" dan memiliki panjang 11-14 digit.',
                    'error'
                );
                return;
            }
        }

        if (email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (!emailRegex.test(email)) {
                showAlert(
                    'Format Email Tidak Valid',
                    'Format email tidak valid! (contoh: example@gmail.com)',
                    'error'
                );
                return;
            }
        }

        router.patch(`/sales/customers/${selectedCustomerId}/update-contact`, {
            phone: phone,
            email: email,
        }, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                setNearbyCustomers(prev => prev.map(cust =>
                    cust.id === selectedCustomerId
                        ? { ...cust, phone: phone, email: email }
                        : cust
                ));

                setShowContactModal(false);
            },
            onError: () => {
                showAlert(
                    'Gagal Menyimpan Data',
                    'Terjadi kesalahan saat menyimpan data kontak. Pastikan koneksi internet stabil dan coba lagi.',
                    'error'
                );
            }
        });
    };

    const isCheckedIn = !!attendanceToday;
    const isCheckedOut = isCheckedIn && !!attendanceToday.check_out_at;

    const isDatabaseSelected =
        customerMode === 'database' && !!selectedCustomerId;

    const isManualComplete =
        customerMode === 'manual' &&
        manualCustomerName.trim() &&
        manualCustomerNote.trim();

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Home', href: `/${user.name.toLowerCase()}/dashboard` },
        { title: 'Visit Record', href: `/${user.name.toLowerCase()}/visit-record` }
    ];

    return (
        <AppLayoutMobile breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="min-h-screen bg-blue-50/20 dark:bg-blue-950/10 pb-16 pt-8 px-5 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-7xl space-y-10">
                    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="w-full mx-auto mb-8 px-2 md:px-4">

                        {/* HEADER & POWER CARD (SAMA SEPERTI SEBELUMNYA) */}
                        <div className="flex items-center justify-between mb-6 group">
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <div className="h-12 w-12 md:h-14 md:w-14 rounded-2xl bg-linear-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold text-xl shadow-lg rotate-3">U</div>
                                    <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full"></div>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 dark:text-white">Halo, {user.name}</h1>
                                        <span className="text-xl animate-bounce">👋</span>
                                    </div>
                                    <p className="text-[11px] md:text-xs font-bold uppercase tracking-[0.15em] text-blue-600 dark:text-blue-400 opacity-80">{formatDateLong(currentTime)}</p>
                                </div>
                            </div>
                            <div className="text-right bg-blue-50 dark:bg-blue-900/30 backdrop-blur-md px-4 py-2 rounded-2xl border border-blue-200 dark:border-blue-700 shadow-inner">
                                <p className="text-[10px] font-bold text-blue-500 dark:text-blue-300 uppercase tracking-widest mb-0.5">Waktu Server</p>
                                <p className="text-sm md:text-base font-mono font-black text-blue-700 dark:text-blue-200 leading-none">{formatTimeWithSeconds(currentTime)}</p>
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

                            <button
                                onClick={handleOpenVisitModal}
                                disabled={!isCheckedIn || processing || isCheckedOut}
                                className={`flex w-full items-center justify-center gap-3 rounded-2xl py-4.5 text-base font-black transition-all active:scale-[0.97] h-16 ${(!isCheckedIn || isCheckedOut)
                                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                                    : 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 border-2 border-blue-600 dark:border-blue-500 shadow-xl hover:shadow-2xl hover:border-blue-500/80 dark:hover:border-blue-400/80'
                                    }`}
                            >
                                <Plus size={22} strokeWidth={3} />
                                <span>TAMBAH LAPORAN KUNJUNGAN</span>
                            </button>
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
            {openVisit && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setOpenVisit(false)}
                        className="absolute inset-0 bg-linear-to-b from-zinc-950/70 via-zinc-950/60 to-zinc-950/40 backdrop-blur-xl"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.94, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.94, y: 30 }}
                        className="relative w-full max-w-lg bg-white dark:bg-zinc-950 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-zinc-200/50 dark:border-zinc-800/50"
                    >
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-zinc-200/80 dark:border-zinc-800/60 flex items-center justify-center sticky top-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl z-20 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="rounded-lg bg-linear-to-br from-blue-600 to-indigo-600 p-2.5 text-white shadow-sm">
                                    <CalendarDays size={20} strokeWidth={2.2} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 tracking-tight leading-tight">
                                        Tambah Laporan Kunjungan
                                    </h3>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                                        Catat aktivitas kunjungan harian
                                    </p>
                                </div>

                                <button
                                    onClick={() => setOpenVisit(false)}
                                    className="absolute right-4 p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/70 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
                                    aria-label="Tutup"
                                >
                                    <X size={20} strokeWidth={2.5} />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-7 overflow-y-auto thin-scrollbar">
                            {/* 0. Customer Mode */}
                            <div className="space-y-3 relative">
                                {/* --- MODAL POPUP (Untuk Database yg kurang data) --- */}
                                {showContactModal && (
                                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
                                        <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-700 p-5 space-y-4">
                                            <div className="text-center">
                                                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                                                    <PenLine size={20} />
                                                </div>
                                                <h3 className="font-bold text-lg text-zinc-800 dark:text-zinc-100">Lengkapi Data?</h3>
                                                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                                                    Data pelanggan ini belum memiliki Telepon atau Email. Mau dilengkapi sekarang? (Tidak wajib).
                                                </p>
                                            </div>

                                            <div className="space-y-3">
                                                <div>
                                                    <label className="text-xs font-semibold text-zinc-600 ml-1">Nomor Telepon</label>
                                                    <input
                                                        type="phone"
                                                        value={tempContactData.phone}
                                                        onChange={(e) => setTempContactData({ ...tempContactData, phone: e.target.value })}
                                                        placeholder="628xxxxxxxx"
                                                        className="w-full mt-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-semibold text-zinc-600 ml-1">Email</label>
                                                    <input
                                                        type="email"
                                                        value={tempContactData.email}
                                                        onChange={(e) => setTempContactData({ ...tempContactData, email: e.target.value })}
                                                        placeholder="example@gmail.com"
                                                        className="w-full mt-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex gap-2 pt-2">
                                                <button
                                                    onClick={() => setShowContactModal(false)}
                                                    className="flex-1 py-2.5 text-xs font-bold text-zinc-500 bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-400 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                                                >
                                                    Nanti Saja
                                                </button>
                                                <button
                                                    onClick={handleSaveContactUpdate}
                                                    className="flex-1 py-2.5 text-xs font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-md shadow-blue-200 dark:shadow-none transition-colors"
                                                >
                                                    Simpan Data
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex justify-between">
                                    <span>Pelanggan / Toko</span>
                                    {isLoadingCustomers && <span className="text-xs text-blue-500 animate-pulse">Mencari di sekitar...</span>}
                                </label>

                                {/* Toggle Mode */}
                                <div className="bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl flex">
                                    <button
                                        onClick={() => setCustomerMode('database')}
                                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${customerMode === 'database'
                                            ? 'bg-white dark:bg-zinc-800 text-blue-600 shadow-sm'
                                            : 'text-zinc-400 hover:text-zinc-600'}`}
                                    >
                                        <Store size={14} /> Toko Terdekat
                                    </button>
                                    <button
                                        onClick={() => setCustomerMode('manual')}
                                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${customerMode === 'manual'
                                            ? 'bg-white dark:bg-zinc-800 text-orange-600 shadow-sm'
                                            : 'text-zinc-400 hover:text-zinc-600'}`}
                                    >
                                        <User size={14} /> Input Manual
                                    </button>
                                </div>

                                {/* Content Mode Database */}
                                {customerMode === 'database' && (
                                    <div className="space-y-2.5">
                                        {isLoadingCustomers ? (
                                            <div className="py-8 text-center text-zinc-400 text-xs">
                                                <Loader2 className="animate-spin mx-auto mb-2" size={20} />
                                                Sedang memindai lokasi...
                                            </div>
                                        ) : nearbyCustomers.length > 0 ? (
                                            <div className="grid grid-cols-1 gap-2.5 max-h-64 overflow-y-auto pr-1 thin-scrollbar">
                                                {nearbyCustomers.map((cust) => (
                                                    <button
                                                        key={cust.id}
                                                        onClick={() => handleSelectCustomer(cust)}
                                                        className={`text-left p-3.5 rounded-xl border transition-all flex items-start gap-3.5 group
                                                                    ${selectedCustomerId === cust.id
                                                                ? 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-500/60 ring-1 ring-blue-500/40 shadow-sm'
                                                                : 'bg-white dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800 hover:border-blue-300/50 hover:shadow-sm'}`}
                                                    >
                                                        {/* Kolom kiri: Logo + Jarak */}
                                                        <div className="flex flex-col items-center shrink-0">
                                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors
                                                                        ${selectedCustomerId === cust.id
                                                                    ? 'bg-blue-600 text-white shadow-md'
                                                                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 group-hover:bg-zinc-200 dark:group-hover:bg-zinc-700'}`}>
                                                                <Store size={20} strokeWidth={2} />
                                                            </div>
                                                            <span className="mt-1.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-emerald-100/90 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 shadow-xs whitespace-nowrap">
                                                                {cust.distance ? `${Number(cust.distance).toFixed(2)} km` : 'Dekat'}
                                                            </span>
                                                        </div>

                                                        {/* Kolom kanan: Info detail */}
                                                        <div className="flex-1 min-w-0">
                                                            <p className={`text-sm font-semibold tracking-tight leading-tight
                                                                    ${selectedCustomerId === cust.id ? 'text-blue-700 dark:text-blue-300' : 'text-zinc-800 dark:text-zinc-200'}`}>
                                                                {cust.name}
                                                            </p>
                                                            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1">
                                                                {cust.address}
                                                            </p>

                                                            <div className="mt-2 space-y-1.5 text-xs">
                                                                {cust.phone && (
                                                                    <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                                                                        <Phone size={13} className="text-zinc-400 shrink-0" />
                                                                        <span className="truncate">{cust.phone}</span>
                                                                    </div>
                                                                )}
                                                                {cust.email && (
                                                                    <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                                                                        <Mail size={13} className="text-zinc-400 shrink-0" />
                                                                        <span className="truncate">{cust.email}</span>
                                                                    </div>
                                                                )}
                                                                {cust.notes && (
                                                                    <div className="flex items-start gap-2 text-zinc-500 dark:text-zinc-500">
                                                                        <StickyNote size={13} className="mt-0.5 text-zinc-400 shrink-0" />
                                                                        <p className="line-clamp-2 leading-tight flex-1">{cust.notes}</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {selectedCustomerId === cust.id && (
                                                            <div className="self-center pl-2">
                                                                <CheckCircle2 size={18} className="text-blue-600" strokeWidth={2.5} />
                                                            </div>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="p-5 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/30 text-center">
                                                <Store className="mx-auto mb-2 text-zinc-400" size={28} />
                                                <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium mb-2">
                                                    Tidak ada toko terdaftar dalam radius 2 KM.
                                                </p>
                                                <button
                                                    onClick={() => setCustomerMode('manual')}
                                                    className="text-sm text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                                                >
                                                    Input Manual Saja →
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Content Mode Manual */}
                                {customerMode === 'manual' && (
                                    <div className="space-y-3 p-4 bg-orange-50 dark:bg-orange-900/10 rounded-2xl border border-orange-100 dark:border-orange-900/30">
                                        {/* Input Nama */}
                                        <div className="relative">
                                            <User className="absolute left-3 top-3.5 text-zinc-400" size={18} />
                                            <input
                                                type="text"
                                                value={manualCustomerName}
                                                onChange={(e) => setManualCustomerName(e.target.value)}
                                                placeholder="Nama Pelanggan / Toko Baru..."
                                                className="w-full pl-10 pr-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm outline-none font-bold text-zinc-800 dark:text-zinc-200"
                                            />
                                        </div>

                                        <div className="relative">
                                            <PenLine className="absolute left-3 top-3.5 text-zinc-400" size={18} />
                                            <input
                                                type="text"
                                                value={manualCustomerNote}
                                                onChange={(e) => setManualCustomerNote(e.target.value)}
                                                placeholder="Catatan Toko (Cth: Pagar Hitam, Galak, dll)"
                                                className="w-full pl-10 pr-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm outline-none text-zinc-600 dark:text-zinc-400"
                                            />
                                        </div>

                                        <div className="relative">
                                            <Phone className="absolute left-3 top-3.5 text-zinc-400" size={16} />
                                            <input
                                                type="phone"
                                                value={manualCustomerPhone}
                                                onChange={(e) => setManualCustomerPhone(e.target.value)}
                                                placeholder="No. HP (Opsional)"
                                                className="w-full pl-9 pr-3 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-xs outline-none text-zinc-600 dark:text-zinc-400"
                                            />
                                        </div>

                                        <div className="relative">
                                            <Mail className="absolute left-3 top-3.5 text-zinc-400" size={16} />
                                            <input
                                                type="email"
                                                value={manualCustomerEmail}
                                                onChange={(e) => setManualCustomerEmail(e.target.value)}
                                                placeholder="Email (Opsional)"
                                                className="w-full pl-9 pr-3 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-xs outline-none text-zinc-600 dark:text-zinc-400"
                                            />
                                        </div>

                                    </div>
                                )}

                                {isDatabaseSelected && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800"
                                    >
                                        <CheckCircle2 size={16} className="text-blue-600 dark:text-blue-400 shrink-0" />
                                        <span className="text-xs font-bold text-blue-700 dark:text-blue-300">
                                            PELANGGAN TERPILIH
                                        </span>
                                    </motion.div>
                                )}

                                {isManualComplete && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="flex items-center gap-2 px-3 py-2 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-800"
                                    >
                                        <CheckCircle2 size={16} className="text-orange-600 dark:text-orange-400 shrink-0" />
                                        <span className="text-xs font-bold text-orange-700 dark:text-orange-300">
                                            DATA PELANGGAN LENGKAP
                                        </span>
                                    </motion.div>
                                )}
                            </div>

                            {!isDatabaseSelected && !isManualComplete && (
                                <div className="relative flex flex-col items-center justify-center py-2 overflow-hidden">
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <div className="w-40 h-40 bg-orange-500/10 blur-[80px] rounded-full" />
                                    </div>

                                    <div className="relative flex flex-col items-center justify-center w-full">
                                        <div className="flex items-center gap-3 justify-center">
                                            <div className="h-px w-8 bg-linear-to-r from-transparent to-orange-500/50" />
                                            <span className="text-[10px] font-black text-orange-500 tracking-[0.3em] uppercase whitespace-nowrap">
                                                Pilih / Masukan Data Pelanggan
                                            </span>
                                            <div className="h-px w-8 bg-linear-to-l from-transparent to-orange-500/50" />
                                        </div>
                                    </div>
                                </div>
                            )}


                            {(isDatabaseSelected || isManualComplete) && (
                                <>
                                    <div className="space-y-3">
                                        <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Jenis Aktivitas</label>
                                        <div className="grid grid-cols-2 gap-2.5">
                                            {[
                                                { id: 'visit', label: 'Kunjungan' },
                                                { id: 'canvassing', label: 'Kanvasing' },
                                                { id: 'collection', label: 'Penagihan' },
                                                { id: 'delivery', label: 'Pengiriman' },
                                            ].map((item) => (
                                                <button
                                                    key={item.id}
                                                    onClick={() => setVisitType(item.id)}
                                                    className={`py-3 px-4 rounded-2xl text-sm font-medium transition-all duration-200 border ${visitType === item.id
                                                        ? 'bg-linear-to-br from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-700/20 border-transparent'
                                                        : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                                                        }`}
                                                >
                                                    {item.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-2.5">
                                        <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Catatan Kunjungan</label>
                                        <div className="relative">
                                            <textarea
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}
                                                rows={3}
                                                className="w-full pl-4 pr-4 py-3 bg-zinc-50/70 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-700 rounded-2xl focus:outline-none focus:border-blue-500 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 shadow-inner"
                                                placeholder="Tulis hasil kunjungan di sini..."
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2.5">
                                        <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Foto Bukti Kunjungan</label>
                                        <label className="block relative cursor-pointer group">
                                            <input type="file" accept="image/*" capture="environment" onChange={handlePhotoChange} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                                            <div className={`border-2 border-dashed rounded-2xl h-52 flex items-center justify-center transition-all overflow-hidden ${photo ? 'border-blue-400 bg-blue-50/20' : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/50'}`}>
                                                {photo ? (
                                                    <div className="relative w-full h-full">
                                                        <img src={photoPreview ?? undefined} className="w-full h-full object-cover" alt="Preview" />                                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <span className="text-white text-xs font-bold bg-black/50 px-4 py-2 rounded-full backdrop-blur-md">GANTI FOTO</span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="text-center">
                                                        <Camera size={32} className="mx-auto mb-2 text-zinc-400" />
                                                        <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Ambil Foto</p>
                                                    </div>
                                                )}
                                            </div>
                                        </label>
                                    </div>

                                    {photo ? (
                                        <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                                            <div className="flex items-center gap-2">
                                                <Package size={18} className="text-orange-500" />
                                                <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 uppercase tracking-wider">Aksi Produk</h4>
                                            </div>

                                            <div className="space-y-2 relative">
                                                <label className="text-xs font-bold text-zinc-400 px-1 uppercase tracking-tight">Cari Produk</label>
                                                <div className="space-y-2">
                                                    <div className="relative">
                                                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                                                        <input
                                                            type="text"
                                                            placeholder="Ketik nama atau SKU produk..."
                                                            value={searchQuery}
                                                            onChange={(e) => {
                                                                setSearchQuery(e.target.value);
                                                                setShowResults(true);
                                                            }}
                                                            onFocus={() => setShowResults(true)}
                                                            className="w-full h-12 pl-12 pr-4 bg-zinc-100 dark:bg-zinc-900 border-none rounded-2xl text-sm font-semibold focus:ring-2 focus:ring-orange-500 transition-all"
                                                        />
                                                    </div>

                                                    {tempProdId && !showResults && (
                                                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-2xl border-2 border-orange-300 dark:border-orange-700">
                                                            {(() => {
                                                                const selected = products.find(p => p.id === Number(tempProdId));
                                                                return (
                                                                    <>
                                                                        <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 shadow-md border-2 border-orange-200 dark:border-orange-800">
                                                                            {selected?.file_path ? (
                                                                                <button
                                                                                    onClick={() => {
                                                                                        setIsPreviewOpen(true);
                                                                                        setPreviewUrl(`/storage/${selected.file_path}`);
                                                                                    }}
                                                                                    className="w-full h-full block cursor-pointer group"
                                                                                >
                                                                                    <img src={`/storage/${selected.file_path}`} alt={selected.name} className="w-full h-full object-cover group-hover:brightness-110 transition-all" />
                                                                                </button>
                                                                            ) : (
                                                                                <div className="w-full h-full flex items-center justify-center bg-zinc-200 dark:bg-zinc-700"><ImageIcon size={24} className="text-zinc-400" /></div>
                                                                            )}
                                                                        </div>
                                                                        <div className="flex-1 min-w-0">
                                                                            <p className="text-sm font-bold text-orange-900 dark:text-orange-100 truncate">{selected?.name}</p>
                                                                            <p className="text-xs text-orange-700 dark:text-orange-300 font-mono">{selected?.sku}</p>
                                                                        </div>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                setTempProdId('');
                                                                                setSearchQuery('');
                                                                            }}
                                                                            className="p-1.5 rounded-lg hover:bg-orange-200 dark:hover:bg-orange-900/40 transition-colors text-orange-600"
                                                                        >
                                                                            <X size={18} />
                                                                        </button>
                                                                    </>
                                                                );
                                                            })()}
                                                        </motion.div>
                                                    )}
                                                </div>

                                                <AnimatePresence>
                                                    {showResults && searchQuery.length > 0 && (
                                                        <motion.div
                                                            initial={{ opacity: 0, y: -10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            exit={{ opacity: 0 }}
                                                            className="absolute z-50 w-full mt-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl max-h-60 overflow-y-auto p-2 thin-scrollbar"
                                                        >
                                                            {products
                                                                .filter(p =>
                                                                    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                                    p.sku.toLowerCase().includes(searchQuery.toLowerCase())
                                                                )
                                                                .map(p => (
                                                                    <button
                                                                        key={p.id}
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setTempProdId(String(p.id));
                                                                            setSearchQuery(p.name);
                                                                            setShowResults(false);
                                                                        }}
                                                                        className="w-full flex items-center gap-3 p-2 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-xl transition-colors text-left group"
                                                                    >
                                                                        <div className="w-12 h-12 rounded-lg bg-zinc-100 dark:bg-zinc-800 overflow-hidden shrink-0 border border-zinc-200 dark:border-zinc-700">
                                                                            {p.file_path ? (
                                                                                <button
                                                                                    onClick={() => {
                                                                                        setIsPreviewOpen(true);
                                                                                        setPreviewUrl(`/storage/${p.file_path}`);
                                                                                    }}
                                                                                    className="w-full h-full block cursor-pointer group"
                                                                                >
                                                                                    <img src={`/storage/${p.file_path}`} alt={p.name} className="w-full h-full object-cover group-hover:brightness-110 transition-all" />
                                                                                </button>
                                                                            ) : (
                                                                                <div className="w-full h-full flex items-center justify-center"><ImageIcon size={20} className="text-zinc-400" /></div>
                                                                            )}
                                                                        </div>
                                                                        <div className="flex-1 min-w-0">
                                                                            <p className="text-sm font-bold truncate dark:text-zinc-100 group-hover:text-orange-600 transition-colors">{p.name}</p>
                                                                            <p className="text-[10px] text-zinc-500 font-mono tracking-tighter uppercase">{p.sku}</p>
                                                                        </div>
                                                                        <Plus size={16} className="text-zinc-300 group-hover:text-orange-500" />
                                                                    </button>
                                                                ))}

                                                            {products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                                                                <div className="p-4 text-center text-zinc-500 text-xs italic">Produk tidak ditemukan...</div>
                                                            )}
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>

                                                {tempProdId && !showResults && (
                                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 px-2 py-1">
                                                        <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                                                        <span className="text-[11px] font-bold text-orange-600/70 dark:text-orange-400">PRODUK TERPILIH</span>
                                                    </motion.div>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-2 gap-2">
                                                {[
                                                    { id: 'sold', label: 'Terjual' },
                                                    { id: 'offered', label: 'Ditawarkan' },
                                                    { id: 'sample', label: 'Sample' },
                                                    { id: 'returned', label: 'Retur' },
                                                ].map((action) => (
                                                    <button
                                                        key={action.id}
                                                        type="button"
                                                        onClick={() => setTempAction(action.id)}
                                                        className={`py-3.5 rounded-2xl text-[13px] font-bold border-2 transition-all duration-200 ${tempAction === action.id
                                                            ? 'bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/20'
                                                            : 'bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 text-zinc-500'
                                                            }`}
                                                    >
                                                        {action.label}
                                                    </button>
                                                ))}
                                            </div>

                                            <div className="space-y-3">
                                                <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                                                    {[1, 5, 10, 25, 50, 100].map((num) => (
                                                        <button
                                                            key={num}
                                                            type="button"
                                                            onClick={() => setTempQty(prev => (Number(prev) || 0) + num)}
                                                            className="flex-none px-4 py-2 rounded-xl text-xs font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-transparent hover:border-orange-500 hover:text-orange-600 transition-all"
                                                        >
                                                            +{num}
                                                        </button>
                                                    ))}
                                                    <button
                                                        type="button"
                                                        onClick={() => setTempQty(0)}
                                                        className="flex-none px-4 py-2 rounded-xl text-xs font-bold bg-red-50 dark:bg-red-900/20 text-red-500"
                                                    >
                                                        Reset
                                                    </button>
                                                </div>

                                                <div className="flex gap-2">
                                                    <div className="relative flex-1">
                                                        <input
                                                            type="number"
                                                            placeholder="0"
                                                            value={tempQty || ''}
                                                            onChange={(e) => setTempQty(Number(e.target.value))}
                                                            className="w-full h-14 bg-zinc-100 dark:bg-zinc-900 border-none rounded-2xl text-center font-black text-lg focus:ring-2 focus:ring-orange-500"
                                                        />
                                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-zinc-400">UNIT</span>
                                                        {tempQty > 0 && (
                                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-orange-500 bg-orange-50 dark:bg-orange-900/30 px-2 py-1 rounded-lg">
                                                                Total
                                                            </div>
                                                        )}
                                                    </div>

                                                    <button
                                                        onClick={() => {
                                                            addToCart();
                                                            setSearchQuery('');
                                                            setTempQty(0);
                                                        }}
                                                        disabled={!tempProdId || tempQty <= 0}
                                                        className="px-8 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-2xl font-black text-sm active:scale-95 transition-all shadow-lg shadow-blue-600/20"
                                                    >
                                                        TAMBAH
                                                    </button>
                                                </div>
                                            </div>

                                            {cart.length > 0 && (
                                                <div className="space-y-3 mt-4">
                                                    {cart.map((item, idx) => {
                                                        const cartProduct = products.find(p => p.id === item.product_id);
                                                        return (
                                                            <div key={idx} className="flex items-center gap-3 p-3 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
                                                                <div className="w-12 h-12 rounded-lg bg-zinc-100 dark:bg-zinc-800 overflow-hidden shrink-0 border border-zinc-200 dark:border-zinc-700">
                                                                    {cartProduct?.file_path ? (
                                                                        <img src={`/storage/${cartProduct.file_path}`} alt={item.product_name} className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        <div className="w-full h-full flex items-center justify-center"><ImageIcon size={20} className="text-zinc-400" /></div>
                                                                    )}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-xs font-bold truncate">{item.product_name}</p>
                                                                    <div className="flex gap-2 mt-0.5">
                                                                        <span className="text-[10px] font-black text-blue-600 uppercase">{item.quantity} UNIT</span>
                                                                        <span className="text-[10px] font-black text-zinc-400 uppercase italic">/ {item.action_type}</span>
                                                                    </div>
                                                                </div>
                                                                <button onClick={() => removeFromCart(idx)} className="p-2 text-red-500">
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="relative py-0 flex flex-col items-center justify-center overflow-hidden">
                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-orange-500/10 blur-[80px] rounded-full pointer-events-none" />

                                            <div className="relative flex flex-col items-center gap-4">
                                                <div className="flex items-center gap-3 w-full">
                                                    <div className="h-px w-8 bg-linear-to-r from-transparent to-orange-500/50" />
                                                    <span className="text-[10px] font-black text-orange-500 tracking-[0.3em] uppercase whitespace-nowrap">
                                                        Ambil foto terlebih dahulu
                                                    </span>
                                                    <div className="h-px w-8 bg-linear-to-l from-transparent to-orange-500/50" />
                                                </div>

                                            </div>
                                        </div>
                                    )}

                                </>
                            )}
                        </div>

                        {/* Semua data harus diisi sebelum mengirim laporan kunjungan. */}
                        {cart.length > 0 && (
                            <div className="p-6 border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950">
                                <button
                                    onClick={submitVisitReport}
                                    disabled={processing || isCompressing || !photo}
                                    className="w-full py-4 bg-linear-to-r from-blue-600 to-blue-700 text-white font-bold rounded-2xl shadow-xl shadow-blue-500/30 flex items-center justify-center gap-2 active:scale-95 transition-transform"
                                >
                                    {processing ? <Loader2 className="animate-spin" /> : 'KIRIM LAPORAN SEKARANG'}
                                    <ArrowRight size={20} />
                                </button>
                            </div>
                        )}
                    </motion.div>
                </div>
            )
            }

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

            {isPreviewOpen && selectedVisit && selectedVisit?.photos && selectedVisit.photos.length > 0 && (
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

        </AppLayoutMobile >
    );
}