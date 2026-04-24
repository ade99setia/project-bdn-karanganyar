import { router } from '@inertiajs/react';
import axios from 'axios';
import { useState } from 'react';
import type { AlertType } from '@/hooks/use-alert-modal';
import type { MembershipTier } from '../types';

interface UseTierManagementProps {
    showAlert: (title: string, message: string, type?: AlertType) => void;
}

export function useTierManagement({ showAlert }: UseTierManagementProps) {
    const [loading, setLoading] = useState(false);

    // Form state
    const [showForm, setShowForm] = useState(false);
    const [editingTier, setEditingTier] = useState<MembershipTier | null>(null);
    const [form, setForm] = useState({
        name: '',
        default_discount_percentage: '',
        description: '',
    });

    // Delete confirm
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [tierToDelete, setTierToDelete] = useState<MembershipTier | null>(null);

    const openCreateForm = () => {
        setEditingTier(null);
        setForm({ name: '', default_discount_percentage: '', description: '' });
        setShowForm(true);
    };

    const openEditForm = (tier: MembershipTier) => {
        setEditingTier(tier);
        setForm({
            name: tier.name,
            default_discount_percentage: tier.default_discount_percentage.toString(),
            description: tier.description ?? '',
        });
        setShowForm(true);
    };

    const cancelForm = () => {
        setShowForm(false);
        setEditingTier(null);
        setForm({ name: '', default_discount_percentage: '', description: '' });
    };

    const saveTier = async () => {
        if (!form.name.trim()) {
            showAlert('Validasi', 'Nama tier wajib diisi.', 'warning');
            return;
        }

        setLoading(true);
        try {
            if (editingTier) {
                await axios.put(`/settings/membership/tiers/${editingTier.id}`, form);
                showAlert('Berhasil', 'Tier berhasil diupdate.', 'success');
            } else {
                await axios.post('/settings/membership/tiers', form);
                showAlert('Berhasil', 'Tier berhasil dibuat.', 'success');
            }
            cancelForm();
            router.reload({ preserveScroll: true });
        } catch (err: any) {
            showAlert('Gagal', err.response?.data?.error ?? 'Gagal menyimpan tier.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const requestDeleteTier = (tier: MembershipTier) => {
        setTierToDelete(tier);
        setDeleteConfirmOpen(true);
    };

    const closeDeleteConfirm = () => {
        setDeleteConfirmOpen(false);
        setTierToDelete(null);
    };

    const confirmDeleteTier = async () => {
        if (!tierToDelete) return;
        setLoading(true);
        try {
            await axios.delete(`/settings/membership/tiers/${tierToDelete.id}`);
            showAlert('Berhasil', 'Tier berhasil dihapus.', 'success');
            router.reload({ preserveScroll: true });
        } catch (err: any) {
            showAlert('Gagal', err.response?.data?.error ?? 'Gagal menghapus tier.', 'error');
        } finally {
            setLoading(false);
            closeDeleteConfirm();
        }
    };

    return {
        loading,
        showForm,
        editingTier,
        form,
        setForm,
        openCreateForm,
        openEditForm,
        cancelForm,
        saveTier,
        deleteConfirmOpen,
        tierToDelete,
        requestDeleteTier,
        closeDeleteConfirm,
        confirmDeleteTier,
    };
}
