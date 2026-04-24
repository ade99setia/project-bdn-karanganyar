import { router } from '@inertiajs/react';
import axios from 'axios';
import { CalendarDays, Pencil, Plus, Save, Tag, Trash2, X, Zap } from 'lucide-react';
import { useState } from 'react';
import ProductMultiSelect from '@/components/inputs/ProductMultiSelect';
import type { AlertType } from '@/hooks/use-alert-modal';
import { getTierColor } from './types';
import type { MembershipTier, Product } from './types';

export interface ProductPromotion {
    id: number;
    product_id: number;
    membership_tier_id: number | null;
    type: string;
    buy_quantity: number;
    free_quantity: number;
    label: string | null;
    display_label: string;
    is_active: boolean;
    valid_from: string | null;
    valid_until: string | null;
    product?: { id: number; name: string; sku: string } | null;
    membershipTier?: { id: number; name: string } | null;
    membership_tier?: { id: number; name: string } | null;
}

interface PromoForm {
    product_id: string;
    membership_tier_id: string;
    buy_quantity: string;
    free_quantity: string;
    label: string;
    is_active: boolean;
    valid_from: string;
    valid_until: string;
}

const EMPTY_FORM: PromoForm = {
    product_id: '',
    membership_tier_id: '',
    buy_quantity: '',
    free_quantity: '',
    label: '',
    is_active: true,
    valid_from: '',
    valid_until: '',
};

interface Props {
    promotions: ProductPromotion[];
    tiers: MembershipTier[];
    products: Product[];
    showAlert: (title: string, message: string, type?: AlertType) => void;
}

const getPromoTier = (p: ProductPromotion) => p.membershipTier ?? p.membership_tier;

export default function PromotionSection({ promotions, tiers, products, showAlert }: Props) {
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingPromo, setEditingPromo] = useState<ProductPromotion | null>(null);
    const [form, setForm] = useState<PromoForm>(EMPTY_FORM);
    const [selectedProductIds, setSelectedProductIds] = useState<Array<string | number>>([]);

    const openCreateForm = () => {
        setEditingPromo(null);
        setForm(EMPTY_FORM);
        setSelectedProductIds([]);
        setShowForm(true);
    };

    const openEditForm = (promo: ProductPromotion) => {
        setEditingPromo(promo);
        setForm({
            product_id: promo.product_id.toString(),
            membership_tier_id: promo.membership_tier_id?.toString() ?? '',
            buy_quantity: promo.buy_quantity.toString(),
            free_quantity: promo.free_quantity.toString(),
            label: promo.label ?? '',
            is_active: promo.is_active,
            valid_from: promo.valid_from ?? '',
            valid_until: promo.valid_until ?? '',
        });
        setSelectedProductIds(promo.product_id ? [promo.product_id] : []);
        setShowForm(true);
    };

    const cancelForm = () => {
        setShowForm(false);
        setEditingPromo(null);
        setForm(EMPTY_FORM);
        setSelectedProductIds([]);
    };

    const handleProductSelect = (ids: Array<string | number>) => {
        const latest = ids.length > 0 ? [ids[ids.length - 1]] : [];
        setSelectedProductIds(latest);
        setForm((p) => ({ ...p, product_id: latest[0]?.toString() ?? '' }));
    };

    const savePromo = async () => {
        if (!form.product_id || !form.buy_quantity || !form.free_quantity) {
            showAlert('Validasi', 'Produk, jumlah beli, dan jumlah gratis wajib diisi.', 'warning');
            return;
        }
        setLoading(true);
        try {
            const payload = {
                ...form,
                membership_tier_id: form.membership_tier_id || null,
                valid_from: form.valid_from || null,
                valid_until: form.valid_until || null,
            };
            if (editingPromo) {
                await axios.put(`/settings/membership/promotions/${editingPromo.id}`, payload);
                showAlert('Berhasil', 'Promo berhasil diupdate.', 'success');
            } else {
                await axios.post('/settings/membership/promotions', payload);
                showAlert('Berhasil', 'Promo berhasil ditambahkan.', 'success');
            }
            cancelForm();
            router.reload({ preserveUrl: true });
        } catch (err: any) {
            showAlert('Gagal', err.response?.data?.message ?? 'Gagal menyimpan promo.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (promo: ProductPromotion) => {
        setLoading(true);
        try {
            await axios.delete(`/settings/membership/promotions/${promo.id}`);
            showAlert('Berhasil', 'Promo berhasil dihapus.', 'success');
            router.reload({ preserveUrl: true });
        } catch {
            showAlert('Gagal', 'Gagal menghapus promo.', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Auto-generate label preview
    const labelPreview = form.buy_quantity && form.free_quantity
        ? form.label || `Beli ${form.buy_quantity} Gratis ${form.free_quantity}`
        : null;

    return (
        <section className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-gray-800">
                <div>
                    <h2 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
                        <Zap className="h-5 w-5 text-orange-500" />
                        Promo Beli X Gratis Y
                    </h2>
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                        Atur promo beli 3 gratis 1, beli 2 gratis 1, dll. — berlaku untuk semua atau tier tertentu
                    </p>
                </div>
                {!showForm && (
                    <button
                        onClick={openCreateForm}
                        className="group flex items-center gap-2 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-orange-500/30 ring-1 ring-inset ring-white/10 hover:from-orange-400 hover:to-orange-500 transition-all duration-200"
                    >
                        <Plus className="h-4 w-4 transition-transform group-hover:scale-110" />
                        Tambah Promo
                    </button>
                )}
            </div>

            {/* Inline Form */}
            {showForm && (
                <div className="border-b border-orange-100 bg-orange-50/50 px-6 py-4 dark:border-orange-800/50 dark:bg-orange-900/10">
                    <h3 className="mb-4 text-sm font-semibold text-orange-700 dark:text-orange-300">
                        {editingPromo ? 'Edit Promo' : 'Tambah Promo Baru'}
                        {labelPreview && (
                            <span className="ml-2 rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-bold text-orange-600 dark:bg-orange-900/40 dark:text-orange-400">
                                {labelPreview}
                            </span>
                        )}
                    </h3>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {/* Produk */}
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

                        {/* Tier (opsional) */}
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                                Khusus Tier
                                <span className="ml-1 text-gray-400">(kosong = semua customer)</span>
                            </label>
                            <select
                                value={form.membership_tier_id}
                                onChange={(e) => setForm((p) => ({ ...p, membership_tier_id: e.target.value }))}
                                className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 transition-all"
                            >
                                <option value="">Semua Customer</option>
                                {tiers.map((t) => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Beli X */}
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                                Beli (X) <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="number" min="1"
                                value={form.buy_quantity}
                                onChange={(e) => setForm((p) => ({ ...p, buy_quantity: e.target.value }))}
                                placeholder="3"
                                className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 transition-all"
                            />
                        </div>

                        {/* Gratis Y */}
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                                Gratis (Y) <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="number" min="1"
                                value={form.free_quantity}
                                onChange={(e) => setForm((p) => ({ ...p, free_quantity: e.target.value }))}
                                placeholder="1"
                                className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 transition-all"
                            />
                        </div>

                        {/* Label custom */}
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                                Label Custom
                                <span className="ml-1 text-gray-400">(opsional)</span>
                            </label>
                            <input
                                value={form.label}
                                onChange={(e) => setForm((p) => ({ ...p, label: e.target.value }))}
                                placeholder={labelPreview ?? 'Beli 3 Gratis 1'}
                                className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 transition-all"
                            />
                        </div>

                        {/* Status */}
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Status</label>
                            <div className="flex gap-2">
                                <button type="button" onClick={() => setForm((p) => ({ ...p, is_active: true }))}
                                    className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition-all ${form.is_active ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>
                                    Aktif
                                </button>
                                <button type="button" onClick={() => setForm((p) => ({ ...p, is_active: false }))}
                                    className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition-all ${!form.is_active ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>
                                    Nonaktif
                                </button>
                            </div>
                        </div>

                        {/* Valid From */}
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                                Berlaku Dari <span className="text-gray-400">(opsional)</span>
                            </label>
                            <input type="date"
                                value={form.valid_from}
                                onChange={(e) => setForm((p) => ({ ...p, valid_from: e.target.value }))}
                                className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 transition-all"
                            />
                        </div>

                        {/* Valid Until */}
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                                Berlaku Sampai <span className="text-gray-400">(opsional)</span>
                            </label>
                            <input type="date"
                                value={form.valid_until}
                                onChange={(e) => setForm((p) => ({ ...p, valid_until: e.target.value }))}
                                className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 transition-all"
                            />
                        </div>
                    </div>

                    <div className="mt-4 flex justify-end gap-2">
                        <button onClick={savePromo} disabled={loading || !form.product_id || !form.buy_quantity || !form.free_quantity}
                            className="flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60 transition-all">
                            <Save className="h-4 w-4" />
                            {loading ? 'Menyimpan...' : 'Simpan'}
                        </button>
                        <button onClick={cancelForm} disabled={loading}
                            className="flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 transition-all">
                            <X className="h-4 w-4" />
                            Batal
                        </button>
                    </div>
                </div>
            )}

            {/* Table */}
            {promotions.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-50 text-left dark:bg-gray-800/60">
                            <tr>
                                <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Produk</th>
                                <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Promo</th>
                                <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Berlaku Untuk</th>
                                <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Periode</th>
                                <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Status</th>
                                <th className="px-4 py-3 text-center font-medium text-gray-600 dark:text-gray-400">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {promotions.map((promo) => {
                                const tier = getPromoTier(promo);
                                return (
                                    <tr key={promo.id} className="transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                                        <td className="px-4 py-3">
                                            <p className="font-medium text-gray-900 dark:text-gray-100">{promo.product?.name ?? '—'}</p>
                                            <p className="text-xs text-gray-400">{promo.product?.sku ?? ''}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-2.5 py-1 text-xs font-bold text-orange-700 ring-1 ring-inset ring-orange-600/20 dark:bg-orange-500/10 dark:text-orange-400 dark:ring-orange-500/20">
                                                <Tag className="h-3 w-3" />
                                                {promo.display_label}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            {tier ? (
                                                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${getTierColor(promo.membership_tier_id, tiers)}`}>
                                                    {tier.name}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-gray-400 italic">Semua Customer</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                                            {promo.valid_from || promo.valid_until ? (
                                                <span className="flex items-center gap-1">
                                                    <CalendarDays className="h-3 w-3" />
                                                    {promo.valid_from ?? '∞'} — {promo.valid_until ?? '∞'}
                                                </span>
                                            ) : (
                                                <span className="italic">Tidak terbatas</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${promo.is_active ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-gray-100 text-gray-500 ring-gray-400/20 dark:bg-gray-800 dark:text-gray-500'}`}>
                                                {promo.is_active ? 'Aktif' : 'Nonaktif'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-center gap-2">
                                                <button onClick={() => openEditForm(promo)} disabled={loading}
                                                    className="rounded-lg bg-orange-50 p-2 text-orange-600 transition-colors hover:bg-orange-100 disabled:opacity-60 dark:bg-orange-900/30 dark:text-orange-400">
                                                    <Pencil className="h-4 w-4" />
                                                </button>
                                                <button onClick={() => handleDelete(promo)} disabled={loading}
                                                    className="rounded-lg bg-rose-50 p-2 text-rose-600 transition-colors hover:bg-rose-100 disabled:opacity-60 dark:bg-rose-900/30 dark:text-rose-400">
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="py-12 text-center">
                    <Zap className="mx-auto mb-3 h-8 w-8 text-gray-300 dark:text-gray-600" />
                    <p className="text-sm text-gray-400 dark:text-gray-500">Belum ada promo aktif</p>
                    <p className="mt-1 text-xs text-gray-300 dark:text-gray-600">Klik "Tambah Promo" untuk membuat promo beli X gratis Y</p>
                </div>
            )}
        </section>
    );
}
