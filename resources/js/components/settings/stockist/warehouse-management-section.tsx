import { ImageIcon, Pencil, Plus, Save, Trash2, Upload, Warehouse as WarehouseIcon, X } from 'lucide-react';
import type { Dispatch, RefObject, SetStateAction } from 'react';
import type { Warehouse } from './types';

interface Props {
    warehouses: Warehouse[];
    warehouseForm: { name: string; code: string; is_active: boolean };
    setWarehouseForm: Dispatch<SetStateAction<{ name: string; code: string; is_active: boolean }>>;
    warehouseLoading: boolean;
    createFileInputRef: RefObject<HTMLInputElement | null>;
    setWarehouseCreateFile: Dispatch<SetStateAction<File | null>>;
    createWarehouse: () => void;
    editingWarehouseId: number | null;
    warehouseEditForm: { name: string; code: string; is_active: boolean };
    setWarehouseEditForm: Dispatch<SetStateAction<{ name: string; code: string; is_active: boolean }>>;
    setWarehouseEditFile: Dispatch<SetStateAction<File | null>>;
    saveWarehouseUpdate: () => void;
    cancelEditWarehouse: () => void;
    startEditWarehouse: (warehouse: Warehouse) => void;
    deleteWarehouse: (warehouse: Warehouse) => void;
    onPreviewImage: (url: string) => void;
}

export default function WarehouseManagementSection({
    warehouses,
    warehouseForm,
    setWarehouseForm,
    warehouseLoading,
    createFileInputRef,
    setWarehouseCreateFile,
    createWarehouse,
    editingWarehouseId,
    warehouseEditForm,
    setWarehouseEditForm,
    setWarehouseEditFile,
    saveWarehouseUpdate,
    cancelEditWarehouse,
    startEditWarehouse,
    deleteWarehouse,
    onPreviewImage,
}: Props) {
    return (
        <section className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <h2 className="mb-4 font-semibold text-gray-900 dark:text-white">Manajemen Gudang</h2>

            <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-4">
                <div className="relative">
                    <WarehouseIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                        value={warehouseForm.name}
                        onChange={(e) => setWarehouseForm((prev) => ({ ...prev, name: e.target.value }))}
                        placeholder="Nama gudang"
                        className="w-full rounded-xl border border-gray-300 bg-white h-12 pl-12 pr-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:focus:border-indigo-400 dark:focus:ring-indigo-400/30 transition-all duration-200"
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
                                                    <button
                                                        type="button"
                                                        title="Lihat gambar"
                                                        onClick={() => onPreviewImage(`/storage/${warehouse.file_path}`)}
                                                        className="block w-full h-full"
                                                    >
                                                        <img src={`/storage/${warehouse.file_path}`} alt={warehouse.name} className="h-full w-full object-cover cursor-pointer" />
                                                    </button>
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
    );
}
