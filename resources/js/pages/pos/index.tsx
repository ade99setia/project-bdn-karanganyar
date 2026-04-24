import { useState, useEffect, useRef } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { ReceiptText, XCircle, History, Settings2, Plus, BarChart2 } from 'lucide-react';
import { BarcodeFormat } from '@zxing/library';
import { useHidScanner } from '@/hooks/use-hid-scanner';
import { usePOS } from '@/hooks/use-pos';
import ProductSearch from '@/components/pos/ProductSearch';
import CartPanel from '@/components/pos/CartPanel';
import CheckoutPanel from '@/components/pos/CheckoutPanel';
import MobileTabBar from '@/components/pos/MobileTabBar';
import ReceiptModal from '@/components/pos/ReceiptModal';
import ShiftHistoryDrawer from '@/components/pos/ShiftHistoryDrawer';
import PrinterSetupDrawer from '@/components/pos/PrinterSetupDrawer';
import ShiftReportDrawer from '@/components/pos/ShiftReportDrawer';
import ImagePreviewModal from '@/components/modal/image-preview-modal';
import BarcodeScannerModal from '@/components/modal/barcode-scanner-modal';
import type { CashierShift, Transaction } from '@/types/pos';
import type { BreadcrumbItem } from '@/types';

interface Props {
    currentShift: CashierShift | null;
    warehouse: { id: number; name: string; receipt_header: string; code: string; };
}

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Point of Sales', href: '/pos' }];

export default function POSIndex({ currentShift, warehouse }: Props) {
    const pos = usePOS(currentShift);

    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [isSetupOpen, setIsSetupOpen] = useState(false);
    const [isReportOpen, setIsReportOpen] = useState(false);
    const [mobileTab, setMobileTab] = useState<'products' | 'cart' | 'checkout'>('products');
    const [now, setNow] = useState(new Date());

    const productInputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    useEffect(() => {
        if (!pos.error) return;
        const t = setTimeout(() => pos.setError(''), 4000);
        return () => clearTimeout(t);
    }, [pos.error]);

    useHidScanner(pos.handleBarcodeDetected, true);

    const handleAddToCart = (product: Parameters<typeof pos.addToCart>[0]) => {
        pos.addToCart(product);
        pos.setProductQuery('');
        setTimeout(() => productInputRef.current?.focus(), 50);
        if (window.innerWidth < 768) setMobileTab('cart');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Point of Sales" />

            {pos.completedTransaction && (
                <ReceiptModal
                    transaction={pos.completedTransaction}
                    onClose={() => pos.setCompletedTransaction(null)}
                    onNewTransaction={() => pos.setCompletedTransaction(null)}
                    onAddMore={() => pos.rehydrateFromTransaction(pos.completedTransaction!)}
                    waAutoSent={pos.waAutoSent}
                    onVoid={async (id) => {
                        await import('axios').then(({ default: axios }) =>
                            axios.post(`/pos/transactions/${id}/void`)
                        );
                        pos.setCompletedTransaction(null);
                    }}
                />
            )}

            <PrinterSetupDrawer
                isOpen={isSetupOpen}
                onClose={() => setIsSetupOpen(false)}
            />

            <ShiftReportDrawer
                isOpen={isReportOpen}
                shift={pos.shift}
                onClose={() => setIsReportOpen(false)}
            />

            <ShiftHistoryDrawer
                isOpen={isHistoryOpen}
                shift={pos.shift}
                onClose={() => setIsHistoryOpen(false)}
                onViewReceipt={(tx: Transaction) => {
                    setIsHistoryOpen(false);
                    pos.setCompletedTransaction(tx);
                }}
            />

            <ImagePreviewModal
                isOpen={previewImage !== null}
                onClose={() => setPreviewImage(null)}
                imageUrl={previewImage ?? ''}
            />

            <BarcodeScannerModal
                isOpen={isScannerOpen}
                onClose={() => setIsScannerOpen(false)}
                onDetected={pos.handleBarcodeDetected}
                title="Scan Barcode Produk"
                subtitle="Arahkan barcode ke kamera — terus scan sampai produk ditemukan"
                notFoundMessage="Produk tidak ditemukan, coba scan ulang..."
                requiredDetections={1}
                activeDurationSeconds={30}
                barcodeFormats={[
                    BarcodeFormat.CODE_128, BarcodeFormat.EAN_13, BarcodeFormat.EAN_8,
                    BarcodeFormat.UPC_A, BarcodeFormat.UPC_E, BarcodeFormat.CODE_39,
                    BarcodeFormat.QR_CODE,
                ]}
            />

            <div className="flex flex-col h-[calc(100vh-4rem)] bg-gray-100 dark:bg-zinc-950">

                <div className="flex items-center justify-between px-4 py-2 bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 shadow-sm shrink-0 gap-4">

                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0 shadow-md">
                            <ReceiptText size={16} className="text-white" />
                        </div>

                        <div className="flex flex-col justify-center flex-1 min-w-0">
                            <h1 className="text-sm font-bold text-gray-900 dark:text-white leading-none mb-1 truncate">
                                {warehouse.name}
                            </h1>
                            <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 leading-none truncate">
                                {warehouse.receipt_header} - {warehouse.code}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 border-r border-gray-200 dark:border-zinc-800 pr-4">
                                <button
                                    onClick={() => setIsSetupOpen(true)}
                                    className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors border border-gray-200 dark:border-zinc-700"
                                    title="Setup printer"
                                >
                                    <Settings2 size={14} />
                                    <span className="hidden sm:inline">Printer</span>
                                </button>

                                {pos.shift && (
                                    <button
                                        onClick={() => setIsReportOpen(true)}
                                        className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors border border-gray-200 dark:border-zinc-700"
                                    >
                                        <BarChart2 size={14} />
                                        <span className="hidden sm:inline">Laporan</span>
                                    </button>
                                )}

                                {pos.shift && (
                                    <button
                                        onClick={() => setIsHistoryOpen(true)}
                                        className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors border border-gray-200 dark:border-zinc-700"
                                    >
                                        <History size={14} />
                                        <span className="hidden sm:inline">Riwayat</span>
                                    </button>
                                )}
                            </div>

                            {pos.isAddingMore && (
                                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400">
                                    <Plus size={12} className="shrink-0" />
                                    <span className="text-xs font-bold hidden sm:inline">Mode Tambah Produk Aktif</span>
                                </div>
                            )}

                            <div className="flex flex-col items-end justify-center">
                                <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-tight leading-none mb-1">
                                    {now.toLocaleDateString('id-ID', { weekday: 'short' })}, {now.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </div>
                                <div className="text-sm font-mono font-black text-gray-800 dark:text-zinc-200 tabular-nums leading-none flex items-center gap-1">
                                    <span className="inline-block w-[14px] text-center">
                                        {now.getHours().toString().padStart(2, '0')}
                                    </span>
                                    <span className="animate-pulse text-indigo-500">:</span>
                                    <span className="inline-block w-[14px] text-center">
                                        {now.getMinutes().toString().padStart(2, '0')}
                                    </span>
                                    <span className="animate-pulse text-indigo-500">:</span>
                                    <span className="inline-block w-[14px] text-center text-xs font-medium text-gray-500">
                                        {now.getSeconds().toString().padStart(2, '0')}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {pos.isAddingMore && (
                            <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 text-amber-700 dark:text-amber-400">
                                <Plus size={14} className="animate-bounce" />
                                <span className="text-[10px] font-bold hidden lg:inline">Mode Tambah Aktif</span>
                            </div>
                        )}
                    </div>
                </div>

                {pos.error && (
                    <div className="mt-2 mb-2 flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-2 text-sm text-red-700 dark:text-red-400 shrink-0">
                        <XCircle size={15} className="shrink-0" />
                        <span className="flex-1">{pos.error}</span>
                        <button onClick={() => pos.setError('')} className="text-red-400 hover:text-red-600 ml-2">
                            <XCircle size={14} />
                        </button>
                    </div>
                )}

                <div className="sm:hidden flex items-center justify-end px-4 py-2 bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 shadow-sm shrink-0">
                    <div className="flex items-center gap-2 flex-nowrap">
                        <button
                            onClick={() => setIsSetupOpen(true)}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors border border-gray-200 dark:border-zinc-700 shrink-0"
                            title="Setup printer"
                        >
                            <Settings2 size={14} />
                            <span className="hidden sm:inline">Printer</span>
                        </button>

                        {pos.shift && (
                            <>
                                <div className="h-4 w-[1px] bg-gray-200 dark:bg-zinc-800 mx-1" />

                                <button
                                    onClick={() => setIsReportOpen(true)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors border border-gray-200 dark:border-zinc-700 shrink-0"
                                >
                                    <BarChart2 size={14} />
                                    <span className="hidden sm:inline">Laporan</span>
                                </button>

                                <button
                                    onClick={() => setIsHistoryOpen(true)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors border border-gray-200 dark:border-zinc-700 shrink-0"
                                >
                                    <History size={14} />
                                    <span className="hidden sm:inline">Riwayat</span>
                                </button>
                            </>
                        )}
                    </div>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    <ProductSearch
                        products={pos.products}
                        productQuery={pos.productQuery}
                        isLoadingProducts={pos.isLoadingProducts}
                        isVisible={mobileTab === 'products'}
                        onQueryChange={q => { pos.setProductQuery(q); }}
                        onAddToCart={handleAddToCart}
                        onOpenScanner={() => setIsScannerOpen(true)}
                        onFetchProducts={pos.fetchProducts}
                        productInputRef={productInputRef}
                    />

                    <CartPanel
                        cart={pos.cart}
                        cartPreview={pos.cartPreview}
                        isLoadingPreview={pos.isLoadingPreview}
                        totalItems={pos.totalItems}
                        isVisible={mobileTab === 'cart'}
                        onUpdateQty={pos.updateQty}
                        onRemoveItem={pos.removeItem}
                        onClearCart={pos.clearCart}
                        onPreviewImage={setPreviewImage}
                        onFocusProductSearch={() => {
                            // Mobile: switch ke tab products dulu sebelum focus
                            if (window.innerWidth < 768) setMobileTab('products');
                            setTimeout(() => {
                                productInputRef.current?.focus();
                                if (pos.products.length === 0) pos.fetchProducts('');
                            }, 50);
                        }}
                    />

                    <CheckoutPanel
                        cart={pos.cart}
                        cartPreview={pos.cartPreview}
                        member={pos.member}
                        members={pos.members}
                        memberQuery={pos.memberQuery}
                        isLoadingMembers={pos.isLoadingMembers}
                        shift={pos.shift}
                        cashReceived={pos.cashReceived}
                        isCheckingOut={pos.isCheckingOut}
                        grandTotal={pos.grandTotal}
                        cashAmount={pos.cashAmount}
                        change={pos.change}
                        totalItems={pos.totalItems}
                        isVisible={mobileTab === 'checkout'}
                        onSetMember={pos.setMember}
                        onMemberQueryChange={pos.setMemberQuery}
                        onFetchMembers={pos.fetchMembers}
                        onSetCashReceived={pos.setCashReceived}
                        onCheckout={pos.handleCheckout}
                        onShiftChange={pos.setShift}
                        isAddingMore={pos.isAddingMore}
                    />
                </div>
            </div>

            <MobileTabBar
                activeTab={mobileTab}
                totalItems={pos.totalItems}
                onTabChange={setMobileTab}
            />
        </AppLayout>
    );
}
