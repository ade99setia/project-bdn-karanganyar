import { router } from '@inertiajs/react';
import imageCompression from 'browser-image-compression';
import { useRef, useState } from 'react';
import type { Warehouse } from '../types';

export function useWarehouseManagement() {
    const [warehouseForm, setWarehouseForm] = useState({ name: '', code: '', is_active: true });
    const [warehouseLoading, setWarehouseLoading] = useState(false);
    const createFileInputRef = useRef<HTMLInputElement | null>(null);
    const [warehouseCreateFile, setWarehouseCreateFile] = useState<File | null>(null);
    const [editingWarehouseId, setEditingWarehouseId] = useState<number | null>(null);
    const [warehouseEditForm, setWarehouseEditForm] = useState({ name: '', code: '', is_active: true });
    const [warehouseEditFile, setWarehouseEditFile] = useState<File | null>(null);
    const [deleteWarehouseConfirmOpen, setDeleteWarehouseConfirmOpen] = useState(false);
    const [warehouseToDelete, setWarehouseToDelete] = useState<Warehouse | null>(null);

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
        setWarehouseToDelete(warehouse);
        setDeleteWarehouseConfirmOpen(true);
    };

    const closeDeleteWarehouseConfirm = () => {
        setDeleteWarehouseConfirmOpen(false);
        setWarehouseToDelete(null);
    };

    const confirmDeleteWarehouse = () => {
        if (!warehouseToDelete) {
            return;
        }

        setWarehouseLoading(true);
        router.delete(`/settings/warehouses/${warehouseToDelete.id}`, {
            preserveScroll: true,
            onFinish: () => {
                setWarehouseLoading(false);
                closeDeleteWarehouseConfirm();
            },
        });
    };

    return {
        warehouseForm,
        setWarehouseForm,
        warehouseLoading,
        createFileInputRef,
        setWarehouseCreateFile,
        editingWarehouseId,
        warehouseEditForm,
        setWarehouseEditForm,
        setWarehouseEditFile,
        deleteWarehouseConfirmOpen,
        warehouseToDelete,
        closeDeleteWarehouseConfirm,
        confirmDeleteWarehouse,
        createWarehouse,
        startEditWarehouse,
        cancelEditWarehouse,
        saveWarehouseUpdate,
        deleteWarehouse,
    };
}
