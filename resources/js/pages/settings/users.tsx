import { Head, router, usePage } from '@inertiajs/react';
import { Search, Plus, Loader2, User as UserIcon, Save, Pencil, Trash2, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import FormModalUser from '@/components/settings/users/FormModalUser';
import RoleStatsUser from '@/components/settings/users/RoleStatsUser';
import TableWithPaginationUser from '@/components/settings/users/TableWithPaginationUser';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import type { BreadcrumbItem } from '@/types';

interface UserRow {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    role_id: number | null;
    role_name: string | null;
    warehouse_id: number | null;
    warehouse_name: string | null;
    employee_status: string | null;
    employee_position: string | null;
    employee_supervisor_id: number | null;
    created_at: string | null;
    updated_at: string | null;
}

interface Pagination<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
}

interface RoleItem {
    id: number;
    name: string;
    description: string | null;
    rank: number;
}

interface SupervisorItem {
    employee_id: number;
    user_id: number;
    name: string;
    role_name: string | null;
    role_rank: number;
}

interface WarehouseItem {
    id: number;
    name: string;
    code: string;
    is_active: boolean;
}

interface PageProps {
    users: Pagination<UserRow>;
    filters: {
        search?: string;
        role_id?: number | null;
        per_page?: number;
    };
    roles: RoleItem[];
    warehouses: WarehouseItem[];
    supervisors: SupervisorItem[];
    role_counts: Record<string, number>;
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
        title: 'User Settings',
        href: '/settings/users',
    },
];

export default function UserSettings() {
    const { users, filters, role_counts, roles, warehouses, supervisors, flash } = usePage<PageProps>().props;

    const employeeStatusOptions = ['active', 'inactive', 'resign'];

    const [searchInput, setSearchInput] = useState(filters.search || '');
    const [perPage, setPerPage] = useState(filters.per_page || 10);
    const [roleFilter, setRoleFilter] = useState<number | undefined>(filters.role_id ?? undefined);

    const [showFormModal, setShowFormModal] = useState(false);
    const [editingUser, setEditingUser] = useState<UserRow | null>(null);
    const [formLoading, setFormLoading] = useState(false);

    const [roleNameInput, setRoleNameInput] = useState('');
    const [roleDescriptionInput, setRoleDescriptionInput] = useState('');
    const [roleRankInput, setRoleRankInput] = useState('0');
    const [roleSettingLoading, setRoleSettingLoading] = useState(false);
    const [editingRoleId, setEditingRoleId] = useState<number | null>(null);
    const [roleEditNameInput, setRoleEditNameInput] = useState('');
    const [roleEditDescriptionInput, setRoleEditDescriptionInput] = useState('');
    const [roleEditRankInput, setRoleEditRankInput] = useState('0');
    const [roleUpdateLoading, setRoleUpdateLoading] = useState(false);
    const [roleDeleteLoadingId, setRoleDeleteLoadingId] = useState<number | null>(null);

    const [form, setForm] = useState({
        name: '',
        email: '',
        phone: '',
        role_id: '',
        warehouse_id: '',
        password: '',
        employee_status: 'active',
        supervisor_id: '',
    });

    const isEdit = editingUser !== null;

    const updateFilters = useCallback((newFilters: { search?: string; per_page?: number; page?: number; role_id?: number | null }) => {
        const hasRoleIdFilter = Object.prototype.hasOwnProperty.call(newFilters, 'role_id');
        const nextRoleId = hasRoleIdFilter
            ? (newFilters.role_id ?? undefined)
            : roleFilter;

        const params: Record<string, string | number | undefined> = {
            search: newFilters.search ?? (searchInput || undefined),
            per_page: newFilters.per_page ?? perPage,
            page: newFilters.page,
            role_id: nextRoleId,
        };

        router.get('/settings/users', params, {
            preserveState: true,
            replace: true,
            preserveScroll: true,
        });
    }, [perPage, roleFilter, searchInput]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if ((filters.search || '') !== searchInput) {
                updateFilters({ search: searchInput || undefined, page: 1 });
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchInput, filters.search, updateFilters]);

    const openCreateModal = () => {
        setEditingUser(null);
        setForm({
            name: '',
            email: '',
            phone: '',
            role_id: '',
            warehouse_id: '',
            password: '',
            employee_status: 'active',
            supervisor_id: '',
        });
        setShowFormModal(true);
    };

    const openEditModal = (user: UserRow) => {
        setEditingUser(user);
        setForm({
            name: user.name,
            email: user.email,
            phone: user.phone || '',
            role_id: user.role_id ? String(user.role_id) : '',
            warehouse_id: user.warehouse_id ? String(user.warehouse_id) : '',
            password: '',
            employee_status: user.employee_status || 'active',
            supervisor_id: user.employee_supervisor_id ? String(user.employee_supervisor_id) : '',
        });
        setShowFormModal(true);
    };

    const handleDeleteUser = (user: UserRow) => {
        if (!confirm(`Hapus user ${user.name}?`)) return;

        router.delete(`/settings/users/${user.id}`, {
            preserveScroll: true,
        });
    };

    const handleFormChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setForm((prev) => ({
            ...prev,
            [event.target.name]: event.target.value,
        }));
    };

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        setFormLoading(true);

        const payload = {
            ...form,
            role_id: Number(form.role_id),
            warehouse_id: form.warehouse_id ? Number(form.warehouse_id) : null,
            supervisor_id: form.supervisor_id ? Number(form.supervisor_id) : null,
        };

        const options = {
            preserveScroll: true,
            onFinish: () => {
                setFormLoading(false);
            },
            onSuccess: () => {
                setShowFormModal(false);
            },
        };

        if (isEdit && editingUser) {
            router.put(`/settings/users/${editingUser.id}`, payload, options);
            return;
        }

        router.post('/settings/users', payload, options);
    };

    const saveRoleSetting = () => {
        const roleName = roleNameInput.trim();

        if (roleName === '') {
            return;
        }

        setRoleSettingLoading(true);

        router.post('/settings/roles', {
            name: roleName,
            description: roleDescriptionInput.trim() || null,
            rank: Number(roleRankInput || 0),
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setRoleNameInput('');
                setRoleDescriptionInput('');
                setRoleRankInput('0');
            },
            onFinish: () => {
                setRoleSettingLoading(false);
            },
        });
    };

    const startEditRole = (role: RoleItem) => {
        setEditingRoleId(role.id);
        setRoleEditNameInput(role.name);
        setRoleEditDescriptionInput(role.description ?? '');
        setRoleEditRankInput(String(role.rank ?? 0));
    };

    const cancelEditRole = () => {
        setEditingRoleId(null);
        setRoleEditNameInput('');
        setRoleEditDescriptionInput('');
        setRoleEditRankInput('0');
    };

    const updateRoleSetting = () => {
        if (!editingRoleId) {
            return;
        }

        const roleName = roleEditNameInput.trim();

        if (roleName === '') {
            return;
        }

        setRoleUpdateLoading(true);

        router.put(`/settings/roles/${editingRoleId}`, {
            name: roleName,
            description: roleEditDescriptionInput.trim() || null,
            rank: Number(roleEditRankInput || 0),
        }, {
            preserveScroll: true,
            onSuccess: () => {
                cancelEditRole();
            },
            onFinish: () => {
                setRoleUpdateLoading(false);
            },
        });
    };

    const deleteRoleSetting = (role: RoleItem) => {
        const linkedUsers = role_counts[String(role.id)] ?? 0;
        const warning = linkedUsers > 0
            ? `Role ${role.name} terhubung ke ${linkedUsers} user. Jika dihapus, users.role_id akan dibuat null. Lanjutkan?`
            : `Hapus role ${role.name}?`;

        if (!confirm(warning)) {
            return;
        }

        setRoleDeleteLoadingId(role.id);

        router.delete(`/settings/roles/${role.id}`, {
            preserveScroll: true,
            onFinish: () => {
                setRoleDeleteLoadingId(null);
                if (editingRoleId === role.id) {
                    cancelEditRole();
                }
            },
        });
    };

    const applyRoleFilterFromRoleTable = (role: RoleItem) => {
        if (roleFilter === role.id) {
            setRoleFilter(undefined);
            updateFilters({ role_id: null, page: 1 });
            return;
        }

        setRoleFilter(role.id);
        updateFilters({ role_id: role.id, page: 1 });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="User Settings" />

            <SettingsLayout>
                <div className="space-y-8">
                    {(flash?.success || flash?.error || flash?.warning || flash?.info) && (
                        <div className={`rounded-xl border px-4 py-3 text-sm ${flash?.success
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
                        <h2 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">Pengaturan Role User</h2>
                        <p className="mb-5 text-sm text-gray-600 dark:text-gray-400">Kelola role user (tambah, ubah, hapus) dalam satu halaman.</p>

                        <div className="space-y-5">
                            <div className="border-t border-gray-200 pt-5 dark:border-gray-800">
                                <h3 className="mb-2 text-base font-semibold text-gray-900 dark:text-white">Tambah Role</h3>
                                <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                                    Tambahkan role baru sesuai tabel roles (name unik, description opsional, rank untuk hirarki).
                                </p>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Nama Role</label>
                                        <input
                                            value={roleNameInput}
                                            onChange={(event) => setRoleNameInput(event.target.value)}
                                            placeholder="contoh: manager"
                                            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Deskripsi (opsional)</label>
                                        <input
                                            value={roleDescriptionInput}
                                            onChange={(event) => setRoleDescriptionInput(event.target.value)}
                                            placeholder="contoh: user level manajer"
                                            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Rank</label>
                                        <input
                                            type="number"
                                            min={0}
                                            value={roleRankInput}
                                            onChange={(event) => setRoleRankInput(event.target.value)}
                                            placeholder="contoh: 70"
                                            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800"
                                        />
                                    </div>
                                </div>

                                <div className="mt-4 flex justify-end">
                                    <button
                                        type="button"
                                        onClick={saveRoleSetting}
                                        disabled={roleSettingLoading || roleNameInput.trim() === '' || roleUpdateLoading}
                                        className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-70"
                                    >
                                        {roleSettingLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                        Simpan Role
                                    </button>
                                </div>

                                <div className="mt-6 rounded-xl border border-gray-200 dark:border-gray-700">
                                    <div className="border-b border-gray-200 px-4 py-3 text-sm font-semibold text-gray-800 dark:border-gray-700 dark:text-gray-200">
                                        Daftar Role (CRUD)
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-50 text-gray-600 dark:bg-gray-800/60 dark:text-gray-300">
                                                <tr>
                                                    <th className="px-4 py-3 text-left font-semibold">Nama Role</th>
                                                    <th className="px-4 py-3 text-left font-semibold">Deskripsi</th>
                                                    <th className="px-4 py-3 text-center font-semibold">Rank</th>
                                                    <th className="px-4 py-3 text-center font-semibold">Jumlah User</th>
                                                    <th className="px-4 py-3 text-center font-semibold">Aksi</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                                {roles.length === 0 ? (
                                                    <tr>
                                                        <td className="px-4 py-4 text-center text-gray-500 dark:text-gray-400" colSpan={5}>
                                                            Belum ada role.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    roles.map((role) => {
                                                        const linkedUsers = role_counts[String(role.id)] ?? 0;
                                                        const isEditing = editingRoleId === role.id;

                                                        return (
                                                            <tr key={role.id}>
                                                                <td className="px-4 py-3 align-top">
                                                                    {isEditing ? (
                                                                        <input
                                                                            value={roleEditNameInput}
                                                                            onChange={(event) => setRoleEditNameInput(event.target.value)}
                                                                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800"
                                                                        />
                                                                    ) : (
                                                                        <span className="font-medium text-gray-800 dark:text-gray-200">{role.name}</span>
                                                                    )}
                                                                </td>
                                                                <td className="px-4 py-3 align-top">
                                                                    {isEditing ? (
                                                                        <input
                                                                            value={roleEditDescriptionInput}
                                                                            onChange={(event) => setRoleEditDescriptionInput(event.target.value)}
                                                                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800"
                                                                        />
                                                                    ) : (
                                                                        <span className="text-gray-600 dark:text-gray-300">{role.description || '-'}</span>
                                                                    )}
                                                                </td>
                                                                <td className="px-4 py-3 text-center align-top text-gray-700 dark:text-gray-300">
                                                                    {isEditing ? (
                                                                        <input
                                                                            type="number"
                                                                            min={0}
                                                                            value={roleEditRankInput}
                                                                            onChange={(event) => setRoleEditRankInput(event.target.value)}
                                                                            className="w-24 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800"
                                                                        />
                                                                    ) : (
                                                                        <span className="font-semibold">{role.rank ?? 0}</span>
                                                                    )}
                                                                </td>
                                                                <td className="px-4 py-3 text-center align-top text-gray-700 dark:text-gray-300">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => applyRoleFilterFromRoleTable(role)}
                                                                        className={`rounded-md px-2 py-1 text-xs font-semibold transition ${roleFilter === role.id
                                                                            ? 'bg-indigo-600 text-white'
                                                                            : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300 dark:hover:bg-indigo-800/50'
                                                                            }`}
                                                                        title={roleFilter === role.id ? 'Klik untuk reset filter role' : `Klik untuk filter user role ${role.name}`}
                                                                    >
                                                                        {linkedUsers} User
                                                                    </button>
                                                                </td>
                                                                <td className="px-4 py-3 align-top">
                                                                    <div className="flex items-center justify-center gap-2">
                                                                        {isEditing ? (
                                                                            <>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={updateRoleSetting}
                                                                                    disabled={roleUpdateLoading || roleEditNameInput.trim() === ''}
                                                                                    className="flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-70"
                                                                                >
                                                                                    {roleUpdateLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                                                                                    Update
                                                                                </button>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={cancelEditRole}
                                                                                    disabled={roleUpdateLoading}
                                                                                    className="rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-70 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                                                                                >
                                                                                    <X className="h-3.5 w-3.5" />
                                                                                </button>
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => startEditRole(role)}
                                                                                    disabled={roleDeleteLoadingId !== null}
                                                                                    className="rounded-lg bg-indigo-50 p-2 text-indigo-600 hover:bg-indigo-100 disabled:opacity-70 dark:bg-indigo-900/30 dark:text-indigo-300 dark:hover:bg-indigo-800/50"
                                                                                    title={`Edit role ${role.name}`}
                                                                                >
                                                                                    <Pencil className="h-4 w-4" />
                                                                                </button>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => deleteRoleSetting(role)}
                                                                                    disabled={roleDeleteLoadingId !== null || roleUpdateLoading}
                                                                                    className="rounded-lg bg-rose-50 p-2 text-rose-600 hover:bg-rose-100 disabled:opacity-70 dark:bg-rose-900/30 dark:text-rose-300 dark:hover:bg-rose-800/50"
                                                                                    title={`Hapus role ${role.name}`}
                                                                                >
                                                                                    {roleDeleteLoadingId === role.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                                                                </button>
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section>
                        <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-lg dark:border-gray-800 dark:bg-gray-900 md:p-8">
                            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                                <div>
                                    <h1 className="flex items-center gap-3 text-2xl font-bold text-gray-900 dark:text-white md:text-3xl">
                                        <UserIcon className="h-8 w-8 text-indigo-600 md:h-10 md:w-10" />
                                        Daftar User
                                    </h1>
                                    <p className="mt-2 text-gray-600 dark:text-gray-400">Kelola akun user berdasarkan role yang tersedia di sistem.</p>
                                </div>
                                <RoleStatsUser
                                    roles={roles}
                                    roleCounts={role_counts}
                                    onRoleFilter={(roleId) => {
                                        setRoleFilter(roleId);
                                        updateFilters({ role_id: roleId ?? null, page: 1 });
                                    }}
                                    activeRole={roleFilter}
                                />
                            </div>
                        </div>

                        <div className="mb-6">
                            <div className="flex flex-col gap-4 md:flex-row md:items-end">
                                <div className="flex-1">
                                    <div className="flex items-center rounded-2xl border border-gray-200 bg-white px-6 py-4 shadow dark:border-gray-700 dark:bg-gray-800">
                                        <Search className="pointer-events-none absolute ml-0 h-5 w-5 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Cari nama, email, atau telepon..."
                                            className="w-full bg-transparent pl-8 pr-2 text-gray-900 placeholder-gray-400 focus:outline-none dark:text-white dark:placeholder-gray-500"
                                            value={searchInput}
                                            onChange={(event) => setSearchInput(event.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="relative w-full md:w-56">
                                    <select
                                        value={perPage}
                                        onChange={(event) => {
                                            const value = Number(event.target.value);
                                            setPerPage(value);
                                            updateFilters({ per_page: value, page: 1 });
                                        }}
                                        className="w-full appearance-none rounded-xl border border-gray-300 bg-white px-6 py-4 pr-12 focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800"
                                    >
                                        {[10, 25, 50, 100].map((value) => (
                                            <option key={value} value={value}>{value} per halaman</option>
                                        ))}
                                    </select>
                                </div>

                                <button
                                    onClick={openCreateModal}
                                    className="flex items-center gap-2 rounded-xl bg-linear-to-br from-indigo-600 to-purple-600 px-6 py-4 font-semibold text-white shadow-lg transition hover:from-indigo-700 hover:to-purple-700"
                                >
                                    <Plus className="h-5 w-5" />
                                    Tambah User
                                </button>
                            </div>
                        </div>

                        <TableWithPaginationUser
                            users={users}
                            onEdit={openEditModal}
                            onDelete={handleDeleteUser}
                            updateFilters={(payload) => updateFilters(payload)}
                        />
                    </section>
                </div>
            </SettingsLayout>

            <FormModalUser
                isOpen={showFormModal}
                onClose={() => setShowFormModal(false)}
                onSubmit={handleSubmit}
                form={form}
                onChange={handleFormChange}
                isEdit={isEdit}
                loading={formLoading}
                roles={roles}
                warehouses={warehouses}
                employeeStatuses={employeeStatusOptions}
                supervisors={supervisors}
                editingUserId={editingUser?.id ?? null}
            />
        </AppLayout>
    );
}
