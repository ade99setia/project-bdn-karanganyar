import { Head, router, usePage } from '@inertiajs/react';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import TiptapUnderline from '@tiptap/extension-underline';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import imageCompression from 'browser-image-compression';
import { Bell, Bold, CheckCheck, Heading2, ImagePlus, Italic, Link2, List, ListOrdered, Loader2, Quote, Send, Trash2, Underline, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactNode } from 'react';
import UserMultiSelect from '@/components/inputs/UserMultiSelect';
import WerehouseMultiSelect from '@/components/inputs/WerehouseMultiSelect';
import AlertModal from '@/components/modal/alert-modal';
import ConfirmNotificationModal from '@/components/modal/confirm-notification-modal';
import ImagePreviewModal from '@/components/modal/image-preview-modal';
import TableWithPaginationNotificationHistory from '@/components/settings/notifications/TableWithPaginationNotificationHistory';
import { useImagePreviewModal } from '@/hooks/use-image-preview-modal';
import AppLayout from '@/layouts/app-layout';
import { PushNotificationService } from '@/services/push-notification-service';
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
    active_device_token_count?: number;
    has_active_device_token?: boolean;
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

type NotificationHistoryRecipient = {
    id: number;
    name: string;
};

type NotificationHistoryRow = {
    id: number;
    id_announcement?: number | null;
    type: string;
    title: string;
    message: string;
    priority: 'low' | 'normal' | 'high' | string;
    channel: string;
    action_url?: string | null;
    sent_at?: string | null;
    created_at?: string | null;
    recipient_count: number;
    recipients: NotificationHistoryRecipient[];
};

type Pagination<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
};

type NotificationTypeOption = {
    value: string;
    label: string;
};

type HistoryFilterPayload = Record<string, string | number | boolean | null | undefined>;

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
    notification_type: string;
    notification_type_options: NotificationTypeOption[];
    history_notifications: Pagination<NotificationHistoryRow>;
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

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Announcement Settings',
        href: '/settings/announcements',
    },
];

const TOKEN_READY_FILTER_STORAGE_KEY = 'notifications.showTokenReadyOnly';

const hasMeaningfulHtmlContent = (value: string): boolean => {
    const textOnly = value
        .replace(/<[^>]*>/g, ' ')
        .replace(/&nbsp;/gi, ' ')
        .trim();

    return textOnly.length > 0 || /<img\b/i.test(value);
};

export default function NotificationSettingsPage() {
    const {
        auth,
        users,
        roles,
        warehouses,
        flash,
        notification_type,
        notification_type_options,
        history_notifications,
    } = usePage<PageProps>().props;
    const { isPreviewOpen, previewUrl, openPreview, closePreview } = useImagePreviewModal();

    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [redirectUrl, setRedirectUrl] = useState('');
    const [announcementTitle, setAnnouncementTitle] = useState('');
    const [announcementHtml, setAnnouncementHtml] = useState('');
    const [priority, setPriority] = useState<'low' | 'normal' | 'high'>('normal');
    const [selectedRoleIds, setSelectedRoleIds] = useState<Array<string | number>>([]);
    const [selectedWarehouseIds, setSelectedWarehouseIds] = useState<Array<string | number>>([]);
    const [selectedUserIds, setSelectedUserIds] = useState<Array<string | number>>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCompressingAnnouncementImage, setIsCompressingAnnouncementImage] = useState(false);
    const [confirmSendOpen, setConfirmSendOpen] = useState(false);
    const [previewPage, setPreviewPage] = useState(1);
    const imageInputRef = useRef<HTMLInputElement | null>(null);
    const [showTokenReadyOnly, setShowTokenReadyOnly] = useState(() => {
        if (typeof window === 'undefined') {
            return true;
        }

        const storedValue = window.localStorage.getItem(TOKEN_READY_FILTER_STORAGE_KEY);
        if (storedValue === null) {
            return true;
        }

        return storedValue === 'true';
    });

    const [alertConfig, setAlertConfig] = useState<AlertConfigType>({
        isOpen: false,
        title: '',
        message: '',
        type: 'info',
    });

    const tiptapEditor = useEditor({
        extensions: [
            StarterKit,
            TiptapUnderline,
            Link.configure({
                openOnClick: false,
                autolink: false,
                HTMLAttributes: {
                    target: '_blank',
                    rel: 'noopener noreferrer',
                },
            }),
            Image,
            Placeholder.configure({
                placeholder: 'Tulis pengumuman lengkap (teks, bulleting, numbering, gambar, dll)...',
            }),
        ],
        content: announcementHtml || '',
        onUpdate: ({ editor }) => {
            setAnnouncementHtml(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'min-h-56 w-full rounded-b-xl bg-white px-4 py-3 text-sm leading-7 text-slate-700 focus:outline-none dark:bg-gray-800 dark:text-slate-200 [&_h1]:mt-6 [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:leading-tight [&_h1]:text-slate-900 dark:[&_h1]:text-slate-100 [&_h2]:my-5 [&_h2]:rounded-r-lg [&_h2]:border-l-4 [&_h2]:border-blue-500 [&_h2]:bg-blue-50 [&_h2]:px-3 [&_h2]:py-2 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:leading-tight [&_h2]:text-blue-900 dark:[&_h2]:border-blue-400 dark:[&_h2]:bg-blue-900/20 dark:[&_h2]:text-blue-100 [&_h3]:mt-4 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-slate-900 dark:[&_h3]:text-slate-100 [&_p]:my-3 [&_p]:leading-7 [&_ul]:my-3 [&_ul]:ml-6 [&_ul]:list-disc [&_ul]:space-y-1 [&_ol]:my-3 [&_ol]:ml-6 [&_ol]:list-decimal [&_ol]:space-y-1 [&_li]:pl-1 [&_a]:font-medium [&_a]:text-blue-600 [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-blue-700 dark:[&_a]:text-blue-400 dark:hover:[&_a]:text-blue-300 [&_blockquote]:my-4 [&_blockquote]:border-l-4 [&_blockquote]:border-slate-300 [&_blockquote]:bg-slate-50 [&_blockquote]:px-4 [&_blockquote]:py-2 [&_blockquote]:italic dark:[&_blockquote]:border-slate-700 dark:[&_blockquote]:bg-slate-800/60 [&_img]:my-4 [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-xl [&_img]:border [&_img]:border-slate-200 dark:[&_img]:border-slate-700 [&_hr]:my-6 [&_hr]:border-slate-200 dark:[&_hr]:border-slate-700',
            },
        },
        immediatelyRender: false,
    });

    useEffect(() => {
        window.localStorage.setItem(TOKEN_READY_FILTER_STORAGE_KEY, String(showTokenReadyOnly));
    }, [showTokenReadyOnly]);

    useEffect(() => {
        document.body.dataset.disableSidebarShortcut = 'true';

        return () => {
            delete document.body.dataset.disableSidebarShortcut;
        };
    }, []);

    useEffect(() => {
        if (!tiptapEditor) {
            return;
        }

        const handleEditorShortcuts = (event: KeyboardEvent) => {
            const isModifierPressed = event.ctrlKey || event.metaKey;

            if (!isModifierPressed || event.key.toLowerCase() !== 'b') {
                return;
            }

            event.preventDefault();
            event.stopPropagation();

            if (event.shiftKey) {
                tiptapEditor.chain().focus().toggleBlockquote().run();
                return;
            }

            tiptapEditor.chain().focus().toggleBold().run();
        };

        window.addEventListener('keydown', handleEditorShortcuts, true);

        return () => {
            window.removeEventListener('keydown', handleEditorShortcuts, true);
        };
    }, [tiptapEditor]);

    const showAlert = useCallback((nextTitle: string, nextMessage: ReactNode, type: AlertConfigType['type']) => {
        setAlertConfig({
            isOpen: true,
            title: nextTitle,
            message: nextMessage,
            type,
        });
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

    const selectableUsers = useMemo(() => {
        if (showTokenReadyOnly) {
            return filteredUsers.filter((user) => Boolean(user.has_active_device_token));
        }

        return filteredUsers.filter((user) => !user.has_active_device_token);
    }, [filteredUsers, showTokenReadyOnly]);

    const recipientItems = useMemo(() => {
        return selectableUsers.map((user) => ({
            id: user.id,
            title: user.name,
            subtitle: `${user.role_name ?? 'No Role'} • ${user.warehouse_name ?? 'No Warehouse'} • Token Aktif: ${user.active_device_token_count ?? 0}${user.phone ? ` • ${user.phone}` : ''}`,
            image: user.avatar ? `/storage/profiles/${user.avatar}` : null,
            tag: user.has_active_device_token ? undefined : 'Belum ada token',
        }));
    }, [selectableUsers]);

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

    const selectedRecipientsWithoutToken = useMemo(() => {
        return selectedRecipients.filter((user) => !user.has_active_device_token);
    }, [selectedRecipients]);

    const hasSelectedRecipientsWithoutToken = selectedRecipientsWithoutToken.length > 0;

    const senderIdentityLine = useMemo(() => {
        const senderId = auth?.user?.id;
        const senderName = auth?.user?.name;

        if (!senderId || !senderName) {
            return '';
        }

        return `Pengirim: ${senderName} (User ID: ${senderId})`;
    }, [auth]);

    const composedMessage = useMemo(() => {
        const baseMessage = message.trim();
        if (!baseMessage) {
            return '';
        }

        if (!senderIdentityLine) {
            return baseMessage;
        }

        return `${baseMessage}\n\n—\n${senderIdentityLine}`;
    }, [message, senderIdentityLine]);

    const announcementContentExists = useMemo(() => {
        return hasMeaningfulHtmlContent(announcementHtml);
    }, [announcementHtml]);

    const filteredSelectedCount = useMemo(() => {
        const selectedSet = new Set(selectedUserIds.map((id) => Number(id)));
        return selectableUsers.reduce((count, user) => (selectedSet.has(user.id) ? count + 1 : count), 0);
    }, [selectableUsers, selectedUserIds]);

    const allFilteredSelected = selectableUsers.length > 0 && filteredSelectedCount === selectableUsers.length;
    const unselectedFilteredCount = Math.max(selectableUsers.length - filteredSelectedCount, 0);

    const previewItemsPerPage = 8;
    const previewTotalPages = Math.max(1, Math.ceil(selectedRecipients.length / previewItemsPerPage));
    const previewCurrentPage = Math.min(previewPage, previewTotalPages);
    const previewStartIndex = (previewCurrentPage - 1) * previewItemsPerPage;
    const previewRecipients = selectedRecipients.slice(previewStartIndex, previewStartIndex + previewItemsPerPage);

    const handleSelectAllFilteredUsers = () => {
        const filteredIds = selectableUsers.map((user) => user.id);
        const merged = new Set([...selectedUserIds.map((id) => Number(id)), ...filteredIds]);
        setSelectedUserIds(Array.from(merged));
    };

    const handleClearSelectedUsers = () => {
        setSelectedUserIds([]);
        setPreviewPage(1);
    };

    const handleRemoveRecipient = (userId: number) => {
        setSelectedUserIds((prev) => prev.filter((id) => Number(id) !== Number(userId)));
    };

    const runEditorCommand = (command: 'bold' | 'italic' | 'underline' | 'insertUnorderedList' | 'insertOrderedList' | 'heading' | 'blockquote') => {
        if (!tiptapEditor) {
            return;
        }

        const chain = tiptapEditor.chain().focus();

        if (command === 'bold') {
            chain.toggleBold().run();
            return;
        }

        if (command === 'italic') {
            chain.toggleItalic().run();
            return;
        }

        if (command === 'underline') {
            chain.toggleUnderline().run();
            return;
        }

        if (command === 'insertUnorderedList') {
            chain.toggleBulletList().run();
            return;
        }

        if (command === 'heading') {
            chain.toggleHeading({ level: 2 }).run();
            return;
        }

        if (command === 'blockquote') {
            chain.toggleBlockquote().run();
            return;
        }

        chain.toggleOrderedList().run();
    };

    const insertImageToEditor = useCallback(async (selectedFile: File) => {
        if (!selectedFile) {
            return;
        }

        setIsCompressingAnnouncementImage(true);

        try {
            const compressed = await imageCompression(selectedFile, {
                maxSizeMB: 0.35,
                maxWidthOrHeight: 1024,
                fileType: 'image/webp',
                initialQuality: 0.72,
                useWebWorker: false,
            });

            const finalFile = new File([compressed], `announcement-${Date.now()}.webp`, { type: 'image/webp' });

            const reader = new FileReader();
            reader.onload = () => {
                const result = typeof reader.result === 'string' ? reader.result : '';
                if (!result || !tiptapEditor) {
                    return;
                }

                tiptapEditor
                    .chain()
                    .focus()
                    .setImage({ src: result, alt: 'announcement-image' })
                    .run();
            };

            reader.readAsDataURL(finalFile);
        } catch {
            showAlert(
                'Gagal Memproses Gambar',
                'Terjadi kesalahan saat mengompresi gambar. Silakan coba lagi dengan gambar yang berbeda.',
                'error'
            );
        } finally {
            setIsCompressingAnnouncementImage(false);
        }
    }, [showAlert, tiptapEditor]);

    useEffect(() => {
        if (!tiptapEditor) {
            return;
        }

        const editorDom = tiptapEditor.view.dom;

        const handleEditorPaste = (event: ClipboardEvent) => {
            const imageFile = Array.from(event.clipboardData?.files ?? []).find((file) => file.type.startsWith('image/'));
            if (!imageFile) {
                return;
            }

            event.preventDefault();
            void insertImageToEditor(imageFile);
        };

        editorDom.addEventListener('paste', handleEditorPaste as EventListener);

        return () => {
            editorDom.removeEventListener('paste', handleEditorPaste as EventListener);
        };
    }, [insertImageToEditor, tiptapEditor]);

    const handleInsertImage = async (event: ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0];
        if (!selectedFile) {
            return;
        }

        await insertImageToEditor(selectedFile);

        if (imageInputRef.current) {
            imageInputRef.current.value = '';
        }
    };

    const handleInsertLink = () => {
        const url = window.prompt('Masukkan URL tujuan link', 'https://');
        if (!url) {
            return;
        }

        const normalizedUrl = url.trim();
        if (!normalizedUrl) {
            return;
        }

        if (!tiptapEditor) {
            return;
        }

        if (tiptapEditor.state.selection.empty) {
            tiptapEditor
                .chain()
                .focus()
                .insertContent(`<a href="${normalizedUrl}" target="_blank" rel="noopener noreferrer">${normalizedUrl}</a>`)
                .run();
            return;
        }

        tiptapEditor
            .chain()
            .focus()
            .extendMarkRange('link')
            .setLink({ href: normalizedUrl, target: '_blank', rel: 'noopener noreferrer' })
            .run();
    };

    const renderDeliverySummary = (result: {
        recipient_count: number;
        target_device_count?: number;
        sent: number;
        failed: number;
        skipped_no_token: number;
    }) => (
        <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/60">
                <span className="text-slate-600 dark:text-slate-300">Penerima user</span>
                <span className="rounded-full border border-blue-300 bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-300">{result.recipient_count}</span>
            </div>

            <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/60">
                <span className="text-slate-600 dark:text-slate-300">Target device aktif</span>
                <span className="rounded-full border border-indigo-300 bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 dark:border-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">{result.target_device_count ?? result.sent + result.failed}</span>
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
                <span className="text-slate-600 dark:text-slate-300">Tanpa token</span>
                <span className="rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-300">{result.skipped_no_token}</span>
            </div>
        </div>
    );

    const handleSubmit = async () => {
        if (selectedUserIds.length === 0) {
            showAlert('Perhatian', 'Pilih minimal satu user penerima notifikasi.', 'warning');
            return;
        }

        if (hasSelectedRecipientsWithoutToken) {
            showAlert('Perhatian', 'Ada user terpilih yang belum memiliki token device aktif. Hapus user tersebut sebelum mengirim.', 'warning');
            return;
        }

        if (title.trim() === '' || message.trim() === '') {
            showAlert('Perhatian', 'Judul dan isi notifikasi wajib diisi.', 'warning');
            return;
        }

        if (redirectUrl.trim() !== '' && !redirectUrl.trim().startsWith('/')) {
            showAlert('Perhatian', 'URL halaman tujuan harus diawali dengan "/". Contoh: /announcements/123', 'warning');
            return;
        }

        setIsSubmitting(true);

        try {
            const targetUserIds = selectedUserIds
                .map((id) => Number(id))
                .filter((id) => Number.isFinite(id));

            const result = await PushNotificationService.sendTargeted({
                targetUserIds,
                title: title.trim(),
                message: composedMessage,
                announcementTitle: announcementTitle.trim() || undefined,
                announcementContent: announcementContentExists ? announcementHtml : undefined,
                priority,
                type: 'manual_targeted',
                actionUrl: redirectUrl.trim() || undefined,
                data: {
                    source: 'settings_announcements',
                    role_filters: selectedRoleIds,
                    warehouse_filters: selectedWarehouseIds,
                    sender_id: auth?.user?.id ?? null,
                    sender_name: auth?.user?.name ?? null,
                },
            });

            if (result.success) {
                showAlert(
                    'Berhasil',
                    <div className="space-y-3 text-left">
                        <p>{result.message}</p>
                        {renderDeliverySummary(result)}
                    </div>,
                    'success'
                );
                setTitle('');
                setMessage('');
                setRedirectUrl('');
                setAnnouncementTitle('');
                setAnnouncementHtml('');
                tiptapEditor?.commands.clearContent();
                setSelectedUserIds([]);
                setPreviewPage(1);
            } else {
                showAlert(
                    'Gagal',
                    <div className="space-y-3 text-left">
                        <p>{result.message}</p>
                        {renderDeliverySummary(result)}
                    </div>,
                    'error'
                );
            }
        } catch (error) {
            const errorMessage = error instanceof Error
                ? error.message
                : 'Terjadi kesalahan saat mengirim notifikasi.';
            showAlert('Gagal', errorMessage, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const openConfirmSend = () => {
        if (selectedUserIds.length === 0) {
            showAlert('Perhatian', 'Pilih minimal satu user penerima notifikasi.', 'warning');
            return;
        }

        if (hasSelectedRecipientsWithoutToken) {
            showAlert('Perhatian', 'Ada user terpilih yang belum memiliki token device aktif. Hapus user tersebut sebelum mengirim.', 'warning');
            return;
        }

        if (title.trim() === '' || message.trim() === '') {
            showAlert('Perhatian', 'Judul dan isi notifikasi wajib diisi.', 'warning');
            return;
        }

        if (redirectUrl.trim() !== '' && !redirectUrl.trim().startsWith('/')) {
            showAlert('Perhatian', 'URL halaman tujuan harus diawali dengan "/". Contoh: /announcements/123', 'warning');
            return;
        }

        setConfirmSendOpen(true);
    };

    const updateHistoryFilters = (payload: HistoryFilterPayload) => {
        router.get('/settings/announcements', payload, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Announcement Settings" />

            <div className="min-h-screen space-y-8 bg-blue-50/20 dark:bg-blue-950/10 pb-20 pt-8 px-4 sm:px-6 lg:px-8">
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
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <h1 className="flex items-center gap-3 text-2xl font-bold text-gray-900 dark:text-white md:text-3xl">
                                <Bell className="h-8 w-8 text-indigo-600 md:h-10 md:w-10" />
                                Announcement Settings
                            </h1>
                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                Kirim notifikasi push ke user tertentu yang dipilih.
                            </p>
                        </div>
                    </div>
                </section>

                <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Buat Notifikasi</h2>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                            Isi judul, pilih prioritas, lalu tulis isi pesan yang ingin dikirim.
                        </p>
                    </div>

                    <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-12">
                        <div className="md:col-span-8">
                            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Judul</label>
                            <input
                                value={title}
                                onChange={(event) => setTitle(event.target.value)}
                                placeholder="Contoh: Informasi Distribusi Hari Ini"
                                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800"
                            />
                        </div>

                        <div className="md:col-span-4">
                            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Priority</label>
                            <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-800/60">
                                {(['low', 'normal', 'high'] as const).map((option) => (
                                    <button
                                        key={option}
                                        type="button"
                                        onClick={() => setPriority(option)}
                                        className={`flex-1 rounded-md px-3 py-2.5 text-xs font-semibold uppercase transition ${priority === option
                                            ? option === 'low'
                                                ? 'bg-emerald-600 text-white'
                                                : option === 'normal'
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-rose-600 text-white'
                                            : 'text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700'
                                            }`}
                                    >
                                        {option}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="mt-5">
                        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Isi Notifikasi</label>
                        <textarea
                            value={message}
                            onChange={(event) => setMessage(event.target.value)}
                            rows={4}
                            placeholder="Tulis isi notifikasi..."
                            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800"
                        />
                    </div>

                    <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-12">
                        <div className="md:col-span-6">
                            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Halaman Tujuan (Opsional)</label>
                            <input
                                value={redirectUrl}
                                onChange={(event) => setRedirectUrl(event.target.value)}
                                placeholder="Contoh: /announcements/123 atau /sales/dashboard"
                                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800"
                            />
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                Jika kosong dan konten pengumuman diisi, sistem otomatis mengarahkan ke halaman pengumuman baru.
                            </p>
                        </div>

                        <div className="md:col-span-6">
                            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Judul Pengumuman (Opsional)</label>
                            <input
                                value={announcementTitle}
                                onChange={(event) => setAnnouncementTitle(event.target.value)}
                                placeholder="Jika kosong, akan mengikuti judul notifikasi"
                                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800"
                            />
                        </div>
                    </div>

                    <div className="mt-5">
                        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Konten Pengumuman Lengkap (Opsional)</label>

                        <div className="rounded-xl border border-slate-200 dark:border-slate-700">
                            <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-800/50">
                                <button type="button" onClick={() => runEditorCommand('bold')} className="rounded-md border border-slate-300 px-2 py-1 text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700">
                                    <Bold className="h-4 w-4" />
                                </button>
                                <button type="button" onClick={() => runEditorCommand('italic')} className="rounded-md border border-slate-300 px-2 py-1 text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700">
                                    <Italic className="h-4 w-4" />
                                </button>
                                <button type="button" onClick={() => runEditorCommand('underline')} className="rounded-md border border-slate-300 px-2 py-1 text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700">
                                    <Underline className="h-4 w-4" />
                                </button>
                                <button type="button" onClick={() => runEditorCommand('heading')} className="rounded-md border border-slate-300 px-2 py-1 text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700">
                                    <Heading2 className="h-4 w-4" />
                                </button>
                                <button type="button" onClick={() => runEditorCommand('blockquote')} className="rounded-md border border-slate-300 px-2 py-1 text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700">
                                    <Quote className="h-4 w-4" />
                                </button>
                                <button type="button" onClick={() => runEditorCommand('insertUnorderedList')} className="rounded-md border border-slate-300 px-2 py-1 text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700">
                                    <List className="h-4 w-4" />
                                </button>
                                <button type="button" onClick={() => runEditorCommand('insertOrderedList')} className="rounded-md border border-slate-300 px-2 py-1 text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700">
                                    <ListOrdered className="h-4 w-4" />
                                </button>
                                <button type="button" onClick={handleInsertLink} className="rounded-md border border-slate-300 px-2 py-1 text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700">
                                    <Link2 className="h-4 w-4" />
                                </button>
                                <button type="button" onClick={() => imageInputRef.current?.click()} disabled={isCompressingAnnouncementImage} className="rounded-md border border-slate-300 px-2 py-1 text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700">
                                    {isCompressingAnnouncementImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                                </button>
                                <input
                                    ref={imageInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleInsertImage}
                                />
                            </div>

                            <EditorContent editor={tiptapEditor} />
                        </div>

                        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                            Konten ini opsional. Jika diisi, akan disimpan sebagai halaman pengumuman terpisah lalu notifikasi bisa mengarah ke halaman tersebut.
                        </p>
                    </div>
                </section>

                <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Pilih User Penerima</h2>
                        <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                            Terpilih: {selectedUserIds.length}
                        </span>
                    </div>

                    <div className="mt-4 space-y-4">
                        <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                            <div className="mb-4">
                                <div className="min-w-45 flex-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
                                    <div className="grid grid-cols-2 gap-1">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowTokenReadyOnly(true);
                                                setPreviewPage(1);
                                            }}
                                            className={`rounded-md px-4 py-1.5 text-xs font-semibold transition-all sm:text-sm ${showTokenReadyOnly
                                                ? 'bg-orange-500 text-white shadow-sm dark:bg-orange-600 dark:text-white'
                                                : 'text-slate-600 hover:bg-slate-200/60 dark:text-slate-300 dark:hover:bg-slate-700/60'
                                                }`}
                                        >
                                            Token Aktif
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowTokenReadyOnly(false);
                                                setPreviewPage(1);
                                            }}
                                            className={`rounded-md px-4 py-1.5 text-xs font-semibold transition-all sm:text-sm ${!showTokenReadyOnly
                                                ? 'bg-white text-rose-600 shadow-sm dark:bg-slate-700 dark:text-rose-400'
                                                : 'text-slate-600 hover:bg-slate-200/60 dark:text-slate-300 dark:hover:bg-slate-700/60'
                                                }`}
                                        >
                                            Token Tidak Aktif
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
                                <UserMultiSelect
                                    label="Filter Role"
                                    items={roleItems}
                                    value={selectedRoleIds}
                                    onChange={(ids) => {
                                        setSelectedRoleIds(ids);
                                        setPreviewPage(1);
                                    }}
                                    placeholder="Role..."
                                    onPreviewImage={openPreview}
                                />

                                <WerehouseMultiSelect
                                    label="Filter Gudang"
                                    items={warehouseItems}
                                    value={selectedWarehouseIds}
                                    onChange={(ids) => {
                                        setSelectedWarehouseIds(ids);
                                        setPreviewPage(1);
                                    }}
                                    placeholder="Pilih..."
                                    onPreviewImage={openPreview}
                                />
                            </div>
                        </div>

                        <UserMultiSelect
                            label="Pilih User Penerima"
                            items={recipientItems}
                            value={selectedUserIds}
                            onChange={(ids) => {
                                setSelectedUserIds(ids);
                                setPreviewPage(1);
                            }}
                            placeholder="User..."
                            onPreviewImage={openPreview}
                        />

                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            <button
                                type="button"
                                onClick={handleSelectAllFilteredUsers}
                                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                            >
                                <CheckCheck className="h-4 w-4" />
                                {allFilteredSelected
                                    ? `Semua Terpilih (${filteredSelectedCount})`
                                    : filteredSelectedCount > 0
                                        ? `Pilih Sisa (${unselectedFilteredCount})`
                                        : `Pilih Semua (${selectableUsers.length} Penerima)`}
                            </button>

                            <button
                                type="button"
                                onClick={handleClearSelectedUsers}
                                className="inline-flex items-center justify-center gap-2 rounded-lg border border-rose-300 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 dark:border-rose-700 dark:text-rose-300 dark:hover:bg-rose-900/30"
                            >
                                <Trash2 className="h-4 w-4" />
                                Hapus Semua Penerima
                            </button>
                        </div>
                    </div>

                    <div className="mt-4 rounded-xl border border-slate-200 dark:border-slate-700">
                        <div className="border-b border-slate-200 px-4 py-3 text-sm font-semibold text-slate-800 dark:border-slate-700 dark:text-slate-200">
                            Preview Penerima ({selectedRecipients.length})
                        </div>

                        {selectedRecipients.length === 0 ? (
                            <div className="px-4 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                                Belum ada user yang dipilih.
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 gap-3 p-4 lg:grid-cols-2">
                                    {previewRecipients.map((user) => (
                                        <div key={user.id} className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="h-10 w-10 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0">
                                                        {user.avatar ? (
                                                            <button
                                                                type="button"
                                                                onClick={() => openPreview(`/storage/profiles/${user.avatar}`)}
                                                                className="h-full w-full block cursor-pointer"
                                                            >
                                                                <img src={`/storage/profiles/${user.avatar}`} alt={user.name} className="h-full w-full object-cover" />
                                                            </button>
                                                        ) : (
                                                            <div className="h-full w-full flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300">
                                                                {user.name.charAt(0).toUpperCase()}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2 min-w-0">
                                                            <div className="font-semibold text-slate-800 dark:text-slate-100 truncate">{user.name}</div>
                                                            {!user.has_active_device_token && (
                                                                <span className="shrink-0 rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                                                                    Belum ada token
                                                                </span>
                                                            )}
                                                            {user.has_active_device_token && (
                                                                <span className="shrink-0 rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                                                                    Token Aktif: {user.active_device_token_count ?? 0}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-xs text-slate-500 dark:text-slate-400">
                                                            ID: {user.id}
                                                            {user.role_name ? ` • ${user.role_name}` : ' • No Role'}
                                                            {user.warehouse_name ? ` • ${user.warehouse_name}` : ' • No Warehouse'}
                                                            {` • Token Aktif: ${user.active_device_token_count ?? 0}`}
                                                            {user.phone ? ` • ${user.phone}` : ''}
                                                        </div>
                                                    </div>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveRecipient(user.id)}
                                                    className="inline-flex items-center justify-center rounded-md border border-rose-300 p-1.5 text-rose-700 transition hover:bg-rose-50 dark:border-rose-700 dark:text-rose-300 dark:hover:bg-rose-900/30 self-center"
                                                    title="Hapus penerima"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {previewTotalPages > 1 && (
                                    <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 dark:border-slate-700">
                                        <div className="text-xs text-slate-500 dark:text-slate-400">
                                            Menampilkan {previewStartIndex + 1}-{Math.min(previewStartIndex + previewItemsPerPage, selectedRecipients.length)} dari {selectedRecipients.length}
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setPreviewPage((prev) => Math.max(prev - 1, 1))}
                                                disabled={previewCurrentPage === 1}
                                                className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                                            >
                                                Prev
                                            </button>
                                            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                                                {previewCurrentPage} / {previewTotalPages}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => setPreviewPage((prev) => Math.min(prev + 1, previewTotalPages))}
                                                disabled={previewCurrentPage === previewTotalPages}
                                                className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                                            >
                                                Next
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        {hasSelectedRecipientsWithoutToken ? (
                            <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
                                {selectedRecipientsWithoutToken.length} penerima belum punya token aktif. Hapus dulu agar bisa kirim.
                            </p>
                        ) : (
                            <span />
                        )}

                        <button
                            type="button"
                            onClick={openConfirmSend}
                            disabled={isSubmitting || hasSelectedRecipientsWithoutToken}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-70"
                        >
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            Kirim Notifikasi
                        </button>
                    </div>
                </section>

                <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                    <TableWithPaginationNotificationHistory
                        historyNotifications={history_notifications}
                        notificationType={notification_type}
                        notificationTypeOptions={notification_type_options}
                        updateFilters={updateHistoryFilters}
                    />
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
                confirmButtonText={isSubmitting ? 'Mengirim...' : 'Konfirmasi & Kirim'}
                notificationPreview={{
                    title: title.trim(),
                    message: composedMessage,
                    priority,
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
