import { Plus, Save, ScanBarcode, Trash2, Warehouse as WarehouseIcon, X } from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';
import ProductSelect from '@/components/inputs/ProductSelect';
import UserSelect from '@/components/inputs/UserSelect';
import WerehouseSelect from '@/components/inputs/WerehouseSelect';
import type { Pagination, Product, ProductStockRow, SalesUser, StockAdjustForm, StockAdjustLine, Warehouse } from './types';

interface Props {
    warehouses: Warehouse[];
    products: Product[];
    stocks: Pagination<ProductStockRow>;
    salesUsers: SalesUser[];
    selectableSalesUsers: SalesUser[];
    stockAdjustForm: StockAdjustForm;
    setStockAdjustForm: Dispatch<SetStateAction<StockAdjustForm>>;
    stockAdjustLines: StockAdjustLine[];
    stockAdjustLoading: boolean;
    stockAdjustProgress: { current: number; total: number } | null;
    setClearListConfirmOpen: Dispatch<SetStateAction<boolean>>;
    addStockAdjustLine: (availableOutStock?: number) => void;
    removeStockAdjustLine: (index: number) => void;
    setConfirmPreviewOpen: Dispatch<SetStateAction<boolean>>;
    onPreviewImage: (url: string) => void;
}

export default function StockAdjustmentSection({
    warehouses,
    products,
    stocks,
    salesUsers,
    selectableSalesUsers,
    stockAdjustForm,
    setStockAdjustForm,
    stockAdjustLines,
    stockAdjustLoading,
    stockAdjustProgress,
    setClearListConfirmOpen,
    addStockAdjustLine,
    removeStockAdjustLine,
    setConfirmPreviewOpen,
    onPreviewImage,
}: Props) {
    const selectedWarehouseId = stockAdjustForm.warehouse_id ? Number(stockAdjustForm.warehouse_id) : null;
    const selectedProductId = stockAdjustForm.product_id ? Number(stockAdjustForm.product_id) : null;
    const selectedStock = (selectedProductId && selectedWarehouseId)
        ? (stocks.data.find((s) => Number(s.product.id) === selectedProductId && Number(s.warehouse.id) === selectedWarehouseId)?.quantity ?? 0)
        : null;

    const reservedOutQuantity = stockAdjustLines.reduce((total, line) => total + Number(line.quantity || 0), 0);
    const remainingOutStock = selectedStock === null ? null : Math.max(0, Number(selectedStock) - reservedOutQuantity);
    const qtyInput = Number(stockAdjustForm.quantity || 0);
    const exceedsOutStock = stockAdjustForm.type === 'out'
        && remainingOutStock !== null
        && qtyInput > remainingOutStock;

    return (
        <section className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <h2 className="mb-4 font-semibold text-gray-900 dark:text-white">Penyesuaian Stok Gudang</h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3 mb-4">
                <div>
                    <WerehouseSelect
                        items={warehouses.map((w) => ({ id: w.id, title: w.name, subtitle: w.code, image: w.file_path ? `/storage/${w.file_path}` : null }))}
                        value={stockAdjustForm.warehouse_id}
                        onChange={(id) => setStockAdjustForm((prev) => ({ ...prev, warehouse_id: id }))}
                        label="Pilih Gudang"
                        placeholder="Cari gudang..."
                        onPreviewImage={(url) => onPreviewImage(String(url))}
                    />
                </div>

                <div>
                    {(() => {
                        const productsWithStock = (products as Product[]).map((p) => {
                            let stockForWarehouse: number | null = null;
                            if (selectedWarehouseId) {
                                const match = stocks.data.find((s) => String(s.product.id) === String(p.id) && String(s.warehouse.id) === String(selectedWarehouseId));
                                if (match) stockForWarehouse = Number(match.quantity);
                            }
                            return ({ ...(p as Product), stock_quantity: typeof stockForWarehouse === 'number' ? stockForWarehouse : 0 } as Product & { stock_quantity: number });
                        });

                        return (
                            <ProductSelect
                                products={productsWithStock}
                                value={stockAdjustForm.product_id}
                                onChange={(id) => setStockAdjustForm((prev) => ({ ...prev, product_id: id }))}
                                placeholder="Ketik nama atau SKU produk..."
                                label="Cari Produk"
                                onPreviewImage={(url) => onPreviewImage(String(url))}
                                selectedStock={stockAdjustForm.type === 'out' ? remainingOutStock : selectedStock}
                            />
                        );
                    })()}
                </div>

                <div>
                    <label className="text-xs font-bold text-zinc-400 px-1 uppercase tracking-tight">Tipe</label>
                    <div className="h-12">
                        <div className="flex gap-2 h-full">
                            <button
                                type="button"
                                onClick={() => setStockAdjustForm((prev) => ({ ...prev, type: 'in', user_id: '' }))}
                                className={`flex-1 h-full rounded-2xl text-sm font-semibold transition-all ${stockAdjustForm.type === 'in' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300'}`}
                            >
                                IN (Tambah Stok)
                            </button>
                            <button
                                type="button"
                                onClick={() => setStockAdjustForm((prev) => ({ ...prev, type: 'out' }))}
                                className={`flex-1 h-full rounded-2xl text-sm font-semibold transition-all ${stockAdjustForm.type === 'out' ? 'bg-rose-500 text-white shadow-lg' : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300'}`}
                            >
                                OUT (Kurang Stok)
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="relative">
                    <label className="text-xs font-bold text-zinc-400 px-1 uppercase tracking-tight">Qty</label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
                            <WarehouseIcon size={18} />
                        </span>
                        <input
                            type="number"
                            min={1}
                            max={stockAdjustForm.type === 'out' && remainingOutStock !== null ? remainingOutStock : undefined}
                            value={stockAdjustForm.quantity}
                            onChange={(event) => setStockAdjustForm((prev) => ({ ...prev, quantity: event.target.value }))}
                            placeholder="Qty"
                            className="rounded-xl border border-gray-300 bg-white w-full h-12 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800"
                        />
                    </div>
                    {stockAdjustForm.type === 'out' && remainingOutStock !== null && (
                        <p className={`mt-1 text-xs ${exceedsOutStock ? 'text-rose-600 dark:text-rose-400' : 'text-zinc-500 dark:text-zinc-400'}`}>
                            Stok tersedia: {selectedStock ?? 0} • Terpakai di daftar: {reservedOutQuantity} • Sisa input: {remainingOutStock}
                        </p>
                    )}
                </div>

                <div>
                    <label className="text-xs font-bold text-zinc-400 px-1 uppercase tracking-tight">Reference</label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
                            <ScanBarcode size={18} />
                        </span>
                        <input
                            value={stockAdjustForm.reference}
                            onChange={(event) => setStockAdjustForm((prev) => ({ ...prev, reference: event.target.value }))}
                            placeholder="Reference (opsional)"
                            className="rounded-xl border border-gray-300 bg-white w-full h-12 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800"
                        />
                    </div>
                </div>

                <div>
                    <UserSelect
                        items={selectableSalesUsers.map((s: SalesUser) => ({
                            id: s.id,
                            title: s.name,
                            subtitle: `ID: ${s.id}${s.phone ? ` • ${s.phone}` : ''}`,
                            image: s.avatar ? `/storage/profiles/${s.avatar}` : null,
                        }))}
                        value={stockAdjustForm.user_id}
                        onChange={(id) => setStockAdjustForm((prev) => ({ ...prev, user_id: id }))}
                        label="Pilih Sales Penerima (OUT)"
                        placeholder="Cari sales..."
                        disabled={stockAdjustForm.type !== 'out'}
                        onPreviewImage={(url) => onPreviewImage(String(url))}
                    />
                </div>
            </div>

            {stockAdjustForm.type === 'out' && (
                <div className="mt-6 flex flex-col gap-4">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3 justify-center items-center text-center">
                        <button
                            type="button"
                            onClick={() => setClearListConfirmOpen(true)}
                            disabled={stockAdjustLoading}
                            className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 shadow-sm ring-1 ring-inset ring-zinc-300 transition-all hover:bg-red-50 hover:text-red-600 hover:ring-red-200 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-900 dark:text-zinc-300 dark:ring-zinc-700 dark:hover:bg-red-950/30 dark:hover:text-red-400 dark:hover:ring-red-900 w-full sm:w-auto justify-center"
                        >
                            <Trash2 size={16} />
                            Kosongkan daftar
                        </button>
                        <button
                            type="button"
                            onClick={() => addStockAdjustLine(remainingOutStock ?? undefined)}
                            disabled={stockAdjustLoading || exceedsOutStock || (remainingOutStock !== null && remainingOutStock <= 0)}
                            className="flex md:col-span-2 items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm ring-1 ring-inset ring-slate-900 transition-all hover:bg-slate-800 hover:shadow disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900 dark:ring-slate-100 dark:hover:bg-slate-200 w-full sm:w-auto justify-center"
                        >
                            <Plus size={16} />
                            Tambahkan ke daftar
                        </button>
                    </div>

                    {stockAdjustLines.length > 0 && (
                        <div className="mt-2 overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                            <div className="divide-y divide-zinc-100 dark:divide-zinc-800/50 min-w-[320px]">
                                {stockAdjustLines.map((line, idx) => {
                                    const user = salesUsers.find((s) => s.id === line.user_id);
                                    return (
                                        <div
                                            key={idx}
                                            className="group relative flex flex-col gap-3 p-4 transition-colors hover:bg-zinc-50/80 sm:flex-row sm:items-center sm:justify-between dark:hover:bg-zinc-800/30"
                                        >
                                            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4 sm:gap-y-2">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300 overflow-hidden border border-slate-200 dark:border-slate-700">
                                                        {user?.avatar ? (
                                                            <img
                                                                src={`/storage/profiles/${user.avatar}`}
                                                                alt={user.name || ''}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            user?.name?.charAt(0).toUpperCase() || 'U'
                                                        )}
                                                    </div>
                                                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                                                        {user?.name || `User ${line.user_id}`}
                                                    </span>
                                                    <span className="ml-2 text-xs text-zinc-500 dark:text-zinc-400">
                                                        ID: {user?.id}
                                                    </span>
                                                    {user?.phone && (
                                                        <span className="ml-2 text-xs text-zinc-500 dark:text-zinc-400">
                                                            • {user.phone}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-3 text-sm">
                                                    <span className="flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                                                        Qty: <span className="text-zinc-900 dark:text-zinc-200">{line.quantity}</span>
                                                    </span>

                                                    {line.reference && (
                                                        <>
                                                            <span className="h-4 w-px bg-zinc-300 dark:bg-zinc-700"></span>
                                                            <span className="text-zinc-600 dark:text-zinc-400">
                                                                Ref: <span className="font-medium text-zinc-900 dark:text-zinc-200">{line.reference}</span>
                                                            </span>
                                                        </>
                                                    )}
                                                </div>

                                                {line.note && (
                                                    <>
                                                        <span className="hidden h-4 w-px bg-zinc-300 sm:block dark:bg-zinc-700"></span>
                                                        <span className="text-sm italic text-zinc-500 dark:text-zinc-500">
                                                            "{line.note}"
                                                        </span>
                                                    </>
                                                )}
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => removeStockAdjustLine(idx)}
                                                disabled={stockAdjustLoading}
                                                className="absolute right-4 top-4 rounded-lg p-2 text-zinc-400 opacity-100 transition-all hover:bg-red-50 hover:text-red-600 disabled:opacity-50 sm:relative sm:right-auto sm:top-auto sm:opacity-0 sm:group-hover:opacity-100 dark:hover:bg-red-950/50 dark:hover:text-red-400"
                                                aria-label="Remove item"
                                            >
                                                <X size={16} strokeWidth={2.5} />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div className="mt-4 flex justify-end items-center gap-4">
                {stockAdjustLoading && stockAdjustProgress && (
                    <div className="text-sm text-zinc-600 dark:text-zinc-300">Menyimpan {stockAdjustProgress.current}/{stockAdjustProgress.total}...</div>
                )}
                <button
                    onClick={() => setConfirmPreviewOpen(true)}
                    disabled={
                        stockAdjustLoading
                        || !stockAdjustForm.product_id
                        || !stockAdjustForm.warehouse_id
                        || (stockAdjustLines.length === 0 && !stockAdjustForm.quantity)
                        || (stockAdjustForm.type === 'out' && stockAdjustLines.length === 0 && !stockAdjustForm.user_id)
                        || (stockAdjustForm.type === 'out' && stockAdjustLines.length === 0 && exceedsOutStock)
                        || (stockAdjustForm.type === 'out' && stockAdjustLines.length === 0 && remainingOutStock !== null && remainingOutStock <= 0)
                    }
                    className="group flex items-center justify-center gap-2.5 rounded-xl px-5 py-3 text-sm font-semibold text-white bg-linear-to-br from-orange-500 to-orange-600 shadow-lg shadow-orange-500/50 ring-1 ring-inset ring-white/5 transition-all duration-200 hover:from-orange-400 hover:to-orange-500 hover:shadow-orange-500/60 disabled:cursor-not-allowed disabled:opacity-70 dark:shadow-orange-900/40"
                >
                    <div className="flex items-center justify-center gap-2">
                        <Save size={16} />
                        <span>{stockAdjustLoading && !stockAdjustProgress ? 'Menyimpan...' : 'Simpan Penyesuaian'}</span>
                    </div>
                </button>
            </div>
        </section>
    );
}
