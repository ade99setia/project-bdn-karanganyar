import { ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, Pencil, Trash2 } from 'lucide-react';

type UserRow = {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    role_id: number | null;
    role_name: string | null;
    employee_status: string | null;
    employee_position: string | null;
    employee_supervisor_id: number | null;
    created_at: string | null;
    updated_at: string | null;
};

interface Pagination<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
}

interface TableWithPaginationUserProps {
    users: Pagination<UserRow>;
    onEdit: (user: UserRow) => void;
    onDelete: (user: UserRow) => void;
    updateFilters: (filters: { page: number }) => void;
}

export default function TableWithPaginationUser({ users, onEdit, onDelete, updateFilters }: TableWithPaginationUserProps) {
    return (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg dark:border-gray-800 dark:bg-gray-900">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/60">
                        <tr>
                            <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">No</th>
                            <th className="px-4 py-4 text-center text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">ID</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">Pengguna</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">Kontak</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">Role</th>
                            <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">Status</th>
                            <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                        {users.data.length === 0 ? (
                            <tr>
                                <td className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400" colSpan={7}>
                                    Belum ada data pengguna.
                                </td>
                            </tr>
                        ) : (
                            users.data.map((user, index) => (
                                <tr key={user.id} className="transition hover:bg-gray-50 dark:hover:bg-gray-800/40">
                                    <td className="px-6 py-3 text-center text-sm">{(users.from ?? 1) + index}</td>
                                    <td className="px-4 py-3 text-center text-sm font-semibold text-indigo-600 dark:text-indigo-400">#{user.id}</td>
                                    <td className="px-6 py-3">
                                        <div className="font-medium text-gray-900 dark:text-gray-100">{user.name}</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">{user.employee_position ?? '-'}</div>
                                    </td>
                                    <td className="px-6 py-3 text-sm text-gray-700 dark:text-gray-300">
                                        <div>{user.email}</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">{user.phone || '-'}</div>
                                    </td>
                                    <td className="px-6 py-3 text-sm text-gray-700 dark:text-gray-300">{user.role_name ?? '-'}</td>
                                    <td className="px-6 py-3 text-center text-xs">
                                        <span
                                            className={`rounded-full px-2.5 py-1 font-semibold ${user.employee_status === 'active'
                                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                                                : user.employee_status === 'inactive'
                                                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                                                    : 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
                                                }`}
                                        >
                                            {user.employee_status ?? '-'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => onEdit(user)}
                                                className="rounded-lg bg-indigo-50 p-2 text-indigo-600 transition hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300 dark:hover:bg-indigo-800/50"
                                                title={`Edit ${user.name}`}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => onDelete(user)}
                                                className="rounded-lg bg-rose-50 p-2 text-rose-600 transition hover:bg-rose-100 dark:bg-rose-900/30 dark:text-rose-300 dark:hover:bg-rose-800/50"
                                                title={`Hapus ${user.name}`}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {users.last_page > 1 && (
                <div className="border-t border-gray-200 px-2 py-3 sm:px-4 sm:py-4 dark:border-gray-800">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="text-center text-xs text-gray-600 dark:text-gray-400 sm:text-left sm:text-sm">
                            Menampilkan <strong>{users.from}-{users.to}</strong> dari <strong>{users.total}</strong> data
                        </div>
                        <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-2">
                            <button
                                onClick={() => updateFilters({ page: 1 })}
                                disabled={users.current_page === 1}
                                className="rounded-lg p-2 hover:bg-indigo-50 disabled:opacity-40 dark:hover:bg-indigo-900/30"
                                aria-label="Halaman pertama"
                            >
                                <ChevronsLeft className="h-5 w-5" />
                            </button>
                            <button
                                onClick={() => updateFilters({ page: users.current_page - 1 })}
                                disabled={users.current_page === 1}
                                className="rounded-lg p-2 hover:bg-indigo-50 disabled:opacity-40 dark:hover:bg-indigo-900/30"
                                aria-label="Halaman sebelumnya"
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </button>
                            <span className="flex items-center gap-1 rounded-lg bg-gray-100 px-2 py-1 text-xs font-semibold dark:bg-gray-800 sm:text-sm">
                                Hal.
                                <input
                                    type="number"
                                    min={1}
                                    max={users.last_page}
                                    value={users.current_page}
                                    onChange={(event) => {
                                        let page = Number(event.target.value);
                                        if (page < 1) page = 1;
                                        if (page > users.last_page) page = users.last_page;
                                        updateFilters({ page });
                                    }}
                                    onBlur={(event) => {
                                        if (!event.target.value) updateFilters({ page: 1 });
                                    }}
                                    className="w-10 border border-gray-300 bg-white px-1 py-1 text-center text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 sm:w-14 sm:px-2 sm:text-sm"
                                    style={{ MozAppearance: 'textfield' }}
                                />
                                / {users.last_page}
                            </span>
                            <button
                                onClick={() => updateFilters({ page: users.current_page + 1 })}
                                disabled={users.current_page === users.last_page}
                                className="rounded-lg p-2 hover:bg-indigo-50 disabled:opacity-40 dark:hover:bg-indigo-900/30"
                                aria-label="Halaman berikutnya"
                            >
                                <ChevronRight className="h-5 w-5" />
                            </button>
                            <button
                                onClick={() => updateFilters({ page: users.last_page })}
                                disabled={users.current_page === users.last_page}
                                className="rounded-lg p-2 hover:bg-indigo-50 disabled:opacity-40 dark:hover:bg-indigo-900/30"
                                aria-label="Halaman terakhir"
                            >
                                <ChevronsRight className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
