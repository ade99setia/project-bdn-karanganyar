import { Loader2, X, User as UserIcon } from 'lucide-react';
import type { FormEvent } from 'react';

type RoleItem = {
    id: number;
    name: string;
    rank: number;
};

interface UserForm {
    name: string;
    email: string;
    phone: string;
    role_id: string;
    warehouse_id: string;
    password: string;
    employee_status: string;
    supervisor_id: string;
}

type WarehouseItem = {
    id: number;
    name: string;
    code: string;
    is_active: boolean;
};

type SupervisorItem = {
    employee_id: number;
    user_id: number;
    name: string;
    role_name: string | null;
    role_rank: number;
};

interface FormModalUserProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (event: FormEvent) => void;
    form: UserForm;
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    isEdit: boolean;
    loading: boolean;
    roles: RoleItem[];
    warehouses: WarehouseItem[];
    employeeStatuses: string[];
    supervisors: SupervisorItem[];
    editingUserId: number | null;
}

export default function FormModalUser({
    isOpen,
    onClose,
    onSubmit,
    form,
    onChange,
    isEdit,
    loading,
    roles,
    warehouses,
    employeeStatuses,
    supervisors,
    editingUserId,
}: FormModalUserProps) {
    const selectedRole = roles.find((role) => String(role.id) === form.role_id);
    const selectedRoleRank = selectedRole ? (selectedRole.rank ?? 0) : null;

    const availableSupervisors = supervisors
        .filter((supervisor) => supervisor.user_id !== editingUserId)
        .filter((supervisor) => {
            if (selectedRoleRank === null) {
                return true;
            }

            const supervisorRank = supervisor.role_rank ?? 0;
            return supervisorRank > selectedRoleRank;
        });

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl dark:bg-gray-900" onClick={(event) => event.stopPropagation()}>
                <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
                    <h3 className="flex items-center gap-3 text-2xl font-bold text-gray-900 dark:text-white">
                        <UserIcon className="h-8 w-8 text-indigo-600" />
                        {isEdit ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}
                    </h3>
                    <button onClick={onClose} className="rounded-lg p-2 transition hover:bg-gray-100 dark:hover:bg-gray-800">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <form onSubmit={onSubmit} className="space-y-6 p-6 md:p-8">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Nama Lengkap</label>
                            <input
                                name="name"
                                value={form.name}
                                onChange={onChange}
                                required
                                placeholder="Masukkan nama lengkap"
                                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                            <input
                                name="email"
                                type="email"
                                value={form.email}
                                onChange={onChange}
                                required
                                placeholder="nama@company.com"
                                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">No. Telepon</label>
                            <input
                                name="phone"
                                value={form.phone}
                                onChange={onChange}
                                placeholder="Opsional"
                                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
                            <select
                                name="role_id"
                                value={form.role_id}
                                onChange={onChange}
                                required
                                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800"
                            >
                                <option value="">Pilih role</option>
                                {roles.map((role) => (
                                    <option key={role.id} value={role.id}>
                                        {role.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Gudang Default</label>
                            <select
                                name="warehouse_id"
                                value={form.warehouse_id}
                                onChange={onChange}
                                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800"
                            >
                                <option value="">Tanpa Gudang</option>
                                {warehouses.map((warehouse) => (
                                    <option key={warehouse.id} value={warehouse.id}>
                                        {warehouse.name} ({warehouse.code})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Status Pegawai</label>
                            <select
                                name="employee_status"
                                value={form.employee_status}
                                onChange={onChange}
                                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800"
                            >
                                {employeeStatuses.map((status) => (
                                    <option key={status} value={status}>{status}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Pimpinan / Leader</label>
                            <select
                                name="supervisor_id"
                                value={form.supervisor_id}
                                onChange={onChange}
                                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800"
                            >
                                <option value="">Tanpa Pimpinan</option>
                                {availableSupervisors.map((supervisor) => (
                                        <option key={supervisor.employee_id} value={supervisor.employee_id}>
                                            {supervisor.name}{supervisor.role_name ? ` (${supervisor.role_name})` : ''}
                                        </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Password {isEdit ? '(kosongkan jika tidak diganti)' : ''}
                            </label>
                            <input
                                name="password"
                                type="password"
                                value={form.password}
                                onChange={onChange}
                                required={!isEdit}
                                placeholder={isEdit ? '••••••••' : 'Minimal 8 karakter'}
                                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-4 border-t border-gray-200 pt-6 dark:border-gray-800">
                        <button type="button" onClick={onClose} className="rounded-xl border border-gray-300 px-8 py-3 transition hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800">
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-8 py-3 text-white shadow-md transition hover:bg-indigo-700 disabled:opacity-70"
                        >
                            {loading && <Loader2 className="h-5 w-5 animate-spin" />}
                            {isEdit ? 'Simpan Perubahan' : 'Tambah Pengguna'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
