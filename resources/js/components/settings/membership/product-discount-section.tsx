import { router } from '@inertiajs/react';
import axios from 'axios';
import { CalendarDays, DatabaseSearch, Pencil, Percent, Plus, Save, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import MultiSelectFilter from '@/components/inputs/MultiSelectFilter';
import ProductMultiSelect from '@/components/inputs/ProductMultiSelect';
import PaginationBar from '@/components/ui/pagination-bar';
import type { AlertType } from '@/hooks/use-alert-modal';
import { getTierColor } from './types';
import type { DiscountFilters, MembershipTier, Pagination, Product, ProductDiscount } from './types';

const getDiscountTierName = (d: ProductDiscount) =>
    (d.membershipTier ?? d.membership_tier)?.name ?? '—';

const getDiscountTierId = (d: ProductDiscount): number | null => {
    // Prioritas: dari relasi yang sudah di-load (paling reliable)
    const fromRelation = d.membershipTier?.id ?? d.membership_tier?.id;
    if (fromRelation != null) return Number(fromRelation);
    // Fallback ke kolom FK
    if (d.membership_tier_id != null) return Number(d.membership_tier_id);
    return null;
};

// Cari index tier berdasarkan ID untuk pewarnaan konsisten
const getDiscountTierIndex = (d: ProductDiscount, tiers: MembershipTier[]): number => {
    const tierId = getDiscountTierId(d);
    if (tierId == null) return 0;
    const idx = tiers.findIndex((t) => Number(t.id) === tierId);
    return idx >= 0 ? idx : 0;
};

interface DiscountForm {
    membership_tier_id: string;
    product_id: string;
    discount_percentage: string;
    is_active: boolean;
    valid_from: string;
    valid_until: string;
}

const EMPTY_FORM: DiscountForm = {
    membership_tier_id: '',
    product_id: '',
    discount_percentage: '',
    is_active: true,
    valid_from: '',
    valid_until: '',
};

interface Props {
    productDiscounts: Pagination<ProductDiscount>;
    tiers: MembershipTier[];
    products: Product[];
    showAlert: (title: string, message: string, type?: AlertType) => void;
    // filters
    discountSearch: string;
    setDiscountSearch: Dispatch<SetStateAction<string>>;
    discountTierIds: string[];
    onDiscountTierChange: (ids: string[]) => void;
    updateDiscountFilters: (overrides?: DiscountFilters) => void;
}

export default function ProductDiscountSection({
    productDiscounts,
    tiers,
    products,
    showAlert,
    discountSearch,
    setDiscountSearch,
    discountTierIds,
    onDiscountTierChange,
    updateDiscountFilters,
}: Props) {
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingDiscount, setEditingDiscount] = useState<ProductDiscount | null>(null);
    const [form, setForm] = useState<DiscountForm>(EMPTY_FORM);
    // ProductMultiSelect expects array; we store single product_id as array
    const [selectedProductIds, setSelectedProductIds] = useState<Array<string | number>>([]);

    const openCreateForm = () => {
        setEditingDiscount(null);
        setForm(EMPTY_FORM);
        setSelectedProductIds([]);
        setShowForm(true);
    };

    const openEditForm = (discount: ProductDiscount) => {
        setEditingDiscount(discount);
        setForm({
            membership_tier_id: discount.membershipTier?.id?.toString() ?? discount.membership_tier?.id?.toString() ?? '',
            product_id: discount.product?.id?.toString() ?? '',
            discount_percentage: discount.discount_percentage.toString(),
            is_active: discount.is_active ?? true,
            valid_from: discount.valid_from ?? '',
            valid_until: discount.valid_until ?? '',
        });
        setSelectedProductIds(discount.product?.id ? [discount.product.id] : []);
        setShowForm(true);
    };

    const cancelForm = () => {
        setShowForm(false);
        setEditingDiscount(null);
        setForm(EMPTY_FORM);
        setSelectedProductIds([]);
    };

    const handleProductSelect = (ids: Array<string | number>) => {
        // only allow single selection
        const latest = ids.length > 0 ? [ids[ids.length - 1]] : [];
        setSelectedProductIds(latest);
        setForm((p) => ({ ...p, product_id: latest[0]?.toString() ?? '' }));
    };

    const saveDiscount = async () => {
        if (!form.membership_tier_id || !form.product_id || !form.discount_percentage) {
            showAlert('Validasi', 'Tier, produk, dan persentase diskon wajib diisi.', 'warning');
            return;
        }
        setLoading(true);
        try {
            const payload = {
                ...form,
                valid_from: form.valid_from || null,
                valid_until: form.valid_until || null,
            };
            if (editingDiscount) {
                await axios.put(`/settings/membership/product-discounts/${editingDiscount.id}`, payload);
                showAlert('Berhasil', 'Diskon produk berhasil diupdate.', 'success');
            } else {
                await axios.post('/settings/membership/product-discounts', payload);
                showAlert('Berhasil', 'Diskon produk berhasil ditambahkan.', 'success');
            }
            cancelForm();
            router.reload({ preserveUrl: true });
        } catch (err: any) {
            showAlert('Gagal', err.response?.data?.error ?? err.response?.data?.message ?? 'Gagal menyimpan diskon.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (discount: ProductDiscount) => {
        setLoading(true);
        try {
            await axios.delete(`/settings/membership/product-discounts/${discount.id}`);
            showAlert('Berhasil', 'Diskon produk berhasil dihapus.', 'success');
            router.reload({ preserveUrl: true });
        } catch {
            showAlert('Gagal', 'Gagal menghapus diskon produk.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-gray-800">
                <div>
                    <h2 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
                        <Percent className="h-5 w-5 text-indigo-500" />
                        Diskon Produk Khusus
                    </h2>
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                        Diskon spesifik per produk untuk setiap tier membership
                    </p>
                </div>
                {!showForm && (
                    <button
                        onClick={openCreateForm}
                        className="group flex items-center gap-2 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 ring-1 ring-inset ring-white/10 hover:from-indigo-400 hover:to-indigo-500 transition-all duration-200"
                    >
                        <Plus className="h-4 w-4 transition-transform group-hover:scale-110" />
                        Tambah Diskon
                    </button>
                )}
            </div>

            {/* Inline Form */}
            {showForm && (
                <div className="border-b border-indigo-100 bg-indigo-50/50 px-6 py-4 dark:border-indigo-800/50 dark:bg-indigo-900/10">
                    <h3 className="mb-4 text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                        {editingDiscount ? 'Edit Diskon Produk' : 'Tambah Diskon Produk Baru'}
                    </h3>

                    {/* Baris 1: field utama */}
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                                Tier Membership <span className="text-rose-500">*</span>
                            </label>
                            <select
                                value={form.membership_tier_id}
                                onChange={(e) => setForm((p) => ({ ...p, membership_tier_id: e.target.value }))}
                                className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 transition-all"
                            >
                                <option value="">Pilih Tier</option>
                                {tiers.map((t) => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                                Produk <span className="text-rose-500">*</span>
                            </label>
                            <ProductMultiSelect
                                items={products.map((p) => ({ id: p.id, title: p.name, subtitle: p.sku }))}
                                value={selectedProductIds}
                                onChange={handleProductSelect}
                                placeholder="Cari produk..."
                                minHeight={44}
                                containerClassName="rounded-xl border border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800"
                                innerClassName="py-1.5 px-0"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                                Diskon (%) <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                value={form.discount_percentage}
                                onChange={(e) => setForm((p) => ({ ...p, discount_percentage: e.target.value }))}
                                placeholder="0"
                                className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 transition-all"
                            />
                        </div>
                    </div>

                    {/* Baris 2: status + periode */}
                    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Status</label>
                            <div className="flex gap-2">
                                <button type="button" onClick={() => setForm((p) => ({ ...p, is_active: true }))}
                                    className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition-all ${form.is_active ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>
                                    Aktif
                                </button>
                                <button type="button" onClick={() => setForm((p) => ({ ...p, is_active: false }))}
                                    className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition-all ${!form.is_active ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>
                                    Nonaktif
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                                Berlaku Dari <span className="text-gray-400">(opsional)</span>
                            </label>
                            <input type="date"
                                value={form.valid_from}
                                onChange={(e) => setForm((p) => ({ ...p, valid_from: e.target.value }))}
                                className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 transition-all"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                                Berlaku Sampai <span className="text-gray-400">(opsional)</span>
                            </label>
                            <input type="date"
                                value={form.valid_until}
                                onChange={(e) => setForm((p) => ({ ...p, valid_until: e.target.value }))}
                                className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 transition-all"
                            />
                        </div>
                    </div>
                    <div className="mt-4 flex justify-end gap-2">
                        <button
                            onClick={saveDiscount}
                            disabled={loading || !form.membership_tier_id || !form.product_id || !form.discount_percentage}
                            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 transition-all"
                        >
                            <Save className="h-4 w-4" />
                            {loading ? 'Menyimpan...' : 'Simpan'}
                        </button>
                        <button
                            onClick={cancelForm}
                            disabled={loading}
                            className="flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 transition-all"
                        >
                            <X className="h-4 w-4" />
                            Batal
                        </button>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="grid grid-cols-1 gap-3 border-b border-gray-100 px-6 py-4 dark:border-gray-800 sm:grid-cols-2">
                <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-tight text-zinc-400">
                        <DatabaseSearch className="mr-1 inline h-3.5 w-3.5" />
                        Cari Produk
                    </label>
                    <input
                        value={discountSearch}
                        onChange={(e) => setDiscountSearch(e.target.value)}
                        placeholder="Nama produk, SKU..."
                        className="w-full rounded-2xl border-none bg-zinc-100 px-4 py-3 text-sm font-semibold placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:bg-zinc-900 dark:text-gray-200"
                    />
                </div>
                <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-tight text-zinc-400">Filter Tier</label>
                    <MultiSelectFilter
                        options={tiers.map((t) => ({ label: t.name, value: String(t.id) }))}
                        value={discountTierIds.map(String)}
                        onChange={(vals) => onDiscountTierChange(vals)}
                        placeholder="Semua Tier"
                        searchPlaceholder="Cari tier..."
                        buttonClassName="flex w-full items-center justify-between gap-3 rounded-2xl border-none bg-zinc-100 py-3 pl-4 pr-4 text-left text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:bg-zinc-900 dark:text-gray-200"
                    />
                </div>
            </div>

            {/* Table */}
            {productDiscounts.data.length > 0 ? (
                <>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead className="bg-gray-50 text-left dark:bg-gray-800/60">
                                <tr>
                                    <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Produk</th>
                                    <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">SKU</th>
                                    <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Tier</th>
                                    <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Diskon</th>
                                    <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Status</th>
                                    <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Periode</th>
                                    <th className="px-4 py-3 text-center font-medium text-gray-600 dark:text-gray-400">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {productDiscounts.data.map((discount) => (
                                    <tr key={discount.id} className="transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                                            {discount.product?.name ?? '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="rounded-md bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                                                {discount.product?.sku ?? '—'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${getTierColor(getDiscountTierId(discount), tiers)}`}>
                                                {getDiscountTierName(discount)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                                {discount.discount_percentage}%
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${discount.is_active ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-gray-100 text-gray-500 ring-gray-400/20 dark:bg-gray-800 dark:text-gray-500'}`}>
                                                {discount.is_active ? 'Aktif' : 'Nonaktif'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                                            {discount.valid_from || discount.valid_until ? (
                                                <span className="flex items-center gap-1">
                                                    <CalendarDays className="h-3 w-3 shrink-0" />
                                                    {discount.valid_from ?? '∞'} — {discount.valid_until ?? '∞'}
                                                </span>
                                            ) : (
                                                <span className="italic">Tidak terbatas</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => openEditForm(discount)}
                                                    disabled={loading}
                                                    className="rounded-lg bg-indigo-50 p-2 text-indigo-600 transition-colors hover:bg-indigo-100 disabled:opacity-60 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(discount)}
                                                    disabled={loading}
                                                    className="rounded-lg bg-rose-50 p-2 text-rose-600 transition-colors hover:bg-rose-100 disabled:opacity-60 dark:bg-rose-900/30 dark:text-rose-400 dark:hover:bg-rose-900/50"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <PaginationBar
                        currentPage={productDiscounts.current_page}
                        lastPage={productDiscounts.last_page}
                        total={productDiscounts.total}
                        perPage={productDiscounts.per_page}
                        onPageChange={(page) => updateDiscountFilters({ page })}
                    />
                </>
            ) : (
                <div className="rounded-b-2xl py-12 text-center">
                    <Percent className="mx-auto mb-3 h-8 w-8 text-gray-300 dark:text-gray-600" />
                    <p className="text-sm text-gray-400 dark:text-gray-500">
                        {discountSearch || discountTierIds.length > 0
                            ? 'Tidak ada diskon yang sesuai filter'
                            : 'Belum ada diskon produk khusus'}
                    </p>
                    {!discountSearch && !discountTierIds.length && (
                        <p className="mt-1 text-xs text-gray-300 dark:text-gray-600">Klik "Tambah Diskon" untuk memulai</p>
                    )}
                </div>
            )}
        </section>
    );
}
