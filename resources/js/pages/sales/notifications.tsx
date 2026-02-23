import { Capacitor } from '@capacitor/core';
import { Head, Link } from '@inertiajs/react';
import { Bell, Send, CheckCheck, Clock3, BellRing } from 'lucide-react';
import { useState } from 'react';
import AlertModal from '@/components/modal/alert-modal';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import AppLayout from '@/layouts/app-layout';
import AppLayoutMobile from '@/layouts/app-layout-mobile';
import { PushNotificationService } from '@/services/push-notification-service';
import type { BreadcrumbItem } from '@/types';

type NotificationItem = {
    id: number;
    type: string;
    title: string;
    message: string;
    data: Record<string, unknown> | null;
    action_url: string | null;
    status: 'unread' | 'read' | 'archived';
    channel: 'in_app' | 'push' | 'email';
    priority: 'low' | 'normal' | 'high';
    expires_at: string | null;
    read_at: string | null;
    sent_at: string | null;
    created_at: string | null;
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

interface Props {
    notifications: {
        data: NotificationItem[];
        links: PaginationLink[];
    };
    unreadCount: number;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Notifikasi',
        href: '/sales/notifications',
    },
];

const formatDateTime = (value: string | null) => {
    if (!value) return '-';

    return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(value));
};

const priorityClassMap: Record<NotificationItem['priority'], string> = {
    low: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    normal: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
    high: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};

type AlertConfigType = {
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
};

export default function SalesNotifications({ notifications, unreadCount }: Props) {
    const Layout = Capacitor.isNativePlatform() ? AppLayoutMobile : AppLayout;

    const [alertConfig, setAlertConfig] = useState<AlertConfigType>({
        isOpen: false,
        title: '',
        message: '',
        type: 'info',
    });

    const showAlert = (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info') => {
        setAlertConfig({
            isOpen: true,
            title,
            message,
            type,
        });
    };

    // Setup push notification dengan custom hook
    const { enablePush } = usePushNotifications({
        onReceived: (title, body) => {
            showAlert(title, body, 'info');
        },
        autoRefreshOnReceive: true,
    });

    const handleEnablePushNotifications = async () => {
        if (!Capacitor.isNativePlatform()) {
            showAlert('Perhatian', 'Push notification hanya tersedia di aplikasi mobile native.', 'warning');
            return;
        }

        showAlert('Proses', 'Sedang mendaftar push notification... Tunggu sebentar.', 'info');

        const result = await enablePush();

        if (result.success) {
            showAlert('Berhasil', result.message, 'success');
        } else {
            showAlert('Gagal', result.message, 'error');
        }
    };

    const handleMarkAsRead = (id: number) => {
        PushNotificationService.markAsRead(id);
    };

    const handleMarkAllAsRead = () => {
        PushNotificationService.markAllAsRead();
    };

    const handleSendTestPush = () => {
        PushNotificationService.sendTest({
            onSuccess: (message) => showAlert('Berhasil', message, 'success'),
            onError: (message) => showAlert('Gagal', message, 'error'),
        });
    };

    return (
        <Layout breadcrumbs={breadcrumbs}>
            <Head title="Notifikasi" />

            <div className="min-h-screen bg-blue-50/20 dark:bg-blue-950/10 pb-20 pt-8 px-4 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-4xl space-y-6">
                    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 dark:bg-slate-900 dark:ring-white/10">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div className="rounded-xl bg-blue-100 p-2 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                                    <Bell size={20} />
                                </div>
                                <div>
                                    <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">Riwayat Notifikasi</h1>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        Belum dibaca: <span className="font-semibold text-orange-600 dark:text-orange-400">{unreadCount}</span>
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                {Capacitor.isNativePlatform() && (
                                    <button
                                        type="button"
                                        onClick={handleEnablePushNotifications}
                                        className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-700"
                                    >
                                        <BellRing size={16} />
                                        Aktifkan Push
                                    </button>
                                )}

                                <button
                                    type="button"
                                    onClick={handleSendTestPush}
                                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                                >
                                    <Send size={16} />
                                    Tes Push
                                </button>

                                <button
                                    type="button"
                                    onClick={handleMarkAllAsRead}
                                    disabled={unreadCount === 0}
                                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <CheckCheck size={16} />
                                    Tandai Semua Dibaca
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {notifications.data.length === 0 && (
                            <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-black/5 dark:bg-slate-900 dark:ring-white/10">
                                <p className="text-sm text-slate-500 dark:text-slate-400">Belum ada notifikasi.</p>
                            </div>
                        )}

                        {notifications.data.map((notification) => {
                            const isUnread = notification.status === 'unread';

                            return (
                                <div
                                    key={notification.id}
                                    className={`rounded-2xl border p-4 transition ${isUnread
                                            ? 'border-orange-200 bg-orange-50/50 dark:border-orange-800/50 dark:bg-orange-900/10'
                                            : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
                                        }`}
                                >
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div className="space-y-2">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">{notification.title}</h2>

                                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${priorityClassMap[notification.priority]}`}>
                                                    {notification.priority}
                                                </span>

                                                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                                    {notification.channel}
                                                </span>
                                            </div>

                                            <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                                                {notification.message}
                                            </p>

                                            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                                                <span className="inline-flex items-center gap-1">
                                                    <Clock3 size={13} />
                                                    {formatDateTime(notification.created_at)}
                                                </span>

                                                {notification.expires_at && (
                                                    <span>
                                                        Exp: {formatDateTime(notification.expires_at)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {notification.action_url && (
                                                <Link
                                                    href={notification.action_url}
                                                    className="rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-50 dark:border-blue-700/40 dark:text-blue-300 dark:hover:bg-blue-900/30"
                                                >
                                                    Buka
                                                </Link>
                                            )}

                                            {isUnread ? (
                                                <button
                                                    type="button"
                                                    onClick={() => handleMarkAsRead(notification.id)}
                                                    className="inline-flex items-center gap-1 rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-orange-600"
                                                >
                                                    <BellRing size={14} />
                                                    Tandai Dibaca
                                                </button>
                                            ) : (
                                                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                                    Sudah dibaca
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {notifications.links.length > 3 && (
                        <div className="flex flex-wrap items-center gap-2 pt-2">
                            {notifications.links.map((link, index) => (
                                <Link
                                    key={`${link.label}-${index}`}
                                    href={link.url ?? '#'}
                                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${link.active
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-800'
                                        } ${!link.url ? 'pointer-events-none opacity-50' : ''}`}
                                    preserveScroll
                                    preserveState
                                >
                                    <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <AlertModal
                isOpen={alertConfig.isOpen}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
                onClose={() => setAlertConfig((prev) => ({ ...prev, isOpen: false }))}
            />
        </Layout>
    );
}
