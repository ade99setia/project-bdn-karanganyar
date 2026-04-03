import { Head, router, usePage } from '@inertiajs/react';
import { ArrowDown, ArrowUp, Bold, CheckCircle2, Clock, Eye, FileImage, FileText, Italic, List, ListOrdered, Loader2, MessageCircle, Paperclip, Quote, Send, Strikethrough, Trash2, Upload, X, XCircle } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent, type ReactNode } from 'react';
import UserMultiSelect from '@/components/inputs/UserMultiSelect';
import WerehouseMultiSelect from '@/components/inputs/WerehouseMultiSelect';
import AlertModal from '@/components/modal/alert-modal';
import ConfirmNotificationModal from '@/components/modal/confirm-notification-modal';
import ImagePreviewModal from '@/components/modal/image-preview-modal';
import { useImagePreviewModal } from '@/hooks/use-image-preview-modal';
import AppLayout from '@/layouts/app-layout';
import { WhatsappBlastService } from '@/services/whatsapp-blast-service';
import type { BreadcrumbItem } from '@/types';

type UserRow = {
    id: number;
    name: string;
    phone?: string | null;
    avatar?: string | null;
    role_id?: number | null;
    role_name?: string | null;
    warehouse_id?: number | null;
    warehouse_name?: string | null;
    has_phone?: boolean;
};

type RoleRow = {
    id: number;
    name: string;
    rank?: number | null;
};

type WarehouseRow = {
    id: number;
    name: string;
    code?: string | null;
    file_path?: string | null;
    is_active?: boolean;
};

type BlastHistoryRow = {
    id: number;
    sender: string | null;
    type: string;
    keyword: string | null;
    message: string | null;
    http_status: number | null;
    is_success: boolean;
    target_user_name: string | null;
    attachment_name: string | null;
    attachment_type: string | null;
    source: string | null;
    created_at: string | null;
};

interface PageProps {
    auth: {
        user: {
            id: number;
            name: string;
        };
    };
    users: UserRow[];
    roles: RoleRow[];
    warehouses: WarehouseRow[];
    blast_history: BlastHistoryRow[];
    flash?: {
        success?: string;
        error?: string;
        warning?: string;
        info?: string;
    };
    [key: string]: unknown;
}

type AlertConfigType = {
    isOpen: boolean;
    title: string;
    message: ReactNode;
    type: 'success' | 'error' | 'warning' | 'info';
};

type AttachmentEntry = {
    id: string;
    file: File;
    previewUrl: string | null;
    isImage: boolean;
    isPdf: boolean;
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'WhatsApp Blasting',
        href: '/settings/whatsapp-blasting',
    },
];

const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024;
const ALLOWED_ATTACHMENT_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'];

function isImageFile(file: File | null): boolean {
    return Boolean(file?.type.startsWith('image/'));
}

function isPdfFile(file: File | null): boolean {
    return file?.type === 'application/pdf' || file?.name.toLowerCase().endsWith('.pdf') === true;
}

function formatAttachmentSize(bytes: number): string {
    if (bytes < 1024 * 1024) {
        return `${Math.max(1, Math.round(bytes / 1024))} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function composeWhatsappBody(title: string, message: string): string {
    const cleanTitle = title.trim();
    const cleanMessage = message.trim();

    if (cleanTitle === '') {
        return cleanMessage;
    }

    if (cleanMessage === '') {
        return `*${cleanTitle}*`;
    }

    return `*${cleanTitle}*\n\n${cleanMessage}`;
}

function buildAttachmentId(file: File): string {
    return `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function WhatsappBlastingSettingsPage() {
    const { users, roles, warehouses, flash, blast_history } = usePage<PageProps>().props;
    const { isPreviewOpen, previewUrl, openPreview, closePreview } = useImagePreviewModal();
    const attachmentInputRef = useRef<HTMLInputElement | null>(null);
    const attachmentsRef = useRef<AttachmentEntry[]>([]);
    const messageInputRef = useRef<HTMLTextAreaElement | null>(null);

    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [selectedRoleIds, setSelectedRoleIds] = useState<Array<string | number>>([]);
    const [selectedWarehouseIds, setSelectedWarehouseIds] = useState<Array<string | number>>([]);
    const [selectedUserIds, setSelectedUserIds] = useState<Array<string | number>>([]);
    const [attachments, setAttachments] = useState<AttachmentEntry[]>([]);
    const [singleAttachmentDeliveryMode, setSingleAttachmentDeliveryMode] = useState<'single_combined' | 'separate'>('single_combined');
    const [isDragOverAttachments, setIsDragOverAttachments] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [confirmSendOpen, setConfirmSendOpen] = useState(false);

    const [alertConfig, setAlertConfig] = useState<AlertConfigType>({
        isOpen: false,
        title: '',
        message: '',
        type: 'info',
    });

    const showAlert = (nextTitle: string, nextMessage: ReactNode, type: AlertConfigType['type']) => {
        setAlertConfig({
            isOpen: true,
            title: nextTitle,
            message: nextMessage,
            type,
        });
    };

    useEffect(() => {
        attachmentsRef.current = attachments;
    }, [attachments]);

    useEffect(() => {
        return () => {
            attachmentsRef.current.forEach((attachment) => {
                if (attachment.previewUrl) {
                    URL.revokeObjectURL(attachment.previewUrl);
                }
            });
        };
    }, []);

    const filteredUsers = useMemo(() => {
        const selectedRoleSet = new Set(selectedRoleIds.map((id) => Number(id)));
        const selectedWarehouseSet = new Set(selectedWarehouseIds.map((id) => Number(id)));

        return users.filter((user) => {
            const roleMatched = selectedRoleSet.size === 0
                ? true
                : user.role_id !== null && user.role_id !== undefined && selectedRoleSet.has(Number(user.role_id));

            const warehouseMatched = selectedWarehouseSet.size === 0
                ? true
                : user.warehouse_id !== null && user.warehouse_id !== undefined && selectedWarehouseSet.has(Number(user.warehouse_id));

            return roleMatched && warehouseMatched;
        });
    }, [users, selectedRoleIds, selectedWarehouseIds]);

    const usersWithPhone = useMemo(() => {
        return filteredUsers.filter((user) => Boolean(user.has_phone));
    }, [filteredUsers]);

    const recipientItems = useMemo(() => {
        return usersWithPhone.map((user) => ({
            id: user.id,
            title: user.name,
            subtitle: `${user.role_name ?? 'No Role'} • ${user.warehouse_name ?? 'No Warehouse'}${user.phone ? ` • ${user.phone}` : ''}`,
            image: user.avatar ? `/storage/profiles/${user.avatar}` : null,
        }));
    }, [usersWithPhone]);

    const roleItems = useMemo(() => {
        return roles.map((role) => ({
            id: role.id,
            title: role.name,
            subtitle: `Rank ${role.rank ?? 0}`,
            meta: String(role.rank ?? 0),
        }));
    }, [roles]);

    const warehouseItems = useMemo(() => {
        return warehouses.map((warehouse) => ({
            id: warehouse.id,
            title: warehouse.name,
            subtitle: warehouse.code ?? '-',
            image: warehouse.file_path ? `/storage/${warehouse.file_path}` : null,
        }));
    }, [warehouses]);

    const selectedRecipients = useMemo(() => {
        const selectedSet = new Set(selectedUserIds.map((id) => Number(id)));
        return users.filter((user) => selectedSet.has(user.id));
    }, [users, selectedUserIds]);

    const usersWithoutPhone = useMemo(() => {
        return selectedRecipients.filter((user) => !user.has_phone);
    }, [selectedRecipients]);

    const hasSelectedRecipientsWithoutPhone = usersWithoutPhone.length > 0;
    const hasAttachments = attachments.length > 0;
    const isSingleAttachment = attachments.length === 1;
    const effectiveAttachmentDeliveryMode = isSingleAttachment ? singleAttachmentDeliveryMode : 'separate';
    const attachmentModeDescription = !hasAttachments
        ? null
        : isSingleAttachment
            ? effectiveAttachmentDeliveryMode === 'single_combined'
                ? '1 file: teks digabung dengan lampiran'
                : '1 file: teks dipisah dari lampiran'
            : `${attachments.length} file: teks dipisah, semua file dikirim satu per satu`;
    const previewBody = composeWhatsappBody(title, message);

    const handleSelectAllFilteredUsers = () => {
        const filteredIds = usersWithPhone.map((user) => user.id);
        const merged = new Set([...selectedUserIds.map((id) => Number(id)), ...filteredIds]);
        setSelectedUserIds(Array.from(merged));
    };

    const handleClearSelectedUsers = () => {
        setSelectedUserIds([]);
    };

    const handleRemoveRecipient = (userId: number) => {
        setSelectedUserIds((prev) => prev.filter((id) => Number(id) !== Number(userId)));
    };

    const handleClearAttachmentInput = () => {
        if (attachmentInputRef.current) {
            attachmentInputRef.current.value = '';
        }
    };

    const appendAttachments = (selectedFiles: File[]) => {
        if (selectedFiles.length === 0) {
            return;
        }

        const nextAttachments: AttachmentEntry[] = [];

        for (const file of selectedFiles) {
            const extension = file.name.includes('.')
                ? file.name.split('.').pop()?.toLowerCase() ?? ''
                : '';

            if (!ALLOWED_ATTACHMENT_EXTENSIONS.includes(extension)) {
                showAlert('Format tidak didukung', 'Lampiran hanya mendukung gambar atau dokumen: JPG, PNG, WEBP, PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT.', 'warning');
                handleClearAttachmentInput();
                return;
            }

            if (file.size > MAX_ATTACHMENT_SIZE) {
                showAlert('Ukuran terlalu besar', `Ukuran lampiran maksimal 10 MB per file. File ${file.name} melebihi batas.`, 'warning');
                handleClearAttachmentInput();
                return;
            }

            nextAttachments.push({
                id: buildAttachmentId(file),
                file,
                isImage: isImageFile(file),
                isPdf: isPdfFile(file),
                previewUrl: isImageFile(file) || isPdfFile(file) ? URL.createObjectURL(file) : null,
            });
        }

        setAttachments((previous) => [...previous, ...nextAttachments]);
        handleClearAttachmentInput();
    };

    const handleAttachmentChange = (event: ChangeEvent<HTMLInputElement>) => {
        appendAttachments(Array.from(event.target.files ?? []));
    };

    const handleAttachmentDrop = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsDragOverAttachments(false);
        appendAttachments(Array.from(event.dataTransfer.files ?? []));
    };

    const handleAttachmentDragOver = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsDragOverAttachments(true);
    };

    const handleAttachmentDragLeave = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
            return;
        }
        setIsDragOverAttachments(false);
    };

    const handleRemoveAttachment = (attachmentId: string) => {
        setAttachments((previous) => {
            const attachment = previous.find((item) => item.id === attachmentId);
            if (attachment?.previewUrl) {
                URL.revokeObjectURL(attachment.previewUrl);
            }

            const next = previous.filter((item) => item.id !== attachmentId);
            if (next.length !== 1) {
                setSingleAttachmentDeliveryMode('single_combined');
            }

            return next;
        });
    };

    const handleClearAttachments = () => {
        setAttachments((previous) => {
            previous.forEach((attachment) => {
                if (attachment.previewUrl) {
                    URL.revokeObjectURL(attachment.previewUrl);
                }
            });

            return [];
        });
        setSingleAttachmentDeliveryMode('single_combined');
        handleClearAttachmentInput();
    };

    const moveAttachment = (attachmentId: string, direction: 'up' | 'down') => {
        setAttachments((previous) => {
            const currentIndex = previous.findIndex((attachment) => attachment.id === attachmentId);
            if (currentIndex === -1) {
                return previous;
            }

            const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
            if (targetIndex < 0 || targetIndex >= previous.length) {
                return previous;
            }

            const next = [...previous];
            const [moved] = next.splice(currentIndex, 1);
            next.splice(targetIndex, 0, moved);
            return next;
        });
    };

    const replaceMessageSelection = (nextValue: string, selectionStart: number, selectionEnd: number) => {
        setMessage(nextValue);

        requestAnimationFrame(() => {
            const textarea = messageInputRef.current;
            if (!textarea) {
                return;
            }

            textarea.focus();
            textarea.setSelectionRange(selectionStart, selectionEnd);
        });
    };

    const applyInlineFormatting = (marker: string, placeholder: string) => {
        const textarea = messageInputRef.current;
        if (!textarea) {
            return;
        }

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = message.slice(start, end);
        const content = selectedText || placeholder;
        const replacement = `${marker}${content}${marker}`;
        const nextValue = `${message.slice(0, start)}${replacement}${message.slice(end)}`;
        const contentStart = start + marker.length;
        const contentEnd = contentStart + content.length;

        replaceMessageSelection(nextValue, contentStart, contentEnd);
    };

    const applyLineFormatting = (formatter: (line: string, index: number) => string) => {
        const textarea = messageInputRef.current;
        if (!textarea) {
            return;
        }

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const blockStart = message.lastIndexOf('\n', Math.max(0, start - 1)) + 1;
        const nextLineBreak = message.indexOf('\n', end);
        const blockEnd = nextLineBreak === -1 ? message.length : nextLineBreak;
        const block = message.slice(blockStart, blockEnd);
        const lines = block.split('\n');
        const formatted = lines.map((line, index) => {
            if (line.trim() === '') {
                return line;
            }

            return formatter(line, index);
        }).join('\n');
        const nextValue = `${message.slice(0, blockStart)}${formatted}${message.slice(blockEnd)}`;

        replaceMessageSelection(nextValue, blockStart, blockStart + formatted.length);
    };

    const formattingActions = [
        {
            label: 'Bold',
            icon: Bold,
            onClick: () => applyInlineFormatting('*', 'teks tebal'),
        },
        {
            label: 'Italic',
            icon: Italic,
            onClick: () => applyInlineFormatting('_', 'teks miring'),
        },
        {
            label: 'Strike',
            icon: Strikethrough,
            onClick: () => applyInlineFormatting('~', 'teks coret'),
        },
        {
            label: 'Bullet',
            icon: List,
            onClick: () => applyLineFormatting((line) => `- ${line.replace(/^[-*•]\s+/, '')}`),
        },
        {
            label: 'Numbering',
            icon: ListOrdered,
            onClick: () => applyLineFormatting((line, index) => `${index + 1}. ${line.replace(/^\d+\.\s+/, '')}`),
        },
        {
            label: 'Quote',
            icon: Quote,
            onClick: () => applyLineFormatting((line) => `> ${line.replace(/^>\s*/, '')}`),
        },
    ];

    const renderDeliverySummary = (result: {
        recipient_count: number;
        sent: number;
        failed: number;
        skipped_no_phone: number;
    }) => (
        <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/60">
                <span className="text-slate-600 dark:text-slate-300">Penerima valid</span>
                <span className="rounded-full border border-blue-300 bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-300">{result.recipient_count}</span>
            </div>

            <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/60">
                <span className="text-slate-600 dark:text-slate-300">Terkirim</span>
                <span className="rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">{result.sent}</span>
            </div>

            <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/60">
                <span className="text-slate-600 dark:text-slate-300">Gagal</span>
                <span className="rounded-full border border-rose-300 bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700 dark:border-rose-700 dark:bg-rose-900/30 dark:text-rose-300">{result.failed}</span>
            </div>

            <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/60">
                <span className="text-slate-600 dark:text-slate-300">Tanpa nomor</span>
                <span className="rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-300">{result.skipped_no_phone}</span>
            </div>
        </div>
    );

    const handleSubmit = async () => {
        if (selectedUserIds.length === 0) {
            showAlert('Perhatian', 'Pilih minimal satu user penerima WhatsApp.', 'warning');
            return;
        }

        if (hasSelectedRecipientsWithoutPhone) {
            showAlert('Perhatian', 'Ada user terpilih yang belum memiliki nomor telepon. Hapus user tersebut sebelum mengirim.', 'warning');
            return;
        }

        if (title.trim() === '' || message.trim() === '') {
            showAlert('Perhatian', 'Judul dan isi pesan WhatsApp wajib diisi.', 'warning');
            return;
        }

        setIsSubmitting(true);

        try {
            const targetUserIds = selectedUserIds
                .map((id) => Number(id))
                .filter((id) => Number.isFinite(id));

            const result = await WhatsappBlastService.sendTargeted({
                targetUserIds,
                title: title.trim(),
                message: message.trim(),
                type: 'manual_targeted_whatsapp',
                attachments: attachments.map((attachment) => attachment.file),
                attachmentDeliveryMode: effectiveAttachmentDeliveryMode,
            });

            if (result.success) {
                router.get('/settings/whatsapp-blasting', {}, {
                    only: ['blast_history'],
                    preserveScroll: true,
                    preserveState: true,
                    replace: true,
                });

                showAlert(
                    'Berhasil',
                    <div className="space-y-3 text-left">
                        <p>Pesan WhatsApp berhasil diproses.</p>
                        {renderDeliverySummary(result)}
                    </div>,
                    'success'
                );
                setTitle('');
                setMessage('');
                setSelectedUserIds([]);
                handleClearAttachments();
            } else {
                showAlert(
                    'Gagal',
                    <div className="space-y-3 text-left">
                        <p>{result.message || 'Terjadi kendala saat mengirim WhatsApp.'}</p>
                        {renderDeliverySummary(result)}
                    </div>,
                    'error'
                );
            }
        } catch (error) {
            const errorMessage = error instanceof Error
                ? error.message
                : 'Terjadi kesalahan saat mengirim WhatsApp.';
            showAlert('Gagal', errorMessage, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const openConfirmSend = () => {
        if (selectedUserIds.length === 0) {
            showAlert('Perhatian', 'Pilih minimal satu user penerima WhatsApp.', 'warning');
            return;
        }

        if (hasSelectedRecipientsWithoutPhone) {
            showAlert('Perhatian', 'Ada user terpilih yang belum memiliki nomor telepon. Hapus user tersebut sebelum mengirim.', 'warning');
            return;
        }

        if (title.trim() === '' || message.trim() === '') {
            showAlert('Perhatian', 'Judul dan isi pesan WhatsApp wajib diisi.', 'warning');
            return;
        }

        setConfirmSendOpen(true);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="WhatsApp Blasting" />

            <div className="min-h-screen space-y-8 bg-emerald-50/20 pb-20 pt-8 px-4 sm:px-6 lg:px-8 dark:bg-emerald-950/10">
                {(flash?.success || flash?.error || flash?.warning || flash?.info) && (
                    <div className={`rounded-xl border px-4 py-3 text-sm ${flash?.success
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300'
                        : flash?.error
                            ? 'border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-700 dark:bg-rose-900/20 dark:text-rose-300'
                            : 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                        }`}>
                        {flash?.success || flash?.error || flash?.warning || flash?.info}
                    </div>
                )}

                <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">WhatsApp Blasting</h1>
                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Flow dibuat serupa dengan announcements: filter penerima, pilih user, review, lalu kirim.</p>
                        </div>
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-2 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300">
                            <MessageCircle size={18} />
                        </div>
                    </div>
                </section>

                <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 space-y-5">
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        <UserMultiSelect
                            items={roleItems}
                            value={selectedRoleIds}
                            onChange={setSelectedRoleIds}
                            label="Filter Role"
                            placeholder="Pilih role..."
                        />

                        <WerehouseMultiSelect
                            items={warehouseItems}
                            value={selectedWarehouseIds}
                            onChange={setSelectedWarehouseIds}
                            label="Filter Gudang"
                            placeholder="Pilih gudang..."
                            onPreviewImage={openPreview}
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                        <button
                            type="button"
                            onClick={handleSelectAllFilteredUsers}
                            className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300 dark:hover:bg-emerald-900/30"
                        >
                            Pilih Semua User Filtered (Punya Nomor)
                        </button>
                        <button
                            type="button"
                            onClick={handleClearSelectedUsers}
                            className="rounded-xl border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 dark:border-rose-700 dark:bg-rose-900/20 dark:text-rose-300 dark:hover:bg-rose-900/30"
                        >
                            Hapus Semua Pilihan
                        </button>
                    </div>

                    <UserMultiSelect
                        items={recipientItems}
                        value={selectedUserIds}
                        onChange={setSelectedUserIds}
                        label="Target User"
                        placeholder="Pilih user penerima WhatsApp..."
                        onPreviewImage={openPreview}
                    />

                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
                        Tersedia: {usersWithPhone.length} user dengan nomor valid pada filter saat ini.
                    </div>

                    {selectedRecipients.length > 0 && (
                        <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
                            <div className="mb-2 text-xs font-semibold uppercase text-slate-500">Penerima terpilih ({selectedRecipients.length})</div>
                            <div className="flex flex-wrap gap-2">
                                {selectedRecipients.map((recipient) => (
                                    <div key={recipient.id} className="inline-flex max-w-full items-center gap-2 rounded-full border border-slate-300 bg-slate-50 px-3 py-1 text-xs dark:border-slate-700 dark:bg-slate-800">
                                        <span className="truncate">{recipient.name} ({recipient.phone || 'tanpa nomor'})</span>
                                        <button type="button" onClick={() => handleRemoveRecipient(recipient.id)} className="text-slate-500 hover:text-rose-600">
                                            <X size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </section>

                <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 space-y-4">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Judul Pesan</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(event) => setTitle(event.target.value)}
                            placeholder="Contoh: Info Promo Mingguan"
                            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Isi Pesan</label>
                        <div className="mb-2 flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-800/50">
                            {formattingActions.map((action) => {
                                const Icon = action.icon;

                                return (
                                    <button
                                        key={action.label}
                                        type="button"
                                        onClick={action.onClick}
                                        className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                                    >
                                        <Icon size={14} />
                                        {action.label}
                                    </button>
                                );
                            })}
                        </div>

                        <textarea
                            ref={messageInputRef}
                            value={message}
                            onChange={(event) => setMessage(event.target.value)}
                            placeholder="Tulis isi pesan blasting WhatsApp. Bisa pakai bold, italic, bullet, numbering, dan quote."
                            rows={8}
                            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900"
                        />
                        <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                            Format WhatsApp yang didukung: <span className="font-medium">*bold*</span>, <span className="font-medium">_italic_</span>, <span className="font-medium">~strike~</span>, <span className="font-medium">- bullet</span>, <span className="font-medium">1. numbering</span>, dan <span className="font-medium">&gt; quote</span>.
                        </div>
                    </div>

                    <div className="space-y-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-800/30">
                        <div
                            onDrop={handleAttachmentDrop}
                            onDragOver={handleAttachmentDragOver}
                            onDragLeave={handleAttachmentDragLeave}
                            className={`rounded-2xl border border-dashed px-4 py-6 text-center transition ${isDragOverAttachments ? 'border-emerald-400 bg-emerald-50 text-emerald-700 dark:border-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-300' : 'border-slate-300 bg-white/70 text-slate-500 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-400'}`}
                        >
                            <div className="mx-auto flex w-fit items-center gap-2 rounded-full bg-white px-3 py-1.5 text-sm font-medium shadow-sm dark:bg-slate-900">
                                <Upload size={16} />
                                Drag & drop file ke sini
                            </div>
                            <p className="mt-2 text-xs">Atau gunakan tombol pilih file untuk menambah banyak lampiran sekaligus.</p>
                        </div>

                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div>
                                <div className="text-sm font-medium text-slate-700 dark:text-slate-200">Lampiran Opsional</div>
                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Bisa kirim banyak gambar atau dokumen. Maksimal 10 MB per file.</p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={() => attachmentInputRef.current?.click()}
                                    className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                                >
                                    <Paperclip size={16} />
                                    {hasAttachments ? 'Tambah Gambar / Dokumen' : 'Pilih Gambar / Dokumen'}
                                </button>

                                {hasAttachments && (
                                    <button
                                        type="button"
                                        onClick={handleClearAttachments}
                                        className="inline-flex items-center gap-2 rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-100 dark:border-rose-700 dark:bg-rose-900/20 dark:text-rose-300 dark:hover:bg-rose-900/30"
                                    >
                                        <Trash2 size={16} />
                                        Hapus Semua Lampiran
                                    </button>
                                )}
                            </div>
                        </div>

                        <input
                            ref={attachmentInputRef}
                            type="file"
                            multiple
                            accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain"
                            className="hidden"
                            onChange={handleAttachmentChange}
                        />

                        {isSingleAttachment && hasAttachments ? (
                            <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 dark:border-amber-800 dark:bg-amber-900/10">
                                <div className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">Mode 1 Lampiran</div>
                                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                                    <button
                                        type="button"
                                        onClick={() => setSingleAttachmentDeliveryMode('single_combined')}
                                        className={`rounded-xl border px-3 py-2 text-left text-sm transition ${singleAttachmentDeliveryMode === 'single_combined' ? 'border-emerald-400 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300' : 'border-slate-300 bg-white text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200'}`}
                                    >
                                        <div className="font-medium">Gabung teks + lampiran</div>
                                        <div className="mt-1 text-xs opacity-80">Default. Cocok kalau caption masih muat di WhatsApp.</div>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSingleAttachmentDeliveryMode('separate')}
                                        className={`rounded-xl border px-3 py-2 text-left text-sm transition ${singleAttachmentDeliveryMode === 'separate' ? 'border-emerald-400 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300' : 'border-slate-300 bg-white text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200'}`}
                                    >
                                        <div className="font-medium">Pisah teks dan lampiran</div>
                                        <div className="mt-1 text-xs opacity-80">Text dikirim sendiri, lalu file dikirim setelahnya tanpa caption.</div>
                                    </button>
                                </div>
                            </div>
                        ) : null}

                        {attachments.length > 1 ? (
                            <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3 text-xs text-blue-700 dark:border-blue-800 dark:bg-blue-900/10 dark:text-blue-300">
                                Karena file lebih dari satu, sistem otomatis memisahkan teks dari semua lampiran. Teks akan dikirim sekali, lalu tiap file dikirim satu per satu.
                            </div>
                        ) : null}

                        {hasAttachments ? (
                            <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
                                <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Lampiran terpilih ({attachments.length})</div>
                                <div className="space-y-3">
                                    {attachments.map((attachment, index) => (
                                        <div key={attachment.id} className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/60 sm:flex-row sm:items-center sm:justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`rounded-xl p-2 ${attachment.isImage ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300' : 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'}`}>
                                                    {attachment.isImage ? <FileImage size={18} /> : <FileText size={18} />}
                                                </div>

                                                <div>
                                                    <div className="text-sm font-medium text-slate-800 dark:text-slate-100">{index + 1}. {attachment.file.name}</div>
                                                    <div className="text-xs text-slate-500 dark:text-slate-400">{attachment.file.name} • {formatAttachmentSize(attachment.file.size)}</div>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => moveAttachment(attachment.id, 'up')}
                                                    disabled={index === 0}
                                                    className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                                                >
                                                    <ArrowUp size={16} />
                                                    Naik
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => moveAttachment(attachment.id, 'down')}
                                                    disabled={index === attachments.length - 1}
                                                    className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                                                >
                                                    <ArrowDown size={16} />
                                                    Turun
                                                </button>
                                                {attachment.isImage && attachment.previewUrl ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => openPreview(attachment.previewUrl as string)}
                                                        className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                                                    >
                                                        <Eye size={16} />
                                                        Preview
                                                    </button>
                                                ) : null}
                                                {attachment.isPdf && attachment.previewUrl ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => window.open(attachment.previewUrl as string, '_blank', 'noopener,noreferrer')}
                                                        className="inline-flex items-center gap-2 rounded-xl border border-blue-300 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100 dark:border-blue-700 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:bg-blue-900/30"
                                                    >
                                                        <Eye size={16} />
                                                        Preview PDF
                                                    </button>
                                                ) : null}
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveAttachment(attachment.id)}
                                                    className="inline-flex items-center gap-2 rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-100 dark:border-rose-700 dark:bg-rose-900/20 dark:text-rose-300 dark:hover:bg-rose-900/30"
                                                >
                                                    <Trash2 size={16} />
                                                    Hapus
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : null}
                    </div>

                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={openConfirmSend}
                            disabled={isSubmitting}
                            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                            {isSubmitting ? 'Mengirim...' : 'Review & Kirim WhatsApp'}
                        </button>
                    </div>
                </section>

                <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                    <div className="mb-4 flex items-center gap-2">
                        <Clock size={16} className="text-slate-500 dark:text-slate-400" />
                        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Riwayat Blast WhatsApp</h2>
                        <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            {blast_history.length} entry
                        </span>
                    </div>

                    {blast_history.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 py-10 text-slate-400 dark:border-slate-700 dark:bg-slate-800/40">
                            <MessageCircle size={32} className="mb-2 opacity-40" />
                            <p className="text-sm">Belum ada riwayat blast WhatsApp.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                            <table className="w-full min-w-160 text-sm">
                                <thead>
                                    <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/60">
                                        <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Waktu</th>
                                        <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Penerima</th>
                                        <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Nomor</th>
                                        <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Lampiran</th>
                                        <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Pesan</th>
                                        <th className="px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {blast_history.map((log) => (
                                        <tr key={log.id} className="transition hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                            <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                                                {log.created_at ?? '-'}
                                            </td>
                                            <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-100">
                                                {log.target_user_name ?? '-'}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                                                {log.sender ?? '-'}
                                            </td>
                                            <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300">
                                                {log.attachment_name ? (
                                                    <div className="space-y-1">
                                                        <div className="font-medium text-slate-700 dark:text-slate-200">{log.attachment_name}</div>
                                                        <div className="text-[11px] uppercase tracking-wide text-slate-400 dark:text-slate-500">{log.attachment_type ?? 'document'}</div>
                                                    </div>
                                                ) : '-'}
                                            </td>
                                            <td className="max-w-xs px-4 py-3 text-xs text-slate-600 dark:text-slate-300">
                                                <span>{log.message ?? '-'}</span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {log.is_success ? (
                                                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                                                        <CheckCircle2 size={11} />
                                                        Terkirim
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 rounded-full border border-rose-300 bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700 dark:border-rose-700 dark:bg-rose-900/30 dark:text-rose-300">
                                                        <XCircle size={11} />
                                                        Gagal
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </div>

            <AlertModal
                isOpen={alertConfig.isOpen}
                onClose={() => setAlertConfig((prev) => ({ ...prev, isOpen: false }))}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
            />

            <ConfirmNotificationModal
                isOpen={confirmSendOpen}
                onClose={() => setConfirmSendOpen(false)}
                onConfirm={() => {
                    setConfirmSendOpen(false);
                    void handleSubmit();
                }}
                confirmButtonText={isSubmitting ? 'Mengirim...' : 'Konfirmasi & Kirim WhatsApp'}
                notificationPreview={{
                    title: title.trim(),
                    message: previewBody,
                    priority: 'normal',
                    attachmentLabels: attachments.map((attachment) => attachment.file.name),
                    attachmentModeLabel: attachmentModeDescription,
                    recipients: selectedRecipients.map((user) => ({
                        id: user.id,
                        name: user.name,
                        role_name: user.role_name ?? null,
                        warehouse_name: user.warehouse_name ?? null,
                        phone: user.phone ?? null,
                        avatar: user.avatar ?? null,
                    })),
                }}
            />

            {isPreviewOpen && Boolean(previewUrl) && (
                <ImagePreviewModal
                    isOpen={isPreviewOpen}
                    onClose={closePreview}
                    imageUrl={previewUrl}
                />
            )}
        </AppLayout>
    );
}
