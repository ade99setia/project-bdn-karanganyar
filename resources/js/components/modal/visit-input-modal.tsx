import { AnimatePresence, motion } from 'framer-motion';
import {
    ArrowRight,
    CalendarDays,
    Camera,
    CheckCircle2,
    Image as ImageIcon,
    Loader2,
    Mail,
    Package,
    PenLine,
    Phone,
    Plus,
    Search,
    StickyNote,
    Store,
    Trash2,
    User,
    X,
} from 'lucide-react';
import type { ChangeEvent, Dispatch, SetStateAction } from 'react';

interface Customer {
    id: number;
    name: string;
    address: string;
    distance?: number;
    phone?: string;
    email?: string;
    notes?: string;
}

interface Product {
    id: number;
    name: string;
    file_path?: string;
    sku: string;
}

interface CartItem {
    product_id: number;
    quantity: number;
    action_type: string;
    product_name?: string;
}

interface VisitInputModalProps {
    isOpen: boolean;
    onClose: () => void;
    isLoadingCustomers: boolean;
    customerMode: 'database' | 'manual';
    setCustomerMode: Dispatch<SetStateAction<'database' | 'manual'>>;
    nearbyCustomers: Customer[];
    selectedCustomerId: number | null;
    onSelectCustomer: (customer: Customer) => void;
    showContactModal: boolean;
    tempContactData: { phone: string; email: string };
    setTempContactData: Dispatch<SetStateAction<{ phone: string; email: string }>>;
    onCloseContactModal: () => void;
    onSaveContactUpdate: () => void;
    manualCustomerName: string;
    setManualCustomerName: Dispatch<SetStateAction<string>>;
    manualCustomerNote: string;
    setManualCustomerNote: Dispatch<SetStateAction<string>>;
    manualCustomerPhone: string;
    setManualCustomerPhone: Dispatch<SetStateAction<string>>;
    manualCustomerEmail: string;
    setManualCustomerEmail: Dispatch<SetStateAction<string>>;
    visitType: string;
    setVisitType: Dispatch<SetStateAction<string>>;
    description: string;
    setDescription: Dispatch<SetStateAction<string>>;
    onPhotoChange: (event: ChangeEvent<HTMLInputElement>) => void;
    photo: File | null;
    photoPreview: string | null;
    products: Product[];
    tempProdId: string;
    setTempProdId: Dispatch<SetStateAction<string>>;
    tempQty: number;
    setTempQty: Dispatch<SetStateAction<number>>;
    tempAction: string;
    setTempAction: Dispatch<SetStateAction<string>>;
    searchQuery: string;
    setSearchQuery: Dispatch<SetStateAction<string>>;
    showResults: boolean;
    setShowResults: Dispatch<SetStateAction<boolean>>;
    addToCart: () => void;
    cart: CartItem[];
    removeFromCart: (index: number) => void;
    processing: boolean;
    isCompressing: boolean;
    onSubmit: () => void;
    onPreviewImage: (url: string) => void;
}

export default function VisitInputModal({
    isOpen,
    onClose,
    isLoadingCustomers,
    customerMode,
    setCustomerMode,
    nearbyCustomers,
    selectedCustomerId,
    onSelectCustomer,
    showContactModal,
    tempContactData,
    setTempContactData,
    onCloseContactModal,
    onSaveContactUpdate,
    manualCustomerName,
    setManualCustomerName,
    manualCustomerNote,
    setManualCustomerNote,
    manualCustomerPhone,
    setManualCustomerPhone,
    manualCustomerEmail,
    setManualCustomerEmail,
    visitType,
    setVisitType,
    description,
    setDescription,
    onPhotoChange,
    photo,
    photoPreview,
    products,
    tempProdId,
    setTempProdId,
    tempQty,
    setTempQty,
    tempAction,
    setTempAction,
    searchQuery,
    setSearchQuery,
    showResults,
    setShowResults,
    addToCart,
    cart,
    removeFromCart,
    processing,
    isCompressing,
    onSubmit,
    onPreviewImage,
}: VisitInputModalProps) {
    if (!isOpen) return null;

    const isDatabaseSelected = customerMode === 'database' && !!selectedCustomerId;
    const isManualComplete = customerMode === 'manual' && manualCustomerName.trim() && manualCustomerNote.trim();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-linear-to-b from-zinc-950/70 via-zinc-950/60 to-zinc-950/40 backdrop-blur-xl"
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.94, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: 30 }}
                className="relative w-full max-w-lg bg-white dark:bg-zinc-950 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-zinc-200/50 dark:border-zinc-800/50"
            >
                <div className="px-6 py-4 border-b border-zinc-200/80 dark:border-zinc-800/60 flex items-center justify-between sticky top-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl z-20 shadow-sm">
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
                    </div>

                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/70 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors shrink-0 ml-4"
                        aria-label="Tutup"
                    >
                        <X size={20} strokeWidth={2.5} />
                    </button>
                </div>

                <div className="p-6 space-y-7 overflow-y-auto thin-scrollbar">
                    <div className="space-y-3 relative">
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
                                            onClick={onCloseContactModal}
                                            className="flex-1 py-2.5 text-xs font-bold text-zinc-500 bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-400 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                                        >
                                            Nanti Saja
                                        </button>
                                        <button
                                            onClick={onSaveContactUpdate}
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
                                                onClick={() => onSelectCustomer(cust)}
                                                className={`text-left p-3.5 rounded-xl border transition-all flex items-start gap-3.5 group
                                                                    ${selectedCustomerId === cust.id
                                                        ? 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-500/60 ring-1 ring-blue-500/40 shadow-sm'
                                                        : 'bg-white dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800 hover:border-blue-300/50 hover:shadow-sm'}`}
                                            >
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
                                                                <Phone size={13} className="text-zinc-400 shrink-0 mt-0.5" />
                                                                <span className="truncate">{cust.phone}</span>
                                                            </div>
                                                        )}
                                                        {cust.email && (
                                                            <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                                                                <Mail size={13} className="text-zinc-400 shrink-0 mt-0.5" />
                                                                <span className="truncate">{cust.email}</span>
                                                            </div>
                                                        )}
                                                        {cust.notes && (
                                                            <div className="flex items-start gap-2 text-zinc-500 dark:text-zinc-400">
                                                                <StickyNote size={13} className="text-zinc-400 shrink-0" />
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

                        {customerMode === 'manual' && (
                            <div className="space-y-3 p-4 bg-orange-50 dark:bg-orange-900/10 rounded-2xl border border-orange-100 dark:border-orange-900/30">
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
                                    <input type="file" accept="image/*" capture="environment" onChange={onPhotoChange} disabled={isCompressing} className="absolute inset-0 opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed" />
                                    <div className={`border-2 border-dashed rounded-2xl h-52 flex items-center justify-center transition-all overflow-hidden ${photo ? 'border-blue-400 bg-blue-50/20' : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/50'}`}>
                                        {photo ? (
                                            <div className="relative w-full h-full">
                                                <img src={photoPreview ?? undefined} className="w-full h-full object-cover" alt="Preview" />
                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <span className="text-white text-xs font-bold bg-black/50 px-4 py-2 rounded-full backdrop-blur-md">GANTI FOTO</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center">
                                                <Camera size={32} className="mx-auto mb-2 text-zinc-400" />
                                                <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Ambil Foto</p>
                                            </div>
                                        )}

                                        {isCompressing && (
                                            <div className="absolute inset-0 z-20 bg-zinc-950/60 backdrop-blur-[1px] flex flex-col items-center justify-center gap-2 text-white">
                                                <Loader2 size={26} className="animate-spin" />
                                                <p className="text-xs font-bold uppercase tracking-widest">Sedang convert foto...</p>
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
                                                                            onClick={() => onPreviewImage(`/storage/${selected.file_path}`)}
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
                                                                        <div
                                                                            role="button"
                                                                            tabIndex={0}
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                onPreviewImage(`/storage/${p.file_path}`);
                                                                            }}
                                                                            className="w-full h-full block cursor-pointer group"
                                                                        >
                                                                            <img src={`/storage/${p.file_path}`} alt={p.name} className="w-full h-full object-cover group-hover:brightness-110 transition-all" />
                                                                        </div>
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

                {cart.length > 0 && (
                    <div className="p-6 border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950">
                        <button
                            onClick={onSubmit}
                            disabled={processing || isCompressing || !photo}
                            className="w-full py-4 bg-linear-to-r from-blue-600 to-blue-700 text-white font-bold rounded-2xl shadow-xl shadow-blue-500/30 flex items-center justify-center gap-2 active:scale-95 transition-transform"
                        >
                            {processing || isCompressing ? <Loader2 className="animate-spin" /> : 'KIRIM LAPORAN SEKARANG'}
                            {isCompressing && !processing ? 'MENUNGGU CONVERT FOTO...' : null}
                            <ArrowRight size={20} />
                        </button>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
