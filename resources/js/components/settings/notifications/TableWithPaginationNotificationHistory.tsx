import { Link } from '@inertiajs/react';
import { BellRing, ExternalLink, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import MultiSelectFilter from '@/components/inputs/MultiSelectFilter';

interface RecipientRow {
    id: number;
    name: string;
}

interface NotificationHistoryRow {
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
    recipients: RecipientRow[];
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

interface TypeOption {
    value: string;
    label: string;
}

interface Props {
    historyNotifications: Pagination<NotificationHistoryRow>;
    notificationType: string;
    notificationTypeOptions: TypeOption[];
    updateFilters: (payload: Record<string, string | number | boolean | null | undefined>) => void;
}

export default function TableWithPaginationNotificationHistory({
    historyNotifications,
    notificationType,
    notificationTypeOptions,
    updateFilters,
}: Props) {
    const [expandedRecipientRows, setExpandedRecipientRows] = useState<Record<number, boolean>>({});

    const visibleNotificationTypeOptions = useMemo(() => {
        return notificationTypeOptions.filter((option) => option.value !== 'all');
    }, [notificationTypeOptions]);

    const selectedNotificationTypes = useMemo(() => {
        return notificationType
            .split(',')
            .map((value) => value.trim())
            .filter((value) => value.length > 0 && value !== 'all');
    }, [notificationType]);

    const notificationTypeFilterOptions = useMemo(() => {
        return visibleNotificationTypeOptions.map((option) => ({
            label: option.label,
            value: option.value,
        }));
    }, [visibleNotificationTypeOptions]);

    const handleTypeFilterChange = (values: string[]) => {
        if (values.length === 0) {
            updateFilters({ notification_type: 'all', history_page: 1 });
            return;
        }

        updateFilters({ notification_type: values.join(','), history_page: 1 });
    };

    const handlePageChange = (page: number) => {
        updateFilters({ history_page: page });
    };

    const toggleRecipients = (rowId: number) => {
        setExpandedRecipientRows((prev) => ({
            ...prev,
            [rowId]: !prev[rowId],
        }));
    };

    return (
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="border-b border-gray-200 px-4 py-4 sm:px-6 dark:border-gray-800">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-base font-semibold text-gray-900 dark:text-white">
                            <BellRing className="h-4 w-4" />
                            Riwayat Notifikasi
                        </div>
                        <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                            Filter tipe notifikasi untuk melihat riwayat yang lebih spesifik.
                        </p>
                    </div>

                    <div className="w-full lg:max-w-md xl:max-w-lg">
                        <MultiSelectFilter
                            options={notificationTypeFilterOptions}
                            value={selectedNotificationTypes}
                            onChange={handleTypeFilterChange}
                            placeholder="Semua Tipe"
                            searchPlaceholder="Cari tipe..."
                            className="w-full"
                        />
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-800">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 text-left dark:bg-gray-800/60">
                        <tr className="border-b border-gray-200 dark:border-gray-800">
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">ID</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Waktu</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Judul & Isi</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Tipe / Prioritas</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Penerima</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Lihat Detail</th>
                        </tr>
                    </thead>

                    <tbody>
                        {historyNotifications.data.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                                    Tidak ada riwayat notifikasi
                                </td>
                            </tr>
                        ) : (
                            historyNotifications.data.map((history) => {
                                const isExpanded = Boolean(expandedRecipientRows[history.id]);
                                const shownRecipients = isExpanded ? history.recipients : history.recipients.slice(0, 3);
                                const hiddenCount = Math.max(history.recipients.length - 3, 0);
                                const recipientTitle = history.recipients.map((recipient) => recipient.name).join(', ');

                                return (
                                    <tr key={history.id} className="border-b border-gray-200 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50">
                                        <td className="px-6 py-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                            {history.id}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                                            {history.sent_at ?? history.created_at ?? '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-semibold text-gray-900 dark:text-white">{history.title}</div>
                                            <div className="mt-1 max-w-xl whitespace-pre-line text-xs text-gray-600 line-clamp-3 dark:text-gray-400">
                                                {history.message}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-xs font-semibold text-gray-800 dark:text-gray-200">{history.type}</div>
                                            <span className={`mt-1 inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase ${history.priority === 'high'
                                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300'
                                                : history.priority === 'low'
                                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                                                    : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                                }`}>
                                                {history.priority}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-start gap-2" title={recipientTitle}>
                                                <Users className="mt-0.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
                                                <div className="flex flex-wrap items-center gap-1.5">
                                                    {shownRecipients.map((recipient) => (
                                                        <span
                                                            key={recipient.id}
                                                            className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                                                        >
                                                            {recipient.name}
                                                        </span>
                                                    ))}
                                                    {hiddenCount > 0 && !isExpanded && (
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleRecipients(history.id)}
                                                            className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:hover:bg-indigo-900/50"
                                                        >
                                                            +{hiddenCount} lagi
                                                        </button>
                                                    )}
                                                    {hiddenCount > 0 && isExpanded && (
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleRecipients(history.id)}
                                                            className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
                                                        >
                                                            Tampilkan lebih sedikit
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                                Total penerima: {history.recipient_count}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                                            {history.id_announcement ? (
                                                <Link
                                                    href={`/announcements/${history.id_announcement}`}
                                                    className="inline-flex items-center gap-1.5 rounded-md border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300 dark:hover:bg-indigo-900/50"
                                                >
                                                    <ExternalLink className="h-3.5 w-3.5" />
                                                    {history.id_announcement}
                                                </Link>
                                            ) : '-'}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {historyNotifications.last_page > 1 && (
                <div className="flex flex-col gap-4 border-t border-gray-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 dark:border-gray-800">
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                        Menampilkan <span className="font-medium">{historyNotifications.from}</span> -{' '}
                        <span className="font-medium">{historyNotifications.to}</span> dari{' '}
                        <span className="font-medium">{historyNotifications.total}</span> riwayat
                    </div>

                    <nav aria-label="Pagination">
                        <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-2">
                            <button
                                onClick={() => handlePageChange(historyNotifications.current_page - 1)}
                                disabled={historyNotifications.current_page === 1}
                                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                            >
                                Sebelumnya
                            </button>

                            {Array.from({ length: historyNotifications.last_page }, (_, index) => index + 1).map((page) => {
                                const current = historyNotifications.current_page;

                                return (
                                    <button
                                        key={page}
                                        onClick={() => handlePageChange(page)}
                                        className={`min-w-10 rounded-md px-3 py-2 text-sm font-medium transition ${page === current
                                            ? 'border-indigo-600 bg-indigo-600 text-white'
                                            : 'border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
                                            }`}
                                    >
                                        {page}
                                    </button>
                                );
                            })}

                            <button
                                onClick={() => handlePageChange(historyNotifications.current_page + 1)}
                                disabled={historyNotifications.current_page === historyNotifications.last_page}
                                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                            >
                                Selanjutnya
                            </button>
                        </div>
                    </nav>
                </div>
            )}
        </div>
    );
}
