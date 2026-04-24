import { DatabaseSearch, Pencil, Plus, Save, UserCheck, UserX, Users, X } from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';
import MultiSelectFilter from '@/components/inputs/MultiSelectFilter';
import PaginationBar from '@/components/ui/pagination-bar';
import { getTierColor } from './types';
import type { Member, MemberFilters, MembershipTier, Pagination } from './types';

interface MemberForm {
    name: string;
    member_number: string;
    phone: string;
    email: string;
    membership_tier_id: string;
    is_active: boolean;
}

interface Props {
    members: Pagination<Member>;
    tiers: MembershipTier[];
    loading: boolean;
    showForm: boolean;
    editingMember: Member | null;
    form: MemberForm;
    setForm: Dispatch<SetStateAction<MemberForm>>;
    openCreateForm: () => void;
    openEditForm: (member: Member) => void;
    cancelForm: () => void;
    saveMember: () => void;
    requestDeleteMember: (member: Member) => void;
    // filters
    memberSearch: string;
    setMemberSearch: Dispatch<SetStateAction<string>>;
    memberTierIds: string[];
    memberStatus: string;
    onMemberTierChange: (ids: string[]) => void;
    onMemberStatusChange: (status: string) => void;
    updateMemberFilters: (overrides?: MemberFilters) => void;
}

const STATUS_STYLE: Record<string, string> = {
    active: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20',
    inactive: 'bg-rose-50 text-rose-700 ring-rose-600/10 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-500/20',
};

const getTierName = (member: Member) =>
    (member.membershipTier ?? member.membership_tier)?.name ?? '—';

const STATUS_OPTIONS = [
    { value: 'active', label: 'Aktif' },
    { value: 'inactive', label: 'Nonaktif' },
    { value: 'all', label: 'Semua' },
];

export default function MemberManagementSection({
    members,
    tiers,
    loading,
    showForm,
    editingMember,
    form,
    setForm,
    openCreateForm,
    openEditForm,
    cancelForm,
    saveMember,
    requestDeleteMember,
    memberSearch,
    setMemberSearch,
    memberTierIds,
    memberStatus,
    onMemberTierChange,
    onMemberStatusChange,
    updateMemberFilters,
}: Props) {
    return (
        <section className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-gray-800">
                <div>
                    <h2 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
                        <Users className="h-5 w-5 text-indigo-500" />
                        Members
                    </h2>
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                        Kelola data anggota dan tier keanggotaan
                    </p>
                </div>
                {!showForm && (
                    <button
                        onClick={openCreateForm}
                        className="group flex items-center gap-2 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 ring-1 ring-inset ring-white/10 hover:from-indigo-400 hover:to-indigo-500 transition-all duration-200"
                    >
                        <Plus className="h-4 w-4 transition-transform group-hover:scale-110" />
                        Tambah Member
                    </button>
                )}
            </div>

            {/* Inline Form */}
            {showForm && (
                <div className="border-b border-indigo-100 bg-indigo-50/50 px-6 py-4 dark:border-indigo-800/50 dark:bg-indigo-900/10">
                    <h3 className="mb-4 text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                        {editingMember ? `Edit Member — ${editingMember.name}` : 'Tambah Member Baru'}
                    </h3>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                                Nama <span className="text-rose-500">*</span>
                            </label>
                            <input
                                value={form.name}
                                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                                placeholder="Nama lengkap"
                                className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 transition-all"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">No. Member</label>
                            <input
                                value={form.member_number}
                                onChange={(e) => setForm((p) => ({ ...p, member_number: e.target.value }))}
                                placeholder="MBR-001"
                                className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 transition-all"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                                Telepon <span className="text-rose-500">*</span>
                            </label>
                            <input
                                value={form.phone}
                                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                                placeholder="08xxxxxxxxxx"
                                className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 transition-all"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Email (Opsional)</label>
                            <input
                                type="email"
                                value={form.email}
                                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                                placeholder="email@contoh.com"
                                className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 transition-all"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Tier Membership</label>
                            <select
                                value={form.membership_tier_id}
                                onChange={(e) => setForm((p) => ({ ...p, membership_tier_id: e.target.value }))}
                                className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 transition-all"
                            >
                                <option value="">Pilih Tier</option>
                                {tiers.map((tier) => (
                                    <option key={tier.id} value={tier.id}>
                                        {tier.name} ({tier.default_discount_percentage}%)
                                    </option>
                                ))}
                            </select>
                        </div>
                        {editingMember && (
                            <div>
                                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Status</label>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setForm((p) => ({ ...p, is_active: true }))}
                                        className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition-all ${form.is_active ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}
                                    >
                                        Aktif
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setForm((p) => ({ ...p, is_active: false }))}
                                        className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition-all ${!form.is_active ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}
                                    >
                                        Nonaktif
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="mt-4 flex justify-end gap-2">
                        <button
                            onClick={saveMember}
                            disabled={loading || !form.name.trim() || !form.phone.trim()}
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
            <div className="grid grid-cols-1 gap-3 border-b border-gray-100 px-6 py-4 dark:border-gray-800 sm:grid-cols-3">
                <div className="sm:col-span-1">
                    <label className="mb-1 block text-xs font-bold uppercase tracking-tight text-zinc-400">
                        <DatabaseSearch className="mr-1 inline h-3.5 w-3.5" />
                        Cari Member
                    </label>
                    <div className="relative">
                        <input
                            value={memberSearch}
                            onChange={(e) => setMemberSearch(e.target.value)}
                            placeholder="Nama, no. member, telepon..."
                            className="w-full rounded-2xl border-none bg-zinc-100 px-4 py-3 text-sm font-semibold placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:bg-zinc-900 dark:text-gray-200"
                        />
                    </div>
                </div>
                <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-tight text-zinc-400">Filter Tier</label>
                    <MultiSelectFilter
                        options={tiers.map((t) => ({ label: t.name, value: String(t.id) }))}
                        value={memberTierIds.map(String)}
                        onChange={(vals) => onMemberTierChange(vals)}
                        placeholder="Semua Tier"
                        searchPlaceholder="Cari tier..."
                        buttonClassName="flex w-full items-center justify-between gap-3 rounded-2xl border-none bg-zinc-100 py-3 pl-4 pr-4 text-left text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:bg-zinc-900 dark:text-gray-200"
                    />
                </div>
                <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-tight text-zinc-400">Filter Status</label>
                    <div className="flex gap-2">
                        {STATUS_OPTIONS.map((opt) => (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => onMemberStatusChange(opt.value)}
                                className={`flex-1 rounded-xl py-3 pl-4 pr-4 text-sm font-medium transition-all duration-200 ${memberStatus === opt.value
                                        ? opt.value === 'inactive'
                                            ? 'bg-rose-600 text-white shadow-md shadow-rose-500/30'
                                            : 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30'
                                        : 'bg-zinc-100 text-gray-700 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-gray-300 dark:hover:bg-zinc-800'
                                    }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Table */}
            {members.data.length > 0 ? (
                <>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead className="bg-gray-50 text-left dark:bg-gray-800/60">
                                <tr>
                                    <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Nama</th>
                                    <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">No. Member</th>
                                    <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Telepon</th>
                                    <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Tier</th>
                                    <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Status</th>
                                    <th className="px-4 py-3 text-center font-medium text-gray-600 dark:text-gray-400">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {members.data.map((member) => (
                                    <tr key={member.id} className="transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                                        <td className="px-4 py-3">
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-gray-100">{member.name}</p>
                                                {member.email && (
                                                    <p className="text-xs text-gray-400 dark:text-gray-500">{member.email}</p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="rounded-md bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                                                {member.member_number || '—'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{member.phone}</td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${getTierColor(member.membership_tier_id, tiers)}`}>
                                                {getTierName(member)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${STATUS_STYLE[member.status] ?? STATUS_STYLE.inactive}`}>
                                                {member.status === 'active'
                                                    ? <><UserCheck className="h-3 w-3" /> Aktif</>
                                                    : <><UserX className="h-3 w-3" /> Nonaktif</>
                                                }
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => openEditForm(member)}
                                                    disabled={loading}
                                                    className="rounded-lg bg-indigo-50 p-2 text-indigo-600 transition-colors hover:bg-indigo-100 disabled:opacity-60 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => requestDeleteMember(member)}
                                                    disabled={loading}
                                                    className="rounded-lg bg-rose-50 p-2 text-rose-600 transition-colors hover:bg-rose-100 disabled:opacity-60 dark:bg-rose-900/30 dark:text-rose-400 dark:hover:bg-rose-900/50"
                                                >
                                                    <UserX className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <PaginationBar
                        currentPage={members.current_page}
                        lastPage={members.last_page}
                        total={members.total}
                        perPage={members.per_page}
                        onPageChange={(page) => updateMemberFilters({ page })}
                    />
                </>
            ) : (
                <div className="rounded-b-2xl py-12 text-center">
                    <Users className="mx-auto mb-3 h-8 w-8 text-gray-300 dark:text-gray-600" />
                    <p className="text-sm text-gray-400 dark:text-gray-500">
                        {memberSearch || memberTierIds.length > 0 || memberStatus
                            ? 'Tidak ada member yang sesuai filter'
                            : 'Belum ada member terdaftar'}
                    </p>
                    {!memberSearch && !memberTierIds.length && !memberStatus && (
                        <p className="mt-1 text-xs text-gray-300 dark:text-gray-600">Klik "Tambah Member" untuk memulai</p>
                    )}
                </div>
            )}
        </section>
    );
}
