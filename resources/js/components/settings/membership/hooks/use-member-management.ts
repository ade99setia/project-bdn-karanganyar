import { router } from '@inertiajs/react';
import axios from 'axios';
import { useState } from 'react';
import type { AlertType } from '@/hooks/use-alert-modal';
import type { Member } from '../types';

interface UseMemberManagementProps {
    showAlert: (title: string, message: string, type?: AlertType) => void;
}

export function useMemberManagement({ showAlert }: UseMemberManagementProps) {
    const [loading, setLoading] = useState(false);

    // Form state
    const [showForm, setShowForm] = useState(false);
    const [editingMember, setEditingMember] = useState<Member | null>(null);
    const [form, setForm] = useState({
        name: '',
        member_number: '',
        phone: '',
        email: '',
        membership_tier_id: '',
        is_active: true,
    });

    // Delete confirm
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);

    const openCreateForm = () => {
        setEditingMember(null);
        setForm({ name: '', member_number: '', phone: '', email: '', membership_tier_id: '', is_active: true });
        setShowForm(true);
    };

    const openEditForm = (member: Member) => {
        setEditingMember(member);
        setForm({
            name: member.name,
            member_number: member.member_number,
            phone: member.phone,
            email: member.email ?? '',
            membership_tier_id: member.membership_tier_id?.toString() ?? '',
            is_active: member.is_active ?? true,
        });
        setShowForm(true);
    };

    const cancelForm = () => {
        setShowForm(false);
        setEditingMember(null);
        setForm({ name: '', member_number: '', phone: '', email: '', membership_tier_id: '', is_active: true });
    };

    const saveMember = async () => {
        if (!form.name.trim() || !form.phone.trim()) {
            showAlert('Validasi', 'Nama dan telepon wajib diisi.', 'warning');
            return;
        }

        setLoading(true);
        try {
            if (editingMember) {
                await axios.put(`/settings/membership/members/${editingMember.id}`, form);
                showAlert('Berhasil', 'Member berhasil diupdate.', 'success');
            } else {
                await axios.post('/settings/membership/members', form);
                showAlert('Berhasil', 'Member berhasil dibuat.', 'success');
            }
            cancelForm();
            router.reload({ preserveScroll: true });
        } catch (err: any) {
            showAlert('Gagal', err.response?.data?.error ?? 'Gagal menyimpan member.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const requestDeleteMember = (member: Member) => {
        setMemberToDelete(member);
        setDeleteConfirmOpen(true);
    };

    const closeDeleteConfirm = () => {
        setDeleteConfirmOpen(false);
        setMemberToDelete(null);
    };

    const confirmDeleteMember = async () => {
        if (!memberToDelete) return;
        setLoading(true);
        try {
            await axios.delete(`/settings/membership/members/${memberToDelete.id}`);
            showAlert('Berhasil', 'Member berhasil dinonaktifkan.', 'success');
            router.reload({ preserveScroll: true });
        } catch (err: any) {
            showAlert('Gagal', err.response?.data?.error ?? 'Gagal menonaktifkan member.', 'error');
        } finally {
            setLoading(false);
            closeDeleteConfirm();
        }
    };

    return {
        loading,
        showForm,
        editingMember,
        form,
        setForm,
        openCreateForm,
        openEditForm,
        cancelForm,
        saveMember,
        deleteConfirmOpen,
        memberToDelete,
        requestDeleteMember,
        closeDeleteConfirm,
        confirmDeleteMember,
    };
}
