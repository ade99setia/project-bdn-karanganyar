import { X, AlertTriangle } from 'lucide-react';
import React, { useState } from 'react';
import { createPortal } from 'react-dom';

interface NotificationRecipient {
    id: number;
    name: string;
    role_name?: string | null;
    warehouse_name?: string | null;
    phone?: string | null;
    avatar?: string | null;
}

interface NotificationPreview {
    title: string;
    message: string;
    priority: 'low' | 'normal' | 'high';
    recipients: NotificationRecipient[];
}

interface ConfirmNotificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    confirmButtonText?: string;
    notificationPreview: NotificationPreview;
}

export default function ConfirmNotificationModal({
    isOpen,
    onClose,
    onConfirm,
    confirmButtonText,
    notificationPreview,
}: ConfirmNotificationModalProps) {
    const itemsPerPage = 8;
    const [page, setPage] = useState(1);

    const handleClose = () => {
        setPage(1);
        onClose();
    };

    const handleConfirm = () => {
        setPage(1);
        onConfirm();
    };

    if (!isOpen) return null;

    const totalPages = Math.max(1, Math.ceil(notificationPreview.recipients.length / itemsPerPage));
    const currentPage = Math.min(page, totalPages);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedRecipients = notificationPreview.recipients.slice(startIndex, startIndex + itemsPerPage);

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4" onClick={handleClose}>
            <div className="relative w-full max-w-5xl max-h-[92vh] overflow-hidden rounded-2xl bg-white shadow-lg dark:bg-gray-900" onClick={(e) => e.stopPropagation()}>
                <button onClick={handleClose} className="absolute top-3 right-3 z-10 rounded-md p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100">
                    <X size={18} />
                </button>

                <div className="max-h-[92vh] overflow-y-auto p-4 sm:p-6">
                    <div className="flex items-center gap-4">
                        <div className="rounded-full bg-amber-100 p-3 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                            <AlertTriangle size={28} />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Konfirmasi Kirim Notifikasi</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Pastikan isi notifikasi dan daftar penerima sudah benar sebelum mengirim.</p>
                        </div>
                    </div>

                    <div className="mt-6 space-y-4 text-sm text-gray-700 dark:text-gray-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <div className="text-xs uppercase text-zinc-400 dark:text-zinc-500">Judul</div>
                                <div className="font-medium">{notificationPreview.title || '—'}</div>
                            </div>
                            <div>
                                <div className="text-xs uppercase text-zinc-400 dark:text-zinc-500">Priority</div>
                                <div className="font-medium uppercase">{notificationPreview.priority}</div>
                            </div>
                        </div>

                        <div>
                            <div className="text-xs uppercase text-zinc-400 dark:text-zinc-500">Isi Notifikasi</div>
                            <div className="font-medium whitespace-pre-line">{notificationPreview.message || '—'}</div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between gap-3">
                                <div className="text-xs uppercase text-zinc-400 dark:text-zinc-500">Penerima ({notificationPreview.recipients.length})</div>
                                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                                    Menampilkan {notificationPreview.recipients.length === 0 ? 0 : startIndex + 1}-{Math.min(startIndex + itemsPerPage, notificationPreview.recipients.length)} dari {notificationPreview.recipients.length}
                                </div>
                            </div>

                            <div className="mt-2 overflow-x-auto rounded-md border border-gray-200 dark:border-gray-700">
                                <table className="min-w-full text-sm">
                                    <thead className="bg-gray-50 dark:bg-gray-800/70">
                                        <tr>
                                            <th className="px-3 py-2 text-left text-gray-700 dark:text-gray-300">User</th>
                                            <th className="px-3 py-2 text-left text-gray-700 dark:text-gray-300">Role</th>
                                            <th className="px-3 py-2 text-left text-gray-700 dark:text-gray-300">Gudang</th>
                                            <th className="px-3 py-2 text-left text-gray-700 dark:text-gray-300">Phone</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedRecipients.map((recipient) => (
                                            <tr key={recipient.id} className="border-t border-gray-200 dark:border-gray-700">
                                                <td className="px-3 py-2">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                                            {recipient.avatar ? (
                                                                <img src={`/storage/profiles/${recipient.avatar}`} alt={recipient.name} className="h-full w-full object-cover" />
                                                            ) : (
                                                                recipient.name.charAt(0).toUpperCase()
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className="font-medium">{recipient.name}</div>
                                                            <div className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">ID: {recipient.id}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-2">{recipient.role_name || '—'}</td>
                                                <td className="px-3 py-2">{recipient.warehouse_name || '—'}</td>
                                                <td className="px-3 py-2">{recipient.phone || '—'}</td>
                                            </tr>
                                        ))}
                                        {paginatedRecipients.length === 0 && (
                                            <tr className="border-t border-gray-200 dark:border-gray-700">
                                                <td colSpan={4} className="px-3 py-4 text-center text-zinc-500 dark:text-zinc-400">Belum ada penerima.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {totalPages > 1 && (
                                <div className="mt-3 flex items-center justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                        className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm transition disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
                                    >
                                        Prev
                                    </button>
                                    <span className="text-xs text-zinc-600 dark:text-zinc-400">{currentPage} / {totalPages}</span>
                                    <button
                                        type="button"
                                        onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                                        disabled={currentPage === totalPages}
                                        className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm transition disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
                                    >
                                        Next
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-6 flex flex-col-reverse justify-end gap-2 sm:flex-row sm:gap-3">
                        <button onClick={handleClose} className="rounded-xl bg-gray-100 px-4 py-2 text-gray-700 transition hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700">Batal</button>
                        <button onClick={handleConfirm} className="rounded-xl bg-amber-600 px-4 py-2 text-white transition hover:bg-amber-700 dark:bg-amber-600 dark:hover:bg-amber-500">{confirmButtonText || 'Konfirmasi & Kirim'}</button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}

export type { NotificationPreview, NotificationRecipient, ConfirmNotificationModalProps };