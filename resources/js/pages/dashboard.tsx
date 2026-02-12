import { Head, router } from '@inertiajs/react';
import axios from 'axios';
import imageCompression from 'browser-image-compression';
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
    ArrowUpRight,
    ExternalLink,
    LogIn,
    ChevronLeft,
    CheckCircle2,
    FileText,
    Package,
    Trash2,
    ShoppingBag,
    Search,
    PenLine,
    CalendarDays,
    Phone,
    Mail,
    StickyNote
} from 'lucide-react';
import { useState, useEffect } from 'react';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
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
    visited_at?: string;
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
}

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Dashboard', href: dashboard().url }];

export default function Dashboard({ attendanceToday, recentVisits, user, serverTime, products = [] }: Props) {
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
        } catch { alert('Gagal memproses foto. Coba lagi.'); } finally { setIsCompressing(false); }
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

    const handleCheckInOut = (type: 'in' | 'out') => {
        setProcessing(true);
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const { latitude, longitude } = pos.coords;
                try {
                    const geo = await fetch('/utils/reverse-geocode', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'X-XSRF-TOKEN': getXsrfToken() },
                        body: JSON.stringify({ lat: latitude, lng: longitude }),
                    });
                    const { address } = await geo.json();
                    router.post(`/attendance/check-${type}`, {
                        lat: latitude, lng: longitude, device_id: 'web',
                        [`check_${type}_address`]: address ?? 'Lokasi tidak ditemukan',
                    }, { preserveScroll: true, onFinish: () => setProcessing(false) });
                } catch { setProcessing(false); alert('Gagal mengambil alamat lokasi'); }
            },
            () => { setProcessing(false); alert('Izin lokasi ditolak'); }
        );
    };

    const handleOpenVisitModal = () => {
        setOpenVisit(true);
        setNearbyCustomers([]);
        setSelectedCustomerId(null);
        setCustomerMode('database');
        setIsLoadingCustomers(true);

        if (!navigator.geolocation) {
            alert("Browser ini tidak mendukung Geolocation.");
            setCustomerMode('manual');
            setIsLoadingCustomers(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                try {
                    const { latitude, longitude, accuracy } = pos.coords;

                    console.log(`Lokasi didapat. Akurasi: ${accuracy} meter`);

                    const res = await axios.post('/utils/nearby-customers', {
                        lat: latitude,
                        lng: longitude
                    });
                    setNearbyCustomers(res.data);

                    if (res.data.length > 0) {
                        setCustomerMode('database');
                    } else {
                        setCustomerMode('manual');
                    }
                } catch (err) {
                    console.error("Gagal ambil customer", err);
                    setCustomerMode('manual');
                } finally {
                    setIsLoadingCustomers(false);
                }
            },

            (err) => {
                console.warn(`ERROR(${err.code}): ${err.message}`);
                setCustomerMode('manual');
                setIsLoadingCustomers(false);
            },

            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000
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
                        headers: { 'Content-Type': 'application/json', 'X-XSRF-TOKEN': getXsrfToken() },
                        body: JSON.stringify({ lat: latitude, lng: longitude }),
                    });
                    const { address } = await geo.json();

                    if (manualCustomerPhone) {
                        const phoneRegex = /^628\d{8,11}$/;

                        if (!phoneRegex.test(manualCustomerPhone)) {
                            alert('Nomor telepon tidak valid!\n- Harus diawali "628"\n- Panjang 11-14 digit\n- Hanya angka');
                            setProcessing(false);
                            return;
                        }
                    }

                    if (manualCustomerEmail) {
                        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

                        if (!emailRegex.test(manualCustomerEmail)) {
                            alert('Format email tidak valid! (contoh: example@gmail.com)');
                            setProcessing(false);
                            return;
                        }
                    }

                    router.post('/visits', {
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
                } catch { setProcessing(false); alert('Gagal mengambil alamat lokasi'); }
            },
            () => { setProcessing(false); alert('Izin lokasi ditolak'); }
        );
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
                alert('Nomor telepon tidak valid!\n- Harus diawali "628"\n- Panjang 11-14 digit\n- Hanya angka');
                return;
            }
        }

        if (email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (!emailRegex.test(email)) {
                alert('Format email tidak valid! (contoh: example@gmail.com)');
                return;
            }
        }

        router.patch(`/customers/${selectedCustomerId}/update-contact`, {
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
            onError: (errors) => {
                console.error(errors);
                alert('Gagal menyimpan data. Cek koneksi atau input Anda.');
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


    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard • Sales" />
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
                            {!isCheckedIn ? (
                                <button onClick={() => handleCheckInOut('in')} disabled={processing} className="flex w-full items-center justify-center gap-3 rounded-2xl bg-blue-600 py-4.5 text-lg font-black text-white shadow-xl h-16">{processing ? <Loader2 className="animate-spin" /> : <LogIn size={24} />}<span>MULAI PRESENSI</span></button>
                            ) : !isCheckedOut ? (
                                <button onClick={() => handleCheckInOut('out')} disabled={processing} className="flex w-full items-center justify-center gap-3 rounded-2xl bg-linear-to-r from-orange-500 to-red-600 py-4.5 text-lg font-black text-white h-16">{processing ? <Loader2 className="animate-spin" /> : <LogOut size={24} />}<span>SELESAIKAN KERJA</span></button>
                            ) : (
                                <div className="flex w-full items-center justify-center gap-3 rounded-2xl bg-emerald-500/10 py-4.5 text-emerald-600 font-black border-2 border-emerald-500/20 h-16"><CheckCircle2 size={24} />TUGAS SELESAI</div>
                            )}

                            <button onClick={handleOpenVisitModal} disabled={!isCheckedIn || processing || isCheckedOut} className={`flex w-full items-center justify-center gap-3 rounded-2xl py-4.5 text-base font-black transition-all active:scale-[0.97] h-16 ${(!isCheckedIn || isCheckedOut) ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed' : 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 border-2 border-blue-600 dark:border-blue-500 shadow-xl'}`}>
                                <Plus size={22} strokeWidth={3} /><span>TAMBAH LAPORAN KUNJUNGAN</span>
                            </button>
                        </div>
                    </motion.div>

                    {/* RIWAYAT LIST */}
                    {totalItems > 0 && (
                        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden mb-10">
                            <div className="px-6 py-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-linear-to-r from-blue-100 via-blue-50 to-blue-200 dark:from-blue-950 dark:via-blue-900 dark:to-blue-800">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-blue-100 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-800 rounded-2xl text-blue-700 dark:text-blue-300 shadow-sm"><History size={24} strokeWidth={2} /></div>
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight leading-none mb-1">Riwayat Aktivitas</h3>
                                        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Menampilkan data <span className="text-slate-900 dark:text-slate-200 font-bold">{startIndex + 1}-{Math.min(endIndex, totalItems)}</span> dari total <span className="text-slate-900 dark:text-slate-200 font-bold">{totalItems}</span></p>
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
                                                {visit.photos?.[0] ? (
                                                    <a
                                                        href={`/storage/${visit.photos[0].file_path}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="w-full h-full block group/image"
                                                    >
                                                        <img src={`/storage/${visit.photos[0].file_path}`} alt="Bukti" className={`w-full h-full object-cover transition-transform duration-500 ${isSelected ? 'scale-110' : 'group-hover/image:scale-110'}`} />
                                                    </a>
                                                ) : (
                                                    <div className={`absolute inset-0 flex items-center justify-center bg-white dark:bg-slate-800 transition-colors ${isSelected ? 'text-orange-500' : 'text-blue-200 group-hover:text-orange-300'}`}><ImageIcon size={18} /></div>
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
                                <div className="bg-slate-50/50 dark:bg-slate-900 px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
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
            <AnimatePresence>
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
                            <div className="px-6 py-4 border-b border-zinc-200/80 dark:border-zinc-800/60 flex items-center justify-between sticky top-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl z-20 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-lg bg-linear-to-br from-blue-600 to-indigo-600 p-2.5 text-white shadow-sm">
                                        <CalendarDays size={20} strokeWidth={2.2} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 tracking-tight leading-tight">
                                            Tambahk Laporan Kunjungan
                                        </h3>
                                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                                            Catat aktivitas kunjungan harian
                                        </p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setOpenVisit(false)}
                                    className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/70 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
                                    aria-label="Tutup"
                                >
                                    <X size={20} strokeWidth={2.5} />
                                </button>
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
                                                                                    <a href={`/storage/${selected.file_path}`} target="_blank" rel="noopener noreferrer" className="w-full h-full block cursor-pointer group">
                                                                                        <img src={`/storage/${selected.file_path}`} alt={selected.name} className="w-full h-full object-cover group-hover:brightness-110 transition-all" />
                                                                                    </a>
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
                                                                                    <a href={`/storage/${p.file_path}`} target="_blank" rel="noopener noreferrer" className="w-full h-full block cursor-pointer group">
                                                                                        <img src={`/storage/${p.file_path}`} alt={p.name} className="w-full h-full object-cover group-hover:brightness-110 transition-all" />
                                                                                    </a>
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
            </AnimatePresence >

            {/* --- MODAL DETAIL KUNJUNGAN (UPDATE: MENAMPILKAN PRODUK) --- */}
            <AnimatePresence>
                {
                    selectedVisit && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedVisit(null)} className="absolute inset-0 bg-zinc-900/70 backdrop-blur-sm" />
                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                                {/* Gambar Header */}
                                <div className="relative h-56 bg-zinc-100 dark:bg-zinc-800 group shrink-0">
                                    {selectedVisit.photos?.[0] ? (
                                        <>
                                            <img src={`/storage/${selectedVisit.photos[0].file_path}`} alt="Detail Kunjungan" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                            <div className="absolute inset-0 bg-linear-to-t from-blue-900/80 to-transparent pointer-events-none"></div>
                                            <a href={`/storage/${selectedVisit.photos[0].file_path}`} target="_blank" rel="noreferrer" className="absolute bottom-4 right-4 bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-full text-[11px] font-bold uppercase flex items-center gap-1.5 shadow-lg transition-transform hover:scale-105">Ukuran Penuh <ExternalLink size={12} /></a>
                                        </>
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-zinc-300"><ImageIcon size={48} /></div>
                                    )}
                                    <button onClick={() => setSelectedVisit(null)} className="absolute top-4 right-4 bg-black/20 hover:bg-black/40 text-white p-2 rounded-full backdrop-blur-md transition"><X size={20} /></button>

                                    <div className="absolute bottom-4 left-4 text-white">
                                        <span className="px-2.5 py-1 rounded-md bg-blue-900 backdrop-blur-md text-white border border-white/20 text-[10px] font-bold uppercase tracking-wider shadow-sm mb-1 inline-block">{selectedVisit.activity_type}</span>
                                        <p className="px-1 py-1 text-xs font-medium opacity-80">{formatTimeOnly(selectedVisit.visited_at)}</p>
                                    </div>
                                </div>

                                {/* Content Scrollable */}
                                <div className="p-6 overflow-y-auto thin-scrollbar">
                                    <div className="space-y-6">

                                        {/* --- 1. INFORMASI PELANGGAN (BARU) --- */}
                                        <div>
                                            <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                                <User size={12} /> Pelanggan
                                            </h4>
                                            <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/20">
                                                <div className="flex items-start gap-3">
                                                    {/* Icon Profile */}
                                                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-300 shrink-0">
                                                        <Store size={18} />
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        {/* Nama Pelanggan (Prioritas: Relasi Customer > Manual Input > Default) */}
                                                        <p className="text-base font-bold text-zinc-800 dark:text-zinc-100 truncate">
                                                            {selectedVisit.customer ? selectedVisit.customer.name : (selectedVisit.customer_name || 'Pelanggan Umum')}
                                                        </p>
                                                        <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider mb-2">
                                                            {selectedVisit.customer ? 'Terdaftar' : 'Tamu / Manual'}
                                                        </p>

                                                        {/* Kontak Info */}
                                                        <div className="space-y-1.5">
                                                            {/* Telepon / WA */}
                                                            {(selectedVisit.customer?.phone || selectedVisit.customer_phone) && (
                                                                <a
                                                                    href={`https://wa.me/${(selectedVisit.customer?.phone || selectedVisit.customer_phone)!.replace(/^0/, '62').replace(/\D/g, '')}`}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="flex items-center gap-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                                                                >
                                                                    <Phone size={12} />
                                                                    <span>{selectedVisit.customer?.phone || selectedVisit.customer_phone}</span>
                                                                </a>
                                                            )}

                                                            {/* Email */}
                                                            {(selectedVisit.customer?.email || selectedVisit.customer_email) && (
                                                                <div className="flex items-center gap-2 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                                                                    <Mail size={12} />
                                                                    <span className="truncate">{selectedVisit.customer?.email || selectedVisit.customer_email}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* 2. Catatan */}
                                        <div>
                                            <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><FileText size={12} /> Catatan Kunjungan</h4>
                                            <p className="text-zinc-800 dark:text-zinc-200 leading-relaxed bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl text-sm border border-zinc-100 dark:border-zinc-800">{selectedVisit.description || 'Tidak ada catatan yang ditambahkan.'}</p>
                                        </div>

                                        {/* 3. Produk */}
                                        {selectedVisit.products && selectedVisit.products.length > 0 && (
                                            <div>
                                                <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                                    <ShoppingBag size={12} /> Produk / Setoran
                                                </h4>
                                                <div className="space-y-2">
                                                    {selectedVisit.products.map((prod) => {
                                                        const masterProd = products.find(p => p.id === prod.id);
                                                        return (
                                                            <div key={prod.id} className="flex items-center justify-between p-3 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
                                                                <div className="flex items-center gap-3">
                                                                    {masterProd?.file_path ? (
                                                                        <a href={`/storage/${masterProd.file_path}`} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-md border border-zinc-200 dark:border-zinc-700 overflow-hidden block hover:opacity-80 transition-opacity">
                                                                            <img src={`/storage/${masterProd.file_path}`} alt={prod.name} className="w-full h-full object-cover" />
                                                                        </a>
                                                                    ) : (
                                                                        <div className="w-10 h-10 flex items-center justify-center rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-300">
                                                                            <ImageIcon size={18} />
                                                                        </div>
                                                                    )}
                                                                    <div>
                                                                        <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">{prod.name}</p>
                                                                        <p className="text-[10px] text-zinc-500 font-mono">{prod.sku}</p>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <span className="block text-sm font-black text-blue-600 dark:text-blue-400">{prod.pivot.quantity} Unit</span>
                                                                    <span className="block text-[10px] font-bold uppercase text-zinc-400 tracking-wide">{prod.pivot.action_type}</span>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {/* 4. Lokasi */}
                                        <div>
                                            <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><MapPin size={12} /> Lokasi Terdeteksi</h4>
                                            <div className="flex items-start gap-3 bg-orange-50 dark:bg-orange-900/10 p-4 rounded-2xl border border-orange-100 dark:border-orange-900/20">
                                                <MapPin className="text-orange-500 mt-0.5 shrink-0 drop-shadow-sm" size={18} />
                                                <div>
                                                    <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 leading-snug">{selectedVisit.address || `GPS: ${selectedVisit.lat?.toFixed(6)}, ${selectedVisit.lng?.toFixed(6)}`}</p>
                                                    {selectedVisit.lat && (
                                                        <a href={`https://www.google.com/maps?q=${selectedVisit.lat},${selectedVisit.lng}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 font-bold text-xs mt-2 hover:underline decoration-blue-300">Buka Google Maps <ArrowUpRight size={12} /></a>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )
                }
            </AnimatePresence >
        </AppLayout >
    );
}