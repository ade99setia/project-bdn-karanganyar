import { Head, router, usePage } from '@inertiajs/react';
import axios from 'axios';
import imageCompression from 'browser-image-compression';
import { Warehouse as WarehouseIcon, Plus, Pencil, Trash2, Save, X, ImageIcon, ScanBarcode, Upload } from 'lucide-react';
import { useCallback, useEffect, useState, useMemo, useRef } from 'react';
import ProductMultiSelect from '@/components/inputs/ProductMultiSelect';
import ProductSelect from '@/components/inputs/ProductSelect';
import UserMultiSelect from '@/components/inputs/UserMultiSelect';
import UserSelect from '@/components/inputs/UserSelect';
import WerehouseMultiSelect from '@/components/inputs/WerehouseMultiSelect';
import WerehouseSelect from '@/components/inputs/WerehouseSelect';
import AlertModal from '@/components/modal/alert-modal';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import type { BreadcrumbItem } from '@/types';

interface Warehouse {
    id: number;
    name: string;
    code: string;
    file_path?: string | null;
    is_active: boolean;
}

interface Product {
    id: number;
    name: string;
    sku: string;
    category?: string | null;
    file_path?: string | null;
}

interface SalesUser {
    id: number;
    name: string;
    warehouse_id: number | null;
}

interface SalesStockSummaryRow {
    id: number;
    quantity: number;
    user: {
        id: number | null;
        name: string | null;
    };
    warehouse: {
        id: number | null;
        name: string | null;
        code: string | null;
    };
    product: {
        id: number | null;
        name: string | null;
        sku: string | null;
        category?: string | null;
    };
}

interface ProductStockRow {
    id: number;
    quantity: number;
    product: Product;
    warehouse: Warehouse;
}

interface SalesVisitRef {
    id: number;
    activity_type: string;
    visited_at: string;
}

interface StockMovementRow {
    id: number;
    type: 'in' | 'out';
    quantity: number;
    reference?: string | null;
    note?: string | null;
    created_at: string;
    product: Pick<Product, 'id' | 'name' | 'sku'>;
    warehouse: Warehouse;
    sales_visit?: SalesVisitRef | null;
}

interface Pagination<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface PageProps {
    stocks: Pagination<ProductStockRow>;
    movements: StockMovementRow[];
    products: Product[];
    salesStockSummaries: SalesStockSummaryRow[];
    salesUsers: SalesUser[];
    warehouses: Warehouse[];
    filters: {
        warehouse_id?: number;
        search?: string;
        per_page?: number;
    };
    flash?: {
        success?: string;
        error?: string;
        warning?: string;
        info?: string;
    };
    [key: string]: unknown;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Stockist Settings',
        href: '/settings/stockist',
    },
];

export default function StockistSettings() {
    const { stocks, movements, products, salesStockSummaries, salesUsers, warehouses, filters, flash } = usePage<PageProps>().props;

    const [searchInput, setSearchInput] = useState(filters.search || '');
    const [warehouseFilter, setWarehouseFilter] = useState<number | undefined>(filters.warehouse_id);
    const [warehouseForm, setWarehouseForm] = useState({ name: '', code: '', is_active: true });
    const [warehouseLoading, setWarehouseLoading] = useState(false);
    const createFileInputRef = useRef<HTMLInputElement | null>(null);
    const [warehouseCreateFile, setWarehouseCreateFile] = useState<File | null>(null);
    const [editingWarehouseId, setEditingWarehouseId] = useState<number | null>(null);
    const [warehouseEditForm, setWarehouseEditForm] = useState({ name: '', code: '', is_active: true });
    const [warehouseEditFile, setWarehouseEditFile] = useState<File | null>(null);
    const [stockAdjustLoading, setStockAdjustLoading] = useState(false);
    const [stockAdjustProgress, setStockAdjustProgress] = useState<{ current: number; total: number } | null>(null);

    const [alertConfig, setAlertConfig] = useState({ isOpen: false, title: '', message: '', type: 'info' as 'success' | 'error' | 'warning' | 'info' });
    const showAlert = (title: string, message: React.ReactNode, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
        setAlertConfig({ isOpen: true, title, message: String(message), type });
    };
    const [stockAdjustForm, setStockAdjustForm] = useState({
        product_id: '',
        warehouse_id: '',
        user_id: '',
        type: 'in' as 'in' | 'out',
        quantity: '',
        reference: '',
        note: '',
    });

    const selectableSalesUsers = salesUsers.filter((salesUser) => {
        if (!stockAdjustForm.warehouse_id) {
            return true;
        }

        return Number(salesUser.warehouse_id) === Number(stockAdjustForm.warehouse_id);
    });

    const [selectedProductIds, setSelectedProductIds] = useState<Array<string | number>>([]);
    const [selectedWarehouseIds, setSelectedWarehouseIds] = useState<Array<string | number>>([]);
    const [selectedUserIds, setSelectedUserIds] = useState<Array<string | number>>([]);
    const [stockAdjustLines, setStockAdjustLines] = useState<Array<{ user_id: number; quantity: number; reference?: string | null; note?: string | null }>>([]);

    const filteredSalesStockSummaries = useMemo(() => {
        const q = (searchInput || '').trim().toLowerCase();
        const sel = selectedProductIds.map(String);
        const usel = selectedUserIds.map(String);
        const wsel = selectedWarehouseIds.length > 0 ? selectedWarehouseIds.map(String) : (warehouseFilter ? [String(warehouseFilter)] : []);
        return salesStockSummaries.filter((row) => {
            if (wsel.length > 0) {
                if (!row.warehouse?.id) return false;
                if (!wsel.includes(String(row.warehouse.id))) return false;
            }
            if (usel.length > 0) {
                if (!row.user?.id) return false;
                if (!usel.includes(String(row.user.id))) return false;
            }
            if (sel.length > 0) {
                if (!row.product?.id) return false;
                if (!sel.includes(String(row.product.id))) return false;
            }
            if (!q) return true;

            return (
                (row.product?.name || '').toLowerCase().includes(q)
                || (row.product?.sku || '').toLowerCase().includes(q)
                || (row.product?.category || '').toLowerCase().includes(q)
                || (row.user?.name || '').toLowerCase().includes(q)
                || (row.warehouse?.name || '').toLowerCase().includes(q)
                || (row.warehouse?.code || '').toLowerCase().includes(q)
            );
        });
    }, [salesStockSummaries, searchInput, warehouseFilter, selectedProductIds, selectedWarehouseIds, selectedUserIds]);

    const filteredMovements = useMemo(() => {
        const q = (searchInput || '').trim().toLowerCase();
        const sel = selectedProductIds.map(String);
        const wsel = selectedWarehouseIds.length > 0 ? selectedWarehouseIds.map(String) : (warehouseFilter ? [String(warehouseFilter)] : []);
        return movements.filter((m) => {
            if (wsel.length > 0) {
                if (!m.warehouse?.id) return false;
                if (!wsel.includes(String(m.warehouse.id))) return false;
            }
            if (sel.length > 0) {
                if (!m.product?.id) return false;
                if (!sel.includes(String(m.product.id))) return false;
            }
            if (!q) return true;

            return (
                (m.product?.name || '').toLowerCase().includes(q)
                || (m.product?.sku || '').toLowerCase().includes(q)
                || (m.warehouse?.name || '').toLowerCase().includes(q)
                || (m.warehouse?.code || '').toLowerCase().includes(q)
                || (m.reference || '').toLowerCase().includes(q)
                || (m.type || '').toLowerCase().includes(q)
            );
        });
    }, [movements, searchInput, warehouseFilter, selectedProductIds, selectedWarehouseIds]);

    const updateFilters = useCallback(
        (newFilters: { search?: string; warehouse_id?: number; page?: number }) => {
            const hasWarehouseFilter = Object.prototype.hasOwnProperty.call(newFilters, 'warehouse_id');
            const nextWarehouseId = hasWarehouseFilter ? newFilters.warehouse_id : warehouseFilter;

            router.get(
                '/settings/stockist',
                {
                    search: newFilters.search ?? (searchInput || undefined),
                    warehouse_id: nextWarehouseId,
                    page: newFilters.page,
                },
                {
                    preserveState: true,
                    replace: true,
                    preserveScroll: true,
                }
            );
        },
        [searchInput, warehouseFilter]
    );

    useEffect(() => {
        const timer = setTimeout(() => {
            if ((filters.search || '') !== searchInput) {
                updateFilters({ search: searchInput || undefined, page: 1 });
            }
        }, 450);

        return () => clearTimeout(timer);
    }, [searchInput, filters.search, updateFilters]);

    const createWarehouse = async () => {
        if (!warehouseForm.name.trim() || !warehouseForm.code.trim()) {
            return;
        }

        setWarehouseLoading(true);
        const payload = new FormData();
        payload.append('name', warehouseForm.name.trim());
        payload.append('code', warehouseForm.code.trim());
        payload.append('is_active', warehouseForm.is_active ? '1' : '0');
        if (warehouseCreateFile) {
            try {
                const compressed = await imageCompression(warehouseCreateFile, {
                    maxSizeMB: 0.35,
                    maxWidthOrHeight: 1024,
                    fileType: 'image/webp',
                    initialQuality: 0.72,
                    useWebWorker: false,
                });
                payload.append('image', compressed as Blob, 'warehouse.webp');
            } catch {
                // fallback to original file if compression fails
                payload.append('image', warehouseCreateFile);
            }
        }

        const options: Record<string, unknown> = {
            preserveScroll: true,
            onSuccess: () => {
                setWarehouseForm({ name: '', code: '', is_active: true });
                setWarehouseCreateFile(null);
                if (createFileInputRef.current) createFileInputRef.current.value = '';
            },
            onFinish: () => setWarehouseLoading(false),
        };

        router.post('/settings/warehouses', payload, options);
    };

    const startEditWarehouse = (warehouse: Warehouse) => {
        setEditingWarehouseId(warehouse.id);
        setWarehouseEditForm({
            name: warehouse.name,
            code: warehouse.code,
            is_active: warehouse.is_active,
        });
        setWarehouseEditFile(null);
    };

    const cancelEditWarehouse = () => {
        setEditingWarehouseId(null);
        setWarehouseEditForm({ name: '', code: '', is_active: true });
    };

    const saveWarehouseUpdate = async () => {
        if (!editingWarehouseId) return;
        if (!warehouseEditForm.name.trim() || !warehouseEditForm.code.trim()) return;

        setWarehouseLoading(true);
        const payload = new FormData();
        payload.append('name', warehouseEditForm.name.trim());
        payload.append('code', warehouseEditForm.code.trim());
        payload.append('is_active', warehouseEditForm.is_active ? '1' : '0');
        // For Laravel to accept PUT via FormData
        payload.append('_method', 'PUT');
        if (warehouseEditFile) {
            try {
                const compressed = await imageCompression(warehouseEditFile, {
                    maxSizeMB: 0.35,
                    maxWidthOrHeight: 1024,
                    fileType: 'image/webp',
                    initialQuality: 0.72,
                    useWebWorker: false,
                });
                payload.append('image', compressed as Blob, 'warehouse.webp');
            } catch {
                payload.append('image', warehouseEditFile);
            }
        }

        const options: Record<string, unknown> = {
            preserveScroll: true,
            onSuccess: () => cancelEditWarehouse(),
            onFinish: () => setWarehouseLoading(false),
        };

        router.post(`/settings/warehouses/${editingWarehouseId}`, payload, options);
    };

    const deleteWarehouse = (warehouse: Warehouse) => {
        if (!confirm(`Hapus gudang ${warehouse.name} (${warehouse.code})?`)) {
            return;
        }

        setWarehouseLoading(true);
        router.delete(`/settings/warehouses/${warehouse.id}`, {
            preserveScroll: true,
            onFinish: () => setWarehouseLoading(false),
        });
    };

    const submitStockAdjustment = async () => {
        if (!stockAdjustForm.product_id || !stockAdjustForm.warehouse_id) {
            return;
        }

        // If there are queued lines, we'll post them one-by-one (sequential queue)
        if (stockAdjustLines.length > 0) {
            setStockAdjustLoading(true);
            setStockAdjustProgress({ current: 0, total: stockAdjustLines.length });

            for (let i = 0; i < stockAdjustLines.length; i += 1) {
                const line = stockAdjustLines[i];
                setStockAdjustProgress({ current: i + 1, total: stockAdjustLines.length });

                const payload = {
                    product_id: Number(stockAdjustForm.product_id),
                    warehouse_id: Number(stockAdjustForm.warehouse_id),
                    type: stockAdjustForm.type,
                    user_id: stockAdjustForm.type === 'out' ? Number(line.user_id) : null,
                    quantity: Number(line.quantity),
                    reference: line.reference ?? null,
                    note: line.note ?? null,
                };

                try {
                    await axios.post('/settings/stocks/adjust', payload);
                } catch (err: unknown) {
                    let msg = `Gagal menyimpan baris ${i + 1}`;
                    if (typeof err === 'object' && err !== null) {
                        const errorObj = err as { response?: { status?: number; data?: { message?: string } }, message?: string };
                        if (errorObj.response) {
                            const status = errorObj.response.status;
                            msg += ` (status ${status})`;
                            if (errorObj.response.data?.message) msg += `: ${errorObj.response.data.message}`;
                        } else if (errorObj.message) {
                            msg += `: ${errorObj.message}`;
                        }
                    }
                    alert(msg);
                }
            }

            // finished queue
            setStockAdjustLines([]);
            setStockAdjustForm((prev) => ({
                ...prev,
                user_id: prev.type === 'out' ? prev.user_id : '',
                quantity: '',
                reference: '',
                note: '',
            }));
            setStockAdjustLoading(false);
            setStockAdjustProgress(null);

            showAlert('Berhasil', 'Semua baris penyesuaian berhasil disimpan.', 'success');
            router.reload({ only: ['stocks', 'movements', 'salesStockSummaries'] });
            return;
        }

        // Single entry flow
        if (!stockAdjustForm.quantity) return;
        if (stockAdjustForm.type === 'out' && !stockAdjustForm.user_id) return;

        setStockAdjustLoading(true);
        router.post('/settings/stocks/adjust', {
            product_id: Number(stockAdjustForm.product_id),
            warehouse_id: Number(stockAdjustForm.warehouse_id),
            type: stockAdjustForm.type,
            user_id: stockAdjustForm.type === 'out' ? Number(stockAdjustForm.user_id) : null,
            quantity: Number(stockAdjustForm.quantity),
            reference: stockAdjustForm.reference.trim() || null,
            note: stockAdjustForm.note.trim() || null,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setStockAdjustForm((prev) => ({
                    ...prev,
                    user_id: prev.type === 'out' ? prev.user_id : '',
                    quantity: '',
                    reference: '',
                    note: '',
                }));
                showAlert('Berhasil', 'Penyesuaian stok berhasil disimpan.', 'success');
                router.reload({ only: ['stocks', 'movements', 'salesStockSummaries'] });
            },
            onFinish: () => setStockAdjustLoading(false),
        });
    };

    const addStockAdjustLine = () => {
        if (!stockAdjustForm.user_id || !stockAdjustForm.quantity) return;

        const line = {
            user_id: Number(stockAdjustForm.user_id),
            quantity: Number(stockAdjustForm.quantity),
            reference: stockAdjustForm.reference.trim() || null,
            note: stockAdjustForm.note.trim() || null,
        };

        setStockAdjustLines((prev) => [...prev, line]);

        setStockAdjustForm((prev) => ({
            ...prev,
            user_id: prev.type === 'out' ? '' : '',
            quantity: '',
            reference: '',
            note: '',
        }));
    };

    const removeStockAdjustLine = (index: number) => {
        setStockAdjustLines((prev) => prev.filter((_, i) => i !== index));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Stockist Settings" />

            <SettingsLayout>
                <div className="space-y-6">
                    {(flash?.success || flash?.error || flash?.warning || flash?.info) && (
                        <div
                            className={`rounded-xl border px-4 py-3 text-sm ${flash?.success
                                ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300'
                                : flash?.error
                                    ? 'border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-700 dark:bg-rose-900/20 dark:text-rose-300'
                                    : 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                                }`}
                        >
                            {flash?.success || flash?.error || flash?.warning || flash?.info}
                        </div>
                    )}

                    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                        <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
                            <WarehouseIcon className="h-7 w-7 text-indigo-600" />
                            Stockist (Gudang & Kontrol Stok)
                        </h1>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                            Monitor stok per gudang dan audit pergerakan stok dari flow pengiriman / retur.
                        </p>
                    </section>

                    <section className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                        <h2 className="mb-4 font-semibold text-gray-900 dark:text-white">Manajemen Gudang</h2>

                        <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-4">

                            <div className="relative">
                                <input
                                    value={warehouseForm.name}
                                    onChange={(e) => setWarehouseForm((prev) => ({ ...prev, name: e.target.value }))}
                                    placeholder="Nama gudang"
                                    className="w-full rounded-xl border border-gray-300 bg-white pl-3.5 pr-12 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:focus:border-indigo-400 dark:focus:ring-indigo-400/30 transition-all duration-200"
                                />
                                <input
                                    ref={createFileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => setWarehouseCreateFile(e.target.files?.[0] ?? null)}
                                />
                                <button
                                    type="button"
                                    onClick={() => createFileInputRef.current?.click()}
                                    title="Upload foto gudang"
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-gray-400 hover:text-indigo-500 hover:bg-indigo-50/80 dark:text-gray-500 dark:hover:text-indigo-400 dark:hover:bg-indigo-900/30 transition-colors duration-150"
                                >
                                    <Upload className="h-5 w-5" />
                                </button>
                            </div>

                            <input
                                value={warehouseForm.code}
                                onChange={(e) => setWarehouseForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
                                placeholder="Kode (unik)"
                                className="rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:focus:border-indigo-400 dark:focus:ring-indigo-400/30 transition-all duration-200"
                            />

                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setWarehouseForm((prev) => ({ ...prev, is_active: true }))}
                                    className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition-all duration-200 ${warehouseForm.is_active ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800/70 dark:text-gray-300 dark:hover:bg-gray-700'}`}
                                >
                                    Aktif
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setWarehouseForm((prev) => ({ ...prev, is_active: false }))}
                                    className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition-all duration-200 ${!warehouseForm.is_active ? 'bg-rose-600 text-white shadow-md shadow-rose-500/30' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800/70 dark:text-gray-300 dark:hover:bg-gray-700'}`}
                                >
                                    Nonaktif
                                </button>
                            </div>

                            <button
                                onClick={createWarehouse}
                                disabled={warehouseLoading || !warehouseForm.name.trim() || !warehouseForm.code.trim()}
                                className="group flex items-center justify-center gap-2 rounded-xl bg-linear-to-br from-orange-500 to-orange-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/40 ring-1 ring-inset ring-white/10 hover:from-orange-400 hover:to-orange-500 hover:shadow-orange-500/50 disabled:cursor-not-allowed disabled:opacity-60 transition-all duration-200 dark:shadow-orange-900/30"
                            >
                                <Plus className="h-4 w-4 transition-transform group-hover:scale-110" />
                                Tambah Gudang
                            </button>

                        </div>

                        {/* TABEL GUDANG */}
                        <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-800">
                            <table className="min-w-full text-sm">
                                <thead className="bg-gray-50 text-left dark:bg-gray-800/60">
                                    <tr>
                                        <th className="w-16 px-4 py-3 text-center">Foto</th>
                                        <th className="px-3 py-3">Nama</th>
                                        <th className="px-3 py-3">Kode</th>
                                        <th className="px-3 py-3">Status</th>
                                        <th className="px-3 py-3 text-center">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {warehouses.map((warehouse) => {
                                        const isEditing = editingWarehouseId === warehouse.id;

                                        return (
                                            <tr key={warehouse.id} className="transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-800/30">

                                                <td className="px-4 py-2.5 text-center">
                                                    {isEditing ? (
                                                        <div className="relative mx-auto flex h-10 w-10 cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 transition-colors hover:border-indigo-400 dark:border-gray-700 dark:bg-gray-800">
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                className="absolute inset-0 z-50 h-full w-full cursor-pointer opacity-0"
                                                                onChange={(e) => setWarehouseEditFile(e.target.files?.[0] ?? null)}
                                                            />
                                                            <Upload className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                                                        </div>
                                                    ) : (
                                                        <div className="mx-auto flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                                                            {warehouse.file_path ? (
                                                                <img src={`/storage/${warehouse.file_path}`} alt={warehouse.name} className="h-full w-full object-cover" />
                                                            ) : (
                                                                <ImageIcon className="h-4 w-4 text-gray-300 dark:text-gray-600" />
                                                            )}
                                                        </div>
                                                    )}
                                                </td>

                                                <td className="px-3 py-2.5">
                                                    {isEditing ? (
                                                        <input
                                                            value={warehouseEditForm.name}
                                                            onChange={(event) => setWarehouseEditForm((prev) => ({ ...prev, name: event.target.value }))}
                                                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900"
                                                        />
                                                    ) : (
                                                        <span className="font-medium text-gray-900 dark:text-gray-100">{warehouse.name}</span>
                                                    )}
                                                </td>
                                                <td className="px-3 py-2.5">
                                                    {isEditing ? (
                                                        <input
                                                            value={warehouseEditForm.code}
                                                            onChange={(event) => setWarehouseEditForm((prev) => ({ ...prev, code: event.target.value.toUpperCase() }))}
                                                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900"
                                                        />
                                                    ) : (
                                                        <span className="rounded-md bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-400">{warehouse.code}</span>
                                                    )}
                                                </td>
                                                <td className="px-3 py-2.5">
                                                    {isEditing ? (
                                                        <div className="flex gap-1.5">
                                                            <button
                                                                type="button"
                                                                onClick={() => setWarehouseEditForm((prev) => ({ ...prev, is_active: true }))}
                                                                className={`rounded-lg px-2 py-1.5 text-xs font-semibold transition-all ${warehouseEditForm.is_active ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}
                                                            >
                                                                Aktif
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => setWarehouseEditForm((prev) => ({ ...prev, is_active: false }))}
                                                                className={`rounded-lg px-2 py-1.5 text-xs font-semibold transition-all ${!warehouseEditForm.is_active ? 'bg-rose-500 text-white' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}
                                                            >
                                                                Nonaktif
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${warehouse.is_active ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20' : 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/10 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-500/20'}`}>
                                                            {warehouse.is_active ? 'Aktif' : 'Nonaktif'}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-3 py-2.5">
                                                    <div className="flex items-center justify-center gap-2">
                                                        {isEditing ? (
                                                            <>
                                                                <button
                                                                    onClick={saveWarehouseUpdate}
                                                                    disabled={warehouseLoading || !warehouseEditForm.name.trim() || !warehouseEditForm.code.trim()}
                                                                    className="rounded-lg bg-indigo-600 p-2 text-white shadow-sm hover:bg-indigo-700 disabled:opacity-70"
                                                                >
                                                                    <Save className="h-4 w-4" />
                                                                </button>
                                                                <button
                                                                    onClick={cancelEditWarehouse}
                                                                    disabled={warehouseLoading}
                                                                    className="rounded-lg border border-gray-300 bg-white p-2 text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-70 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                                                                >
                                                                    <X className="h-4 w-4" />
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <button
                                                                    onClick={() => startEditWarehouse(warehouse)}
                                                                    disabled={warehouseLoading}
                                                                    className="rounded-lg bg-indigo-50 p-2 text-indigo-600 transition-colors hover:bg-indigo-100 disabled:opacity-70 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50"
                                                                >
                                                                    <Pencil className="h-4 w-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => deleteWarehouse(warehouse)}
                                                                    disabled={warehouseLoading}
                                                                    className="rounded-lg bg-rose-50 p-2 text-rose-600 transition-colors hover:bg-rose-100 disabled:opacity-70 dark:bg-rose-900/30 dark:text-rose-400 dark:hover:bg-rose-900/50"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <section className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                        <h2 className="mb-4 font-semibold text-gray-900 dark:text-white">Penyesuaian Stok Gudang</h2>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-3 mb-4">

                            <div>
                                <WerehouseSelect
                                    items={warehouses.map(w => ({ id: w.id, title: w.name, subtitle: w.code }))}
                                    value={stockAdjustForm.warehouse_id}
                                    onChange={(id) => setStockAdjustForm((prev) => ({ ...prev, warehouse_id: id }))}
                                    label="Pilih Gudang"
                                    placeholder="Cari gudang..."
                                />
                            </div>

                            <div>
                                {(() => {
                                    const selectedWarehouseId = stockAdjustForm.warehouse_id ? Number(stockAdjustForm.warehouse_id) : null;

                                    // Build products list annotated with stock for the selected warehouse (if any)
                                    const productsWithStock = (products as Product[]).map((p) => {
                                        let stockForWarehouse: number | null = null;
                                        if (selectedWarehouseId) {
                                            const match = stocks.data.find(s => Number(s.product.id) === Number(p.id) && Number(s.warehouse.id) === selectedWarehouseId);
                                            if (match) stockForWarehouse = Number(match.quantity);
                                        }
                                        // Cast to Product & { stock_quantity: number }
                                        return ({ ...(p as Product), stock_quantity: typeof stockForWarehouse === 'number' ? stockForWarehouse : 0 } as Product & { stock_quantity: number });
                                    });

                                    const selectedProductId = stockAdjustForm.product_id ? Number(stockAdjustForm.product_id) : null;
                                    const selectedStock = (selectedProductId && selectedWarehouseId)
                                        ? (stocks.data.find(s => Number(s.product.id) === selectedProductId && Number(s.warehouse.id) === selectedWarehouseId)?.quantity ?? null)
                                        : null;

                                    return (
                                        <ProductSelect
                                            products={productsWithStock}
                                            value={stockAdjustForm.product_id}
                                            onChange={(id) => setStockAdjustForm((prev) => ({ ...prev, product_id: id }))}
                                            placeholder="Ketik nama atau SKU produk..."
                                            label="Cari Produk"
                                            onPreviewImage={(url) => window.open(url, '_blank')}
                                            selectedStock={selectedStock ?? null}
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
                            <div>
                                <UserSelect
                                    items={selectableSalesUsers.map(s => ({ id: s.id, title: s.name }))}
                                    value={stockAdjustForm.user_id}
                                    onChange={(id) => setStockAdjustForm((prev) => ({ ...prev, user_id: id }))}
                                    label="Pilih Sales Penerima (OUT)"
                                    placeholder="Cari sales..."
                                    disabled={stockAdjustForm.type !== 'out'}
                                />
                            </div>

                            <div className="relative">
                                <label className="text-xs font-bold text-zinc-400 px-1 uppercase tracking-tight">Qty</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
                                        <WarehouseIcon size={18} />
                                    </span>
                                    <input
                                        type="number"
                                        min={1}
                                        value={stockAdjustForm.quantity}
                                        onChange={(event) => setStockAdjustForm((prev) => ({ ...prev, quantity: event.target.value }))}
                                        placeholder="Qty"
                                        className="rounded-xl border border-gray-300 bg-white w-full h-12 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800"
                                    />
                                </div>
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

                            {/* <div>
                                <label className="text-xs font-bold text-zinc-400 px-1 uppercase tracking-tight">Catatan</label>
                                <input
                                    value={stockAdjustForm.note}
                                    onChange={(event) => setStockAdjustForm((prev) => ({ ...prev, note: event.target.value }))}
                                    placeholder="Catatan (opsional)"
                                    className="rounded-xl border border-gray-300 bg-white w-full h-12 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800"
                                />
                            </div> */}

                        </div>

                        {stockAdjustForm.type === 'out' && (
                            <div className="mt-6 flex flex-col gap-4">
                                {/* ACTION BUTTONS */}
                                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 justify-center items-center text-center">
                                    <button
                                        type="button"
                                        onClick={addStockAdjustLine}
                                        disabled={stockAdjustLoading}
                                        className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm ring-1 ring-inset ring-slate-900 transition-all hover:bg-slate-800 hover:shadow disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900 dark:ring-slate-100 dark:hover:bg-slate-200 w-full sm:w-auto justify-center"
                                    >
                                        <Plus size={16} />
                                        Tambahkan ke daftar
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setStockAdjustLines([])}
                                        disabled={stockAdjustLoading}
                                        className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 shadow-sm ring-1 ring-inset ring-zinc-300 transition-all hover:bg-red-50 hover:text-red-600 hover:ring-red-200 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-900 dark:text-zinc-300 dark:ring-zinc-700 dark:hover:bg-red-950/30 dark:hover:text-red-400 dark:hover:ring-red-900 w-full sm:w-auto justify-center"
                                    >
                                        <Trash2 size={16} />
                                        Kosongkan daftar
                                    </button>
                                </div>

                                {/* LIST CONTAINER */}
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
                                                                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                                                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                                                                </div>
                                                                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                                                                    {user?.name || `User ${line.user_id}`}
                                                                </span>
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
                                onClick={submitStockAdjustment}
                                disabled={
                                    stockAdjustLoading
                                    || !stockAdjustForm.product_id
                                    || !stockAdjustForm.warehouse_id
                                    || (stockAdjustLines.length === 0 && !stockAdjustForm.quantity)
                                    || (stockAdjustForm.type === 'out' && stockAdjustLines.length === 0 && !stockAdjustForm.user_id)
                                }
                                className="group flex items-center justify-center gap-2.5 rounded-xl px-5 py-3 text-sm font-semibold text-white bg-linear-to-br from-orange-500 to-orange-600 shadow-lg shadow-orange-500/50 ring-1 ring-inset ring-white/5 transition-all duration-200 hover:from-orange-400 hover:to-orange-500 hover:shadow-orange-500/60 disabled:cursor-not-allowed disabled:opacity-70 dark:shadow-orange-900/40"                            >
                                <div className="flex items-center justify-center gap-2">
                                    <Save size={16} />
                                    <span>{stockAdjustLoading && !stockAdjustProgress ? 'Menyimpan...' : 'Simpan Penyesuaian'}</span>
                                </div>
                            </button>
                        </div>
                    </section>

                    <AlertModal
                        isOpen={alertConfig.isOpen}
                        onClose={() => setAlertConfig((prev) => ({ ...prev, isOpen: false }))}
                        title={alertConfig.title}
                        message={alertConfig.message}
                        type={alertConfig.type}
                    />

                    <section className="grid grid-cols-1 gap-4 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900 md:grid-cols-2">
                        <div>
                            <ProductMultiSelect
                                items={products.map(p => ({ id: p.id, title: p.name, subtitle: p.sku }))}
                                value={selectedProductIds}
                                onChange={(ids) => setSelectedProductIds(ids)}
                                onQueryChange={(q) => setSearchInput(q)}
                                placeholder="Nama / SKU / kategori"
                                label="Cari Produk"
                            />
                        </div>

                        <div>
                            <WerehouseMultiSelect
                                items={warehouses.map(w => ({ id: w.id, title: w.name, subtitle: w.code }))}
                                value={selectedWarehouseIds}
                                onChange={(ids) => {
                                    setSelectedWarehouseIds(ids);
                                    if (ids.length === 1) {
                                        const v = Number(ids[0]);
                                        setWarehouseFilter(v);
                                        updateFilters({ warehouse_id: v, page: 1 });
                                    } else {
                                        setWarehouseFilter(undefined);
                                        updateFilters({ warehouse_id: undefined, page: 1 });
                                    }
                                }}
                                placeholder="Gudang"
                                label="Cari Gudang"
                            />
                        </div>
                    </section>

                    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
                        <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-800">
                            <h2 className="font-semibold text-gray-900 dark:text-white">Stok Bawaan per Sales</h2>
                        </div>

                        <div className="m-4">
                            <UserMultiSelect
                                items={salesUsers.map(s => ({ id: s.id, title: s.name, image: (s as SalesUser & { avatar?: string }).avatar }))}
                                value={selectedUserIds}
                                onChange={(ids) => setSelectedUserIds(ids)}
                                placeholder="Cari nama sales..."
                            />
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead className="bg-gray-50 text-left dark:bg-gray-800/60">
                                    <tr>
                                        <th className="px-4 py-3">Sales</th>
                                        <th className="px-4 py-3">Gudang</th>
                                        <th className="px-4 py-3">Produk</th>
                                        <th className="px-4 py-3">SKU</th>
                                        <th className="px-4 py-3 text-right">Qty Bawaan</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredSalesStockSummaries.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                                                Belum ada stok bawaan sales.
                                            </td>
                                        </tr>
                                    )}
                                    {filteredSalesStockSummaries.map((row) => (
                                        <tr key={row.id} className="border-t border-gray-100 dark:border-gray-800">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-800 shrink-0 border border-zinc-200 dark:border-zinc-700">
                                                        {(() => {
                                                            const u = salesUsers.find(s => String(s.id) === String(row.user.id)) as (SalesUser & { avatar?: string }) | undefined;
                                                            const avatar = u?.avatar;
                                                            if (avatar) {
                                                                return <img src={avatar} alt={row.user.name || ''} className="w-full h-full object-cover" />;
                                                            }
                                                            return <div className="w-full h-full flex items-center justify-center"><ImageIcon size={16} className="text-zinc-400" /></div>;
                                                        })()}
                                                    </div>
                                                    <div className="min-w-0 truncate">{row.user.name || '-'}</div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">{row.warehouse.name ? `${row.warehouse.name} (${row.warehouse.code})` : '-'}</td>
                                            <td className="px-4 py-3">{row.product.name || '-'}</td>
                                            <td className="px-4 py-3">{row.product.sku || '-'}</td>
                                            <td className="px-4 py-3 text-right font-semibold">{row.quantity}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
                        <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-800">
                            <h2 className="font-semibold text-gray-900 dark:text-white">Stok Saat Ini</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead className="bg-gray-50 text-left dark:bg-gray-800/60">
                                    <tr>
                                        <th className="px-4 py-3">Produk</th>
                                        <th className="px-4 py-3">SKU</th>
                                        <th className="px-4 py-3">Kategori</th>
                                        <th className="px-4 py-3">Gudang</th>
                                        <th className="px-4 py-3 text-right">Qty</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stocks.data.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                                                Belum ada data stok.
                                            </td>
                                        </tr>
                                    )}
                                    {stocks.data.map((row) => (
                                        <tr key={row.id} className="border-t border-gray-100 dark:border-gray-800">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-800 shrink-0 border border-zinc-200 dark:border-zinc-700">
                                                        {row.product && row.product.file_path ? (
                                                            <img src={`/storage/${row.product.file_path}`} alt={row.product.name || ''} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center"><ImageIcon size={16} className="text-zinc-400" /></div>
                                                        )}
                                                    </div>
                                                    <div className="min-w-0 truncate font-medium text-gray-900 dark:text-white">{row.product.name}</div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">{row.product.sku}</td>
                                            <td className="px-4 py-3">{row.product.category || '-'}</td>
                                            <td className="px-4 py-3">
                                                {row.warehouse.name} ({row.warehouse.code})
                                            </td>
                                            <td className="px-4 py-3 text-right font-semibold">{row.quantity}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 text-sm dark:border-gray-800">
                            <p className="text-gray-600 dark:text-gray-400">
                                Total data: {stocks.total} | Halaman {stocks.current_page} / {stocks.last_page}
                            </p>
                            <div className="flex gap-2">
                                <button
                                    disabled={stocks.current_page <= 1}
                                    onClick={() => updateFilters({ page: stocks.current_page - 1 })}
                                    className="rounded-lg border border-gray-300 px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700"
                                >
                                    Prev
                                </button>
                                <button
                                    disabled={stocks.current_page >= stocks.last_page}
                                    onClick={() => updateFilters({ page: stocks.current_page + 1 })}
                                    className="rounded-lg border border-gray-300 px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </section>

                    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
                        <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-800">
                            <h2 className="font-semibold text-gray-900 dark:text-white">Audit Stock Movements (25 Terakhir)</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead className="bg-gray-50 text-left dark:bg-gray-800/60">
                                    <tr>
                                        <th className="px-4 py-3">Waktu</th>
                                        <th className="px-4 py-3">Tipe</th>
                                        <th className="px-4 py-3">Produk</th>
                                        <th className="px-4 py-3">Gudang</th>
                                        <th className="px-4 py-3 text-right">Qty</th>
                                        <th className="px-4 py-3">Ref</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredMovements.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                                                Belum ada movement.
                                            </td>
                                        </tr>
                                    )}
                                    {filteredMovements.map((movement) => (
                                        <tr key={movement.id} className="border-t border-gray-100 dark:border-gray-800">
                                            <td className="px-4 py-3">{new Date(movement.created_at).toLocaleString('id-ID')}</td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${movement.type === 'in'
                                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                                                        : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300'
                                                        }`}
                                                >
                                                    {movement.type.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-800 shrink-0 border border-zinc-200 dark:border-zinc-700">
                                                        {movement.product && 'file_path' in movement.product && movement.product.file_path ? (
                                                            <img src={`/storage/${(movement.product as Product & { file_path?: string | null }).file_path}`} alt={movement.product.name || ''} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center"><ImageIcon size={16} className="text-zinc-400" /></div>
                                                        )}
                                                    </div>
                                                    <div className="min-w-0 truncate">{movement.product.name} ({movement.product.sku})</div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                {movement.warehouse.name} ({movement.warehouse.code})
                                            </td>
                                            <td className="px-4 py-3 text-right font-semibold">{movement.quantity}</td>
                                            <td className="px-4 py-3">
                                                {(() => {
                                                    const ref = movement.reference?.toString().trim();
                                                    const note = (movement as StockMovementRow).note?.toString().trim();
                                                    if (ref && note) return `${ref} - ${note}`;
                                                    if (ref) return ref;
                                                    if (note) return note;
                                                    return '-';
                                                })()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
