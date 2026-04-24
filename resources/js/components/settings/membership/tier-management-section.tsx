import { Pencil, Plus, Save, Tag, Trash2, X } from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';
import { TIER_COLORS } from './types';
import type { MembershipTier } from './types';

interface TierForm {
    name: string;
    default_discount_percentage: string;
    description: string;
}

interface Props {
    tiers: MembershipTier[];
    loading: boolean;
    showForm: boolean;
    editingTier: MembershipTier | null;
    form: TierForm;
    setForm: Dispatch<SetStateAction<TierForm>>;
    openCreateForm: () => void;
    openEditForm: (tier: MembershipTier) => void;
    cancelForm: () => void;
    saveTier: () => void;
    requestDeleteTier: (tier: MembershipTier) => void;
}

export default function TierManagementSection({
    tiers,
    loading,
    showForm,
    editingTier,
    form,
    setForm,
    openCreateForm,
    openEditForm,
    cancelForm,
    saveTier,
    requestDeleteTier,
}: Props) {
    return (
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-5 flex items-center justify-between">
                <div>
                    <h2 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
                        <Tag className="h-5 w-5 text-indigo-500" />
                        Membership Tiers
                    </h2>
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                        Kelola level keanggotaan dan diskon default
                    </p>
                </div>
                {!showForm && (
                    <button
                        onClick={openCreateForm}
                        className="group flex items-center gap-2 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 ring-1 ring-inset ring-white/10 hover:from-indigo-400 hover:to-indigo-500 transition-all duration-200"
                    >
                        <Plus className="h-4 w-4 transition-transform group-hover:scale-110" />
                        Tambah Tier
                    </button>
                )}
            </div>

            {/* Form */}
            {showForm && (
                <div className="mb-6 rounded-xl border border-indigo-200 bg-indigo-50/50 p-4 dark:border-indigo-800/50 dark:bg-indigo-900/10">
                    <h3 className="mb-4 text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                        {editingTier ? `Edit Tier — ${editingTier.name}` : 'Tambah Tier Baru'}
                    </h3>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                                Nama Tier <span className="text-rose-500">*</span>
                            </label>
                            <input
                                value={form.name}
                                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                                placeholder="Bronze, Silver, Gold..."
                                className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 transition-all"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                                Diskon Default (%)
                            </label>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                value={form.default_discount_percentage}
                                onChange={(e) => setForm((p) => ({ ...p, default_discount_percentage: e.target.value }))}
                                placeholder="0"
                                className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 transition-all"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                                Deskripsi (Opsional)
                            </label>
                            <input
                                value={form.description}
                                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                                placeholder="Deskripsi singkat..."
                                className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 transition-all"
                            />
                        </div>
                    </div>
                    <div className="mt-4 flex justify-end gap-2">
                        <button
                            onClick={saveTier}
                            disabled={loading || !form.name.trim()}
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

            {/* Table */}
            {tiers.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-800">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-50 text-left dark:bg-gray-800/60">
                            <tr>
                                <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Nama Tier</th>
                                <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Diskon Default</th>
                                <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Deskripsi</th>
                                <th className="px-4 py-3 text-center font-medium text-gray-600 dark:text-gray-400">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {tiers.map((tier, idx) => (
                                <tr key={tier.id} className="transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${TIER_COLORS[idx % TIER_COLORS.length]}`}>
                                            {tier.name}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                            {tier.default_discount_percentage}%
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                                        {tier.description || <span className="italic text-gray-300 dark:text-gray-600">—</span>}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => openEditForm(tier)}
                                                disabled={loading}
                                                className="rounded-lg bg-indigo-50 p-2 text-indigo-600 transition-colors hover:bg-indigo-100 disabled:opacity-60 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => requestDeleteTier(tier)}
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
            ) : (
                <div className="rounded-xl border border-dashed border-gray-200 py-12 text-center dark:border-gray-700">
                    <Tag className="mx-auto mb-3 h-8 w-8 text-gray-300 dark:text-gray-600" />
                    <p className="text-sm text-gray-400 dark:text-gray-500">Belum ada tier membership</p>
                    <p className="mt-1 text-xs text-gray-300 dark:text-gray-600">Klik "Tambah Tier" untuk memulai</p>
                </div>
            )}
        </section>
    );
}
