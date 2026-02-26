import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, ExternalLink, ImageIcon, Store, Phone, Mail, 
    User, FileText, ShoppingBag, MapPin, ArrowUpRight 
} from 'lucide-react';

interface Photo {
    file_path: string;
}

interface Customer {
    name: string;
    phone?: string;
    email?: string;
}

interface ProductPivot {
    quantity: number;
    action_type: string;
    price?: number;
    value?: number;
}

interface Product {
    id: number;
    name: string;
    sku: string;
    file_path?: string;
    pivot: ProductPivot;
}

interface Visit {
    photos?: Photo[];
    activity_type: string;
    visited_at: string;
    customer?: Customer;
    customer_name?: string;
    customer_phone?: string;
    customer_email?: string;
    description?: string;
    products?: Product[];
    address?: string;
    lat?: number;
    lng?: number;
}

interface VisitDetailModalProps {
    visit: Visit;
    products: Product[];
    onClose: () => void;
    onPreviewImage: (url: string) => void;
    formatTime?: (date: string) => string;
}

const VisitDetailModal = ({ 
    visit,
    products, 
    onClose,
    onPreviewImage, 
    formatTime    
}: VisitDetailModalProps) => {
    const formatCurrency = (value: number) => new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(value);

    const isNegativeAction = (actionType: string) => actionType === 'retur' || actionType === 'returned';

    
    // Helper untuk mempersingkat pemanggilan preview image
    const handleImageClick = (filePath: string) => {
        if (filePath && onPreviewImage) {
            onPreviewImage(`/storage/${filePath}`);
        }
    };

    return (
        <AnimatePresence>
            {visit && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                    {/* Backdrop */}
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }} 
                        onClick={onClose} 
                        className="absolute inset-0 bg-zinc-900/70 backdrop-blur-sm" 
                    />

                    {/* Modal Container */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }} 
                        animate={{ opacity: 1, scale: 1 }} 
                        exit={{ opacity: 0, scale: 0.95 }} 
                        className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                    >

                        {/* --- HEADER GAMBAR UTAMA --- */}
                        <div className="relative h-56 bg-zinc-100 dark:bg-zinc-800 group shrink-0">
                            {visit.photos?.[0] ? (
                                <>
                                    <img 
                                        src={`/storage/${visit.photos[0].file_path}`} 
                                        alt="Detail Kunjungan" 
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                                    />
                                    <div className="absolute inset-0 bg-linear-to-t from-blue-900/80 to-transparent pointer-events-none"></div>
                                    
                                    <button
                                        onClick={() => handleImageClick(visit.photos?.[0]?.file_path || '')}
                                        className="absolute bottom-4 right-4 bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-full text-[11px] font-bold uppercase flex items-center gap-1.5 shadow-lg transition-transform hover:scale-105"
                                    >
                                        <ExternalLink size={12} /> Ukuran Penuh
                                    </button>
                                </>
                            ) : (
                                <div className="flex items-center justify-center h-full text-zinc-300">
                                    <ImageIcon size={48} />
                                </div>
                            )}
                            
                            {/* Tombol Close */}
                            <button onClick={onClose} className="absolute top-4 right-4 bg-black/20 hover:bg-black/40 text-white p-2 rounded-full backdrop-blur-md transition z-10">
                                <X size={20} />
                            </button>

                            {/* Info Singkat Header */}
                            <div className="absolute bottom-4 left-4 text-white">
                                <span className="px-2.5 py-1 rounded-md bg-blue-900 backdrop-blur-md text-white border border-white/20 text-[10px] font-bold uppercase tracking-wider shadow-sm mb-1 inline-block">
                                    {visit.activity_type}
                                </span>
                                <p className="px-1 py-1 text-xs font-medium opacity-80">
                                    {formatTime ? formatTime(visit.visited_at) : visit.visited_at}
                                </p>
                            </div>
                        </div>

                        {/* --- CONTENT SCROLLABLE --- */}
                        <div className="p-6 overflow-y-auto thin-scrollbar">
                            <div className="space-y-6">

                                {/* 1. INFORMASI PELANGGAN */}
                                <div>
                                    <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                        <User size={12} /> Pelanggan
                                    </h4>
                                    <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/20">
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-300 shrink-0">
                                                <Store size={18} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-base font-bold text-zinc-800 dark:text-zinc-100 truncate">
                                                    {visit.customer ? visit.customer.name : (visit.customer_name || 'Pelanggan Umum')}
                                                </p>
                                                <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider mb-2">
                                                    {visit.customer ? 'Terdaftar' : 'Tamu / Manual'}
                                                </p>

                                                {/* Kontak */}
                                                <div className="space-y-1.5">
                                                    {(visit.customer?.phone || visit.customer_phone) && (
                                                        <a
                                                            href={`https://wa.me/${((visit.customer?.phone || visit.customer_phone) || '').replace(/^0/, '62').replace(/\D/g, '')}`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="flex items-center gap-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                                                        >
                                                            <Phone size={12} />
                                                            <span>{visit.customer?.phone || visit.customer_phone}</span>
                                                        </a>
                                                    )}
                                                    {(visit.customer?.email || visit.customer_email) && (
                                                        <div className="flex items-center gap-2 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                                                            <Mail size={12} />
                                                            <span className="truncate">{visit.customer?.email || visit.customer_email}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 2. CATATAN */}
                                <div>
                                    <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                        <FileText size={12} /> Catatan Kunjungan
                                    </h4>
                                    <p className="text-zinc-800 dark:text-zinc-200 leading-relaxed bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl text-sm border border-zinc-100 dark:border-zinc-800">
                                        {visit.description || 'Tidak ada catatan yang ditambahkan.'}
                                    </p>
                                </div>

                                {/* 3. PRODUK / SETORAN */}
                                {visit.products && visit.products.length > 0 && (
                                    <div>
                                        <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                            <ShoppingBag size={12} /> Produk / Setoran
                                        </h4>
                                        <div className="space-y-2">
                                            {visit.products.map((prod) => {
                                                const masterProd = products.find(p => p.id === prod.id);
                                                const unitPrice = prod.pivot.price ?? 0;
                                                const fallbackValue = unitPrice * prod.pivot.quantity;
                                                const computedValue = typeof prod.pivot.value === 'number'
                                                    ? prod.pivot.value
                                                    : (isNegativeAction(prod.pivot.action_type) ? -Math.abs(fallbackValue) : Math.abs(fallbackValue));
                                                const isNegative = computedValue < 0;

                                                return (
                                                    <div key={prod.id} className="flex items-center justify-between p-3 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
                                                        <div className="flex items-center gap-3">
                                                            {masterProd?.file_path ? (
                                                                <button 
                                                                    onClick={() => handleImageClick(masterProd.file_path || '')} 
                                                                    className="w-10 h-10 rounded-md border border-zinc-200 dark:border-zinc-700 overflow-hidden block hover:opacity-80 transition-opacity"
                                                                >
                                                                    <img src={`/storage/${masterProd.file_path}`} alt={prod.name} className="w-full h-full object-cover" />
                                                                </button>
                                                            ) : (
                                                                <div className="w-10 h-10 flex items-center justify-center rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-300">
                                                                    <ImageIcon size={18} />
                                                                </div>
                                                            )}
                                                            <div>
                                                                <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">{prod.name}</p>
                                                                <p className="text-[10px] text-zinc-500 font-mono">{prod.sku}</p>
                                                                <p className="text-[10px] text-zinc-500 mt-1">
                                                                    @ {formatCurrency(unitPrice)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="block text-sm font-black text-blue-600 dark:text-blue-400">{prod.pivot.quantity} Unit</span>
                                                            <span className="block text-[10px] font-bold uppercase text-zinc-400 tracking-wide">{prod.pivot.action_type}</span>
                                                            <span className={`block text-[11px] font-black mt-1 ${isNegative ? 'text-red-500' : 'text-green-600'}`}>
                                                                {isNegative ? '-' : '+'}{formatCurrency(Math.abs(computedValue))}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })}

                                            {(() => {
                                                const grandTotal = visit.products.reduce((sum, prod) => {
                                                    const unitPrice = prod.pivot.price ?? 0;
                                                    const fallbackValue = unitPrice * prod.pivot.quantity;
                                                    const computedValue = typeof prod.pivot.value === 'number'
                                                        ? prod.pivot.value
                                                        : (isNegativeAction(prod.pivot.action_type) ? -Math.abs(fallbackValue) : Math.abs(fallbackValue));
                                                    return sum + computedValue;
                                                }, 0);

                                                return (
                                                    <div className={`p-3 rounded-xl border-2 mt-3 ${grandTotal >= 0
                                                        ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
                                                        : 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700'
                                                        }`}>
                                                        <p className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wide">Grand Total</p>
                                                        <p className={`text-base font-black mt-1 ${grandTotal >= 0 ? 'text-green-700 dark:text-green-100' : 'text-red-700 dark:text-red-100'}`}>
                                                            {grandTotal >= 0 ? '+' : '-'}{formatCurrency(Math.abs(grandTotal))}
                                                        </p>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                )}

                                {/* 4. LOKASI */}
                                <div>
                                    <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                        <MapPin size={12} /> Lokasi Terdeteksi
                                    </h4>
                                    <div className="flex items-start gap-3 bg-orange-50 dark:bg-orange-900/10 p-4 rounded-2xl border border-orange-100 dark:border-orange-900/20">
                                        <MapPin className="text-orange-500 mt-0.5 shrink-0 drop-shadow-sm" size={18} />
                                        <div>
                                            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 leading-snug">
                                                {visit.address || `GPS: ${visit.lat?.toFixed(6)}, ${visit.lng?.toFixed(6)}`}
                                            </p>
                                            {visit.lat && (
                                                <a 
                                                    href={`https://www.google.com/maps/search/?api=1&query=${visit.lat},${visit.lng}`} 
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
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default VisitDetailModal;