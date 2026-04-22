import { useState, useEffect, useRef, useCallback } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Loader2, ShoppingCart, Trash2, Plus, Minus, User, Package, CheckCircle2, XCircle, Banknote, ReceiptText, Search, ImageIcon, Eye, EyeOff, ScanLine } from 'lucide-react';
import axios from 'axios';
import ShiftManager from '@/components/pos/ShiftManager';
import ReceiptModal from '@/components/pos/ReceiptModal';
import ImagePreviewModal from '@/components/modal/image-preview-modal';
import BarcodeScannerModal from '@/components/modal/barcode-scanner-modal';
import { BarcodeFormat } from '@zxing/library';
import { useHidScanner } from '@/hooks/use-hid-scanner';
import type { BreadcrumbItem } from '@/types';

interface Product {
    id: number;
    name: string;
    sku: string;
    price: number;
    available_stock: number;
    image?: string;
}

interface CartItem {
    product_id: number;
    product_name: string;
    quantity: number;
    unit_price: number;
    discount_percentage?: number;
    discount_amount?: number;
    subtotal?: number;
    available_stock: number;
    image?: string;
}

interface Member {
    id: number;
    name: string;
    member_number: string;
    phone?: string;
    membershipTier?: { name: string; default_discount_percentage: number };
}

interface CashierShift {
    id: number;
    status: string;
    opened_at: string;
    opening_balance: number;
}

interface Props {
    currentShift: CashierShift | null;
    warehouse: { id: number; name: string };
}

export default function POSIndex({ currentShift, warehouse }: Props) {
    const [cart, setCart] = useState<CartItem[]>([]);
    const [member, setMember] = useState<Member | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [members, setMembers] = useState<Member[]>([]);
    const [productQuery, setProductQuery] = useState('');
    const [memberQuery, setMemberQuery] = useState('');
    const [showProductDropdown, setShowProductDropdown] = useState(false);
    const [showMemberDropdown, setShowMemberDropdown] = useState(false);
    const [isLoadingProducts, setIsLoadingProducts] = useState(false);
    const [isLoadingMembers, setIsLoadingMembers] = useState(false);
    const [cartPreview, setCartPreview] = useState<any>(null);
    const [isLoadingPreview, setIsLoadingPreview] = useState(false);
    const [cashReceived, setCashReceived] = useState('');
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [error, setError] = useState('');
    const [shift, setShift] = useState<CashierShift | null>(currentShift);
    const [completedTransaction, setCompletedTransaction] = useState<any>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [now, setNow] = useState(new Date());
    const [shiftInfoVisible, setShiftInfoVisible] = useState(false);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    // Mobile: which panel is active — 'products' | 'cart' | 'checkout'
    const [mobileTab, setMobileTab] = useState<'products' | 'cart' | 'checkout'>('products');

    const productRef = useRef<HTMLDivElement>(null);
    const memberRef = useRef<HTMLDivElement>(null);
    const productInputRef = useRef<HTMLInputElement>(null);
    const memberInputRef = useRef<HTMLInputElement>(null);
    const cashInputRef = useRef<HTMLInputElement>(null);

    const isFirstProductRender = useRef(true);
    const isFirstMemberRender = useRef(true);

    // Ref untuk products — agar handleBarcodeDetected tidak perlu recreate saat products berubah
    const productsRef = useRef<Product[]>([]);
    useEffect(() => { productsRef.current = products; }, [products]);

    // Live clock — update setiap detik
    useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    // Handler saat barcode terdeteksi (dari HID scanner atau kamera scanner)
    // Menggunakan ref agar fungsi stabil dan tidak menyebabkan re-render scanner
    const handleBarcodeDetected = useCallback((code: string): boolean => {
        const normalized = code.trim().toUpperCase();
        const list = productsRef.current;
        const match = list.find(p =>
            p.sku.toUpperCase() === normalized ||
            p.sku.toUpperCase().replace(/[^A-Z0-9]/g, '') === normalized.replace(/[^A-Z0-9]/g, '')
        ) ?? list.find(p =>
            p.name.toUpperCase() === normalized
        );

        if (match) {
            addToCart(match);
            return true;
        }

        // Tidak ditemukan — fetch dan tampilkan hasil
        setProductQuery(code.trim());
        fetchProducts(code.trim());
        return false;
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // HID scanner — deteksi input dari alat scan eksternal (USB/Bluetooth keyboard mode)
    // Hanya aktif saat tidak ada focus di input field
    useHidScanner(handleBarcodeDetected, true);

    // Close dropdowns on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (productRef.current && !productRef.current.contains(e.target as Node)) setShowProductDropdown(false);
            if (memberRef.current && !memberRef.current.contains(e.target as Node)) setShowMemberDropdown(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const fetchProducts = async (q: string) => {
        setIsLoadingProducts(true);
        try {
            const res = await axios.get('/pos/products/search', { params: { query: q } });
            setProducts(res.data);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Gagal mencari produk');
        } finally {
            setIsLoadingProducts(false);
        }
    };

    const fetchMembers = async (q: string) => {
        setIsLoadingMembers(true);
        try {
            const res = await axios.get('/settings/membership/members/search', { params: { query: q } });
            setMembers(res.data);
        } catch {
            // silent
        } finally {
            setIsLoadingMembers(false);
        }
    };

    useEffect(() => {
        if (isFirstProductRender.current) { isFirstProductRender.current = false; return; }
        const t = setTimeout(() => fetchProducts(productQuery), productQuery ? 300 : 0);
        return () => clearTimeout(t);
    }, [productQuery]);

    useEffect(() => {
        if (isFirstMemberRender.current) { isFirstMemberRender.current = false; return; }
        const t = setTimeout(() => fetchMembers(memberQuery), memberQuery ? 300 : 0);
        return () => clearTimeout(t);
    }, [memberQuery]);

    const addToCart = (product: Product) => {
        setError('');
        setCart(prev => {
            const existing = prev.find(i => i.product_id === product.id);
            if (existing) {
                if (existing.quantity >= product.available_stock) {
                    setError(`Stok habis. Tersedia: ${product.available_stock}`);
                    return prev;
                }
                return prev.map(i => i.product_id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
            }
            return [...prev, {
                product_id: product.id,
                product_name: product.name,
                quantity: 1,
                unit_price: product.price,
                available_stock: product.available_stock,
                image: product.image,
            }];
        });
        // Sembunyikan dropdown dan reset query setelah pilih
        setProductQuery('');
        setShowProductDropdown(false);
        // Refocus ke input agar bisa langsung scan/ketik produk berikutnya
        setTimeout(() => productInputRef.current?.focus(), 50);
        // Mobile: pindah ke tab cart setelah tambah produk
        if (window.innerWidth < 768) setMobileTab('cart');
    };

    // Barcode scan: jika ada exact match saat Enter ditekan, langsung tambah ke cart
    const handleProductKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            const exactMatch = products.find(
                p => p.sku.toLowerCase() === productQuery.trim().toLowerCase()
                    || p.name.toLowerCase() === productQuery.trim().toLowerCase()
            );
            if (exactMatch) {
                addToCart(exactMatch);
            } else if (products.length === 1) {
                // Jika hanya ada 1 hasil, langsung tambah
                addToCart(products[0]);
            }
        }
        if (e.key === 'Escape') {
            setShowProductDropdown(false);
            setProductQuery('');
        }
    };

    const updateQty = (productId: number, qty: number) => {
        if (qty <= 0) { removeItem(productId); return; }
        const item = cart.find(i => i.product_id === productId);
        if (!item) return;
        if (qty > item.available_stock) { setError(`Stok tidak cukup. Tersedia: ${item.available_stock}`); return; }
        setError('');
        setCart(prev => prev.map(i => i.product_id === productId ? { ...i, quantity: qty } : i));
    };

    const removeItem = (productId: number) => setCart(prev => prev.filter(i => i.product_id !== productId));

    const clearCart = () => {
        if (!confirm('Kosongkan keranjang?')) return;
        setCart([]); setMember(null); setCashReceived(''); setCartPreview(null);
    };

    // Cart preview with debounce — TIDAK setCart di sini untuk hindari infinite loop
    // Discount info disimpan terpisah di cartPreview, bukan di cart state
    useEffect(() => {
        if (cart.length === 0) { setCartPreview(null); return; }
        const t = setTimeout(async () => {
            setIsLoadingPreview(true);
            try {
                const res = await axios.post('/pos/cart/preview', {
                    cart_items: cart.map(i => ({ product_id: i.product_id, quantity: i.quantity, unit_price: i.unit_price })),
                    member_id: member?.id || null,
                });
                setCartPreview(res.data);
                // TIDAK setCart di sini — akan menyebabkan infinite loop
            } catch { /* silent */ } finally { setIsLoadingPreview(false); }
        }, 400);
        return () => clearTimeout(t);
    }, [cart, member]);

    const handleCheckout = async () => {
        if (!shift) { setError('Buka shift terlebih dahulu'); return; }
        if (cart.length === 0) { setError('Keranjang kosong'); return; }
        const cash = parseFloat(cashReceived);
        if (isNaN(cash) || cash < (cartPreview?.grand_total ?? 0)) {
            setError('Uang diterima kurang dari total'); return;
        }
        setIsCheckingOut(true); setError('');
        try {
            const res = await axios.post('/pos/transactions/checkout', {
                cart_items: cart.map(i => ({ product_id: i.product_id, quantity: i.quantity, unit_price: i.unit_price })),
                member_id: member?.id || null,
                cash_received: cash,
            });
            setCompletedTransaction(res.data.transaction);
            setCart([]); setMember(null); setCashReceived(''); setCartPreview(null);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Gagal checkout');
        } finally { setIsCheckingOut(false); }
    };

    const grandTotal = cartPreview?.grand_total ?? 0;
    const cashAmount = parseFloat(cashReceived) || 0;
    const change = cashAmount - grandTotal;
    const totalItems = cart.reduce((s, i) => s + i.quantity, 0);

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Point of Sales',
            href: '/pos',
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="POS Kasir" />

            {completedTransaction && (
                <ReceiptModal transaction={completedTransaction} onClose={() => setCompletedTransaction(null)} />
            )}

            <ImagePreviewModal
                isOpen={previewImage !== null}
                onClose={() => setPreviewImage(null)}
                imageUrl={previewImage ?? ''}
            />

            <BarcodeScannerModal
                isOpen={isScannerOpen}
                onClose={() => setIsScannerOpen(false)}
                onDetected={handleBarcodeDetected}
                title="Scan Barcode Produk"
                subtitle="Arahkan barcode ke kamera — terus scan sampai produk ditemukan"
                notFoundMessage="Produk tidak ditemukan, coba scan ulang..."
                requiredDetections={1}
                activeDurationSeconds={30}
                barcodeFormats={[
                    BarcodeFormat.CODE_128,
                    BarcodeFormat.EAN_13,
                    BarcodeFormat.EAN_8,
                    BarcodeFormat.UPC_A,
                    BarcodeFormat.UPC_E,
                    BarcodeFormat.CODE_39,
                    BarcodeFormat.QR_CODE,
                ]}
            />

            <div className="flex flex-col h-[calc(100vh-4rem)] bg-gray-100 dark:bg-zinc-950">

                {/* Top bar */}
                <div className="flex items-center justify-between px-3 py-2 bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 shadow-sm shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
                                <ReceiptText size={14} className="text-white" />
                            </div>
                            <div className="hidden sm:block">
                                <p className="text-sm font-bold text-gray-900 dark:text-white leading-none">POS Kasir</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{warehouse.name}</p>
                            </div>
                        </div>
                    </div>

                    {/* Right: clock */}
                    <div className="text-right">
                        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 hidden md:block">
                            {now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                        <p className="text-xs font-mono font-bold text-gray-600 dark:text-gray-300 tabular-nums">
                            {now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </p>
                    </div>
                </div>

                {/* Error banner */}
                {error && (
                    <div className="mx-4 mt-2 flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-2 text-sm text-red-700 dark:text-red-400 shrink-0">
                        <XCircle size={15} className="shrink-0" />
                        <span className="flex-1">{error}</span>
                        <button onClick={() => setError('')} className="text-red-400 hover:text-red-600 ml-2">
                            <XCircle size={14} />
                        </button>
                    </div>
                )}

                {/* 3-column layout */}
                <div className="flex flex-1 overflow-hidden">

                    {/* ── COL 1: Product search ── */}
                    <div className={`flex flex-col shrink-0 border-r border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900
                        w-full md:w-72 xl:w-80
                        ${mobileTab !== 'products' ? 'hidden md:flex' : 'flex'}
                        pb-14 md:pb-0
                    `}>
                        <div className="px-3 pt-3 pb-2 border-b border-gray-100 dark:border-zinc-800">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                                <Search size={11} /> Cari Produk
                            </p>
                            <div ref={productRef} className="relative">
                                <div className="flex gap-2">
                                    <div className="flex-1 flex items-center gap-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
                                        <Search size={14} className="text-gray-400 shrink-0" />
                                        <input
                                            ref={productInputRef}
                                            type="text"
                                            value={productQuery}
                                            onChange={e => { setProductQuery(e.target.value); setShowProductDropdown(true); }}
                                            onFocus={() => { setShowProductDropdown(true); if (products.length === 0) fetchProducts(''); }}
                                            onKeyDown={handleProductKeyDown}
                                            placeholder="Nama / SKU / barcode..."
                                            className="flex-1 bg-transparent text-sm outline-none text-gray-900 dark:text-white placeholder-gray-400"
                                        />
                                        {isLoadingProducts
                                            ? <Loader2 size={13} className="animate-spin text-gray-400 shrink-0" />
                                            : productQuery && (
                                                <button onClick={() => { setProductQuery(''); setShowProductDropdown(false); }} className="text-gray-400 hover:text-gray-600">
                                                    <XCircle size={13} />
                                                </button>
                                            )
                                        }
                                    </div>
                                    {/* Tombol scan kamera — hanya untuk mobile/tablet */}
                                    <button
                                        onClick={() => setIsScannerOpen(true)}
                                        title="Scan barcode dengan kamera"
                                        className="md:hidden w-10 h-10 shrink-0 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center transition-colors shadow-sm"
                                    >
                                        <ScanLine size={16} />
                                    </button>
                                </div>
                            </div>
                            {/* Info HID scanner — hanya di mobile */}
                            <p className="md:hidden text-[10px] text-gray-400 mt-1.5 px-0.5">
                                Klik <ScanLine size={9} className="inline" /> untuk scan via kamera
                            </p>
                        </div>

                        {/* Product list — full column, scrollable */}
                        <div className="flex-1 overflow-y-auto">
                            {products.length === 0 && !isLoadingProducts && (
                                <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-300 dark:text-zinc-700 px-4 text-center">
                                    <Package size={36} strokeWidth={1} />
                                    <p className="text-xs">Ketik nama produk atau scan barcode untuk mencari</p>
                                </div>
                            )}
                            {isLoadingProducts && (
                                <div className="flex items-center justify-center h-20">
                                    <Loader2 size={20} className="animate-spin text-indigo-400" />
                                </div>
                            )}
                            {!isLoadingProducts && products.map(p => (
                                <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => addToCart(p)}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors text-left group border-b border-gray-100 dark:border-zinc-800 last:border-0"
                                >
                                    <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 overflow-hidden">
                                        {p.image
                                            ? <img src={`/storage/${p.image}`} alt={p.name} className="w-full h-full object-cover" />
                                            : <Package size={15} className="text-gray-400" />
                                        }
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate group-hover:text-indigo-600 transition-colors">{p.name}</p>
                                        <p className="text-xs text-gray-400">{p.sku}</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-xs font-bold text-gray-900 dark:text-white">Rp {p.price.toLocaleString('id-ID')}</p>
                                        <p className={`text-xs font-medium ${p.available_stock > 10 ? 'text-emerald-600' : p.available_stock > 0 ? 'text-amber-500' : 'text-red-500'}`}>
                                            stok {p.available_stock}
                                        </p>
                                    </div>
                                </button>
                            ))}
                            {!isLoadingProducts && products.length === 0 && productQuery && (
                                <p className="text-center text-xs text-gray-400 py-8">Produk tidak ditemukan</p>
                            )}
                        </div>
                    </div>

                    {/* ── COL 2: Cart ── */}
                    <div className={`flex flex-col flex-1 overflow-hidden border-r border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-950
                        ${mobileTab !== 'cart' ? 'hidden md:flex' : 'flex'}
                        pb-14 md:pb-0
                    `}>
                        {/* Cart header */}
                        <div className="flex items-center justify-between px-4 py-2.5 bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 shrink-0">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                                <ShoppingCart size={11} /> Keranjang
                                {totalItems > 0 && (
                                    <span className="ml-1 bg-indigo-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{totalItems}</span>
                                )}
                            </p>
                            {cart.length > 0 && (
                                <button onClick={clearCart} className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors">
                                    <Trash2 size={11} /> Kosongkan
                                </button>
                            )}
                        </div>

                        {/* Cart items */}
                        <div className="flex-1 overflow-y-auto">
                            {cart.length === 0 ? (
                                <div
                                    className="flex flex-col items-center justify-center h-full gap-3 text-gray-300 dark:text-zinc-700 cursor-pointer select-none"
                                    onClick={() => { productInputRef.current?.focus(); setShowProductDropdown(true); if (products.length === 0) fetchProducts(''); }}
                                >
                                    <ShoppingCart size={44} strokeWidth={1} />
                                    <p className="text-sm font-medium text-gray-400">Keranjang kosong</p>
                                    <p className="text-xs text-gray-400 text-center">Pilih produk dari kolom kiri<br />atau klik di sini untuk fokus ke pencarian</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100 dark:divide-zinc-800/60">
                                    {cart.map((item, idx) => {
                                        const previewItem = cartPreview?.items?.[idx];
                                        const discountPct = previewItem?.discount_percentage ?? 0;
                                        const discountAmt = previewItem?.discount_amount ?? 0;
                                        const subtotal = previewItem?.subtotal ?? (item.unit_price * item.quantity);
                                        return (
                                            <div key={item.product_id} className="px-3 py-2 bg-white dark:bg-zinc-900 hover:bg-gray-50 dark:hover:bg-zinc-800/40 transition-colors border-b border-gray-100 dark:border-zinc-800 last:border-0">

                                                {/* Desktop: 1 baris compact | Mobile: 2 baris */}
                                                <div className="flex items-center gap-2">
                                                    {/* No */}
                                                    <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                                                        <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">{idx + 1}</span>
                                                    </div>
                                                    {/* Thumbnail */}
                                                    <button
                                                        type="button"
                                                        onClick={() => item.image && setPreviewImage(`/storage/${item.image}`)}
                                                        className={`w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-gray-200 dark:border-zinc-700 bg-gray-100 dark:bg-zinc-800 flex items-center justify-center ${item.image ? 'cursor-zoom-in hover:opacity-80 transition-opacity' : 'cursor-default'}`}
                                                    >
                                                        {item.image
                                                            ? <img src={`/storage/${item.image}`} alt={item.product_name} className="w-full h-full object-cover" />
                                                            : <ImageIcon size={13} className="text-gray-400" />
                                                        }
                                                    </button>

                                                    {/* Nama + harga — flex-1 di semua ukuran */}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate leading-tight">{item.product_name}</p>
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-xs text-gray-400">Rp {item.unit_price.toLocaleString('id-ID')}</span>
                                                            {discountPct > 0 && (
                                                                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-1 rounded">-{discountPct}%</span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Qty controls — hidden di mobile, tampil di desktop */}
                                                    <div className="hidden md:flex items-center gap-0 shrink-0 bg-gray-100 dark:bg-zinc-800 rounded-xl overflow-hidden border border-gray-200 dark:border-zinc-700">
                                                        <button
                                                            onClick={() => updateQty(item.product_id, item.quantity - 1)}
                                                            className="w-7 h-7 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 transition-colors"
                                                        >
                                                            <Minus size={11} />
                                                        </button>
                                                        <span className="w-8 text-center text-sm font-bold text-gray-900 dark:text-white select-none border-x border-gray-200 dark:border-zinc-700 py-0.5">
                                                            {item.quantity}
                                                        </span>
                                                        <button
                                                            onClick={() => updateQty(item.product_id, item.quantity + 1)}
                                                            className="w-7 h-7 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 hover:text-indigo-600 transition-colors"
                                                        >
                                                            <Plus size={11} />
                                                        </button>
                                                    </div>

                                                    {/* Subtotal — hidden di mobile, tampil di desktop */}
                                                    <div className="hidden md:block text-right shrink-0 min-w-[76px]">
                                                        <p className="text-sm font-bold text-gray-900 dark:text-white">Rp {subtotal.toLocaleString('id-ID')}</p>
                                                        {discountAmt > 0 && (
                                                            <p className="text-[10px] text-emerald-600">hemat {discountAmt.toLocaleString('id-ID')}</p>
                                                        )}
                                                    </div>

                                                    {/* Hapus */}
                                                    <button onClick={() => removeItem(item.product_id)} className="w-6 h-6 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center justify-center text-gray-300 hover:text-red-500 transition-colors shrink-0">
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>

                                                {/* Baris bawah: qty + subtotal — hanya di mobile */}
                                                <div className="flex md:hidden items-center justify-between mt-2 pl-7">
                                                    <div className="flex items-center gap-1">
                                                        <button onClick={() => updateQty(item.product_id, item.quantity - 1)} className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-zinc-800 hover:bg-red-100 hover:text-red-600 flex items-center justify-center transition-colors text-gray-600 dark:text-gray-400">
                                                            <Minus size={12} />
                                                        </button>
                                                        <input
                                                            type="number"
                                                            value={item.quantity}
                                                            onChange={e => updateQty(item.product_id, parseInt(e.target.value) || 0)}
                                                            className="w-10 text-center text-sm font-bold bg-gray-50 dark:bg-zinc-800 rounded-lg outline-none text-gray-900 dark:text-white border border-gray-200 dark:border-zinc-700 focus:ring-1 focus:ring-indigo-500 py-0.5"
                                                            min={1} max={item.available_stock}
                                                        />
                                                        <button onClick={() => updateQty(item.product_id, item.quantity + 1)} className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-zinc-800 hover:bg-indigo-100 hover:text-indigo-600 flex items-center justify-center transition-colors text-gray-600 dark:text-gray-400">
                                                            <Plus size={12} />
                                                        </button>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm font-bold text-gray-900 dark:text-white">Rp {subtotal.toLocaleString('id-ID')}</p>
                                                        {discountAmt > 0 && (
                                                            <p className="text-[10px] text-emerald-600">hemat {discountAmt.toLocaleString('id-ID')}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Cart footer */}
                        {cart.length > 0 && (
                            <div className="border-t border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-2 flex items-center justify-between shrink-0">
                                <span className="text-xs text-gray-400">{cart.length} jenis • {totalItems} item</span>
                                {isLoadingPreview && <Loader2 size={12} className="animate-spin text-indigo-400" />}
                            </div>
                        )}
                    </div>

                    {/* ── COL 3: Checkout panel ── */}
                    <div className={`shrink-0 flex flex-col bg-white dark:bg-zinc-900 overflow-y-auto
                        w-full md:w-72 xl:w-80
                        ${mobileTab !== 'checkout' ? 'hidden md:flex' : 'flex'}
                        pb-14 md:pb-0
                    `}>

                        {/* Shift */}
                        <div className="p-3 border-b border-gray-100 dark:border-zinc-800">
                            {shiftInfoVisible ? (
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Info Shift</p>
                                        <button
                                            onClick={() => setShiftInfoVisible(false)}
                                            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                                        >
                                            <EyeOff size={12} /> Sembunyikan
                                        </button>
                                    </div>
                                    <ShiftManager currentShift={shift} onShiftChange={setShift} />
                                </div>
                            ) : (
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        {shift ? (
                                            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                                        ) : (
                                            <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                                        )}
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {shift ? 'Shift sedang berjalan' : 'Shift belum dibuka'}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setShiftInfoVisible(true)}
                                        className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
                                    >
                                        <Eye size={12} /> Tampilkan
                                    </button>
                                </div>
                            )}
                        </div>

                        {shift && (
                            <>
                                {/* Member */}
                                <div className="p-3 border-b border-gray-100 dark:border-zinc-800">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                                        <User size={11} /> Member
                                    </p>
                                    <div ref={memberRef} className="relative">
                                        {member ? (
                                            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                                                <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
                                                    <User size={13} className="text-emerald-600" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{member.name}</p>
                                                    <p className="text-xs text-gray-500">{member.member_number} • {member.membershipTier?.name}</p>
                                                </div>
                                                <span className="text-xs font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-900/40 px-1.5 py-0.5 rounded-md shrink-0">
                                                    -{member.membershipTier?.default_discount_percentage ?? 0}%
                                                </span>
                                                <button onClick={() => { setMember(null); setMemberQuery(''); }} className="text-gray-300 hover:text-red-500 transition-colors shrink-0">
                                                    <XCircle size={14} />
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex items-center gap-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
                                                    <User size={13} className="text-gray-400 shrink-0" />
                                                    <input
                                                        ref={memberInputRef}
                                                        type="text"
                                                        value={memberQuery}
                                                        onChange={e => { setMemberQuery(e.target.value); setShowMemberDropdown(true); }}
                                                        onFocus={() => { setShowMemberDropdown(true); if (members.length === 0) fetchMembers(''); }}
                                                        placeholder="Cari member (opsional)..."
                                                        className="flex-1 bg-transparent text-sm outline-none text-gray-900 dark:text-white placeholder-gray-400"
                                                    />
                                                    {isLoadingMembers && <Loader2 size={12} className="animate-spin text-gray-400" />}
                                                </div>
                                                {showMemberDropdown && members.length > 0 && (
                                                    <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                                                        {members.map(m => (
                                                            <button
                                                                key={m.id}
                                                                type="button"
                                                                onClick={() => { setMember(m); setMemberQuery(''); setShowMemberDropdown(false); }}
                                                                className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors text-left border-b border-gray-100 dark:border-zinc-800 last:border-0"
                                                            >
                                                                <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                                                                    <User size={12} className="text-gray-400" />
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{m.name}</p>
                                                                    <p className="text-xs text-gray-500 truncate">{m.member_number} • {m.phone}</p>
                                                                </div>
                                                                <span className="text-xs font-bold text-indigo-600 shrink-0">{m.membershipTier?.name}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Order summary */}
                                <div className="p-3 border-b border-gray-100 dark:border-zinc-800 space-y-1.5">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Ringkasan</p>
                                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                                        <span>Subtotal ({totalItems} item)</span>
                                        <span>Rp {(cartPreview?.subtotal ?? cart.reduce((s, i) => s + i.unit_price * i.quantity, 0)).toLocaleString('id-ID')}</span>
                                    </div>
                                    {(cartPreview?.total_discount ?? 0) > 0 && (
                                        <div className="flex justify-between text-sm text-emerald-600">
                                            <span>Diskon Member</span>
                                            <span>-Rp {cartPreview.total_discount.toLocaleString('id-ID')}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-base font-bold text-gray-900 dark:text-white pt-1.5 border-t border-gray-100 dark:border-zinc-800">
                                        <span>Total</span>
                                        <span className="text-indigo-600 dark:text-indigo-400">Rp {grandTotal.toLocaleString('id-ID')}</span>
                                    </div>
                                </div>

                                {/* Cash input */}
                                <div className="p-3 border-b border-gray-100 dark:border-zinc-800 space-y-2">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                                        <Banknote size={11} /> Pembayaran Tunai
                                    </p>
                                    <div className="flex items-center gap-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
                                        <span className="text-xs font-bold text-gray-400 shrink-0">Rp</span>
                                        <input
                                            ref={cashInputRef}
                                            type="number"
                                            value={cashReceived}
                                            onChange={e => setCashReceived(e.target.value)}
                                            placeholder="0"
                                            className="flex-1 bg-transparent text-sm font-bold outline-none text-gray-900 dark:text-white"
                                        />
                                        {cashReceived && (
                                            <button onClick={() => setCashReceived('')} className="text-gray-400 hover:text-gray-600">
                                                <XCircle size={13} />
                                            </button>
                                        )}
                                    </div>
                                    {/* Quick cash — 6 pilihan berdasarkan pecahan uang standar */}
                                    {grandTotal > 0 && (() => {
                                        const seen = new Set<number>();
                                        const result: number[] = [];

                                        // Selalu sertakan nominal pas
                                        seen.add(grandTotal);
                                        result.push(grandTotal);

                                        // Pecahan uang yang umum dipegang kasir/pelanggan
                                        const bills = [1000, 2000, 5000, 10000, 20000, 50000, 100000, 200000, 500000, 1000000];

                                        // Untuk setiap pecahan, hitung pembulatan ke atas
                                        // Ambil yang paling dekat dengan total (selisih kecil)
                                        const candidates: number[] = [];
                                        for (const bill of bills) {
                                            const rounded = Math.ceil(grandTotal / bill) * bill;
                                            if (rounded > grandTotal && !seen.has(rounded)) {
                                                candidates.push(rounded);
                                                seen.add(rounded);
                                            }
                                        }

                                        // Urutkan dari yang paling dekat ke total
                                        candidates.sort((a, b) => a - b);

                                        // Ambil 5 kandidat terdekat
                                        for (const c of candidates) {
                                            if (result.length >= 6) break;
                                            result.push(c);
                                        }

                                        // Jika masih kurang dari 6, tambah kelipatan 50rb/100rb berikutnya
                                        const lastBill = result[result.length - 1];
                                        const fillStep = grandTotal >= 1000000 ? 500000 : grandTotal >= 200000 ? 100000 : 50000;
                                        let fill = Math.ceil((lastBill + 1) / fillStep) * fillStep;
                                        while (result.length < 6) {
                                            if (!seen.has(fill)) result.push(fill);
                                            fill += fillStep;
                                        }

                                        const fmt = (v: number) => {
                                            if (v >= 1000000) {
                                                const jt = Math.floor(v / 1000000);
                                                const sisa = Math.round((v % 1000000) / 1000);
                                                return sisa > 0 ? `${jt}jt${sisa}rb` : `${jt}jt`;
                                            }
                                            if (v >= 1000) return `${+(v / 1000).toFixed(1).replace(/\.0$/, '')}rb`;
                                            return v.toLocaleString('id-ID');
                                        };

                                        return (
                                            <div className="grid grid-cols-3 gap-1.5">
                                                {result.slice(0, 6).map(amount => (
                                                    <button
                                                        key={amount}
                                                        onClick={() => setCashReceived(String(amount))}
                                                        className={`text-xs py-1.5 rounded-lg font-semibold transition-all border ${cashReceived === String(amount) ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-zinc-700 hover:border-indigo-400 hover:text-indigo-600'}`}
                                                    >
                                                        {fmt(amount)}
                                                    </button>
                                                ))}
                                            </div>
                                        );
                                    })()}

                                    {/* Kembalian + tombol kurangi */}
                                    {cashAmount > 0 && grandTotal > 0 && (
                                        <div className="space-y-1.5">
                                            <div className={`flex justify-between items-center px-3 py-2 rounded-xl text-sm font-bold ${change >= 0 ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-900/20 text-red-600'}`}>
                                                <span>{change >= 0 ? 'UANG KEMBALIAN' : 'UANG KURANG'}</span>
                                                <span>Rp {Math.abs(change).toLocaleString('id-ID')}</span>
                                            </div>
                                            {change > 0 && (() => {
                                                const pecahan = [1000, 2000, 5000, 10000, 20000, 50000, 100000, 200000, 500000, 1000000];
                                                const opts = pecahan.filter(p => p <= cashAmount - grandTotal || p <= cashAmount).slice(-10);
                                                const reductions = pecahan.filter(p => p < cashAmount && cashAmount - p >= grandTotal).slice(-10);
                                                if (reductions.length === 0) return null;
                                                const fmt = (v: number) => {
                                                    if (v >= 1000000) return `${v / 1000000}jt `;
                                                    if (v >= 1000) return `-${v / 1000}rb `;
                                                    return `-${v}`;
                                                };
                                                return (
                                                    <div className="flex gap-1.5 flex-wrap">
                                                        {reductions.map(p => (
                                                            <button
                                                                key={p}
                                                                onClick={() => setCashReceived(String(cashAmount - p))}
                                                                className="text-xs px-2 py-1 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-600 dark:text-gray-300 hover:border-rose-400 hover:text-rose-600 font-semibold transition-all"
                                                            >
                                                                {fmt(p)}
                                                            </button>
                                                        ))}
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    )}
                                </div>

                                {/* Checkout button */}
                                <div className="p-3 mt-auto">
                                    <button
                                        onClick={handleCheckout}
                                        disabled={cart.length === 0 || isCheckingOut || !cashReceived || change < 0}
                                        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-500/30 active:scale-[0.98]"
                                    >
                                        {isCheckingOut
                                            ? <><Loader2 size={16} className="animate-spin" /> Memproses...</>
                                            : <><ShoppingCart size={16} /> Proses Transaksi</>
                                        }
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                </div>
            </div>

            {/* Mobile bottom tab navigation */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white dark:bg-zinc-900 border-t border-gray-200 dark:border-zinc-800 flex">
                <button
                    onClick={() => setMobileTab('products')}
                    className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs font-semibold transition-colors ${mobileTab === 'products' ? 'text-indigo-600' : 'text-gray-400'}`}
                >
                    <Search size={18} />
                    <span>Produk</span>
                </button>
                <button
                    onClick={() => setMobileTab('cart')}
                    className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs font-semibold transition-colors relative ${mobileTab === 'cart' ? 'text-indigo-600' : 'text-gray-400'}`}
                >
                    <ShoppingCart size={18} />
                    {totalItems > 0 && (
                        <span className="absolute top-1.5 right-[calc(50%-18px)] bg-indigo-600 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{totalItems}</span>
                    )}
                    <span>Keranjang</span>
                </button>
                <button
                    onClick={() => setMobileTab('checkout')}
                    className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs font-semibold transition-colors ${mobileTab === 'checkout' ? 'text-indigo-600' : 'text-gray-400'}`}
                >
                    <Banknote size={18} />
                    <span>Bayar</span>
                </button>
            </div>
        </AppLayout>
    );
}

