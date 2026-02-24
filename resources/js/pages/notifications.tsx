import { Capacitor } from '@capacitor/core';
import { Head, Link } from '@inertiajs/react';
import { Bell, Send, CheckCheck, Clock3, BellRing } from 'lucide-react';
import { useEffect, useState } from 'react';
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
        href: '/notifications',
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

const isReadEndpointUrl = (url: string | null) => {
    if (!url) return false;

    return /^\/notifications\/\d+\/read$/.test(url);
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

    // Toggle push dari halaman ini, listener global dipasang di AppLayoutMobile
    const { enablePush, disablePush, checkPushStatus } = usePushNotifications({
        setupListeners: false,
    });

    const [isPushEnabled, setIsPushEnabled] = useState(false);
    const [isCheckingPushStatus, setIsCheckingPushStatus] = useState(Capacitor.isNativePlatform());
    const [isTogglingPush, setIsTogglingPush] = useState(false);

    useEffect(() => {
        if (!Capacitor.isNativePlatform()) {
            return;
        }

        let isMounted = true;

        const loadPushStatus = async () => {
            const enabled = await checkPushStatus();
            if (isMounted) {
                setIsPushEnabled(enabled);
                setIsCheckingPushStatus(false);
            }
        };

        loadPushStatus();

        return () => {
            isMounted = false;
        };
    }, [checkPushStatus]);

    const handleTogglePushNotifications = async () => {
        if (!Capacitor.isNativePlatform()) {
            showAlert('Perhatian', 'Push notification hanya tersedia di aplikasi mobile native.', 'warning');
            return;
        }

        if (isTogglingPush) {
            return;
        }

        setIsTogglingPush(true);

        if (isPushEnabled) {
            showAlert('Proses', 'Sedang menonaktifkan push notification... Tunggu sebentar.', 'info');

            const result = await disablePush();

            if (result.success) {
                setIsPushEnabled(false);
                showAlert('Berhasil', result.message, 'success');
            } else {
                showAlert('Gagal', result.message, 'error');
            }

            setIsTogglingPush(false);
            return;
        }

        showAlert('Proses', 'Sedang mendaftar push notification... Tunggu sebentar.', 'info');

        const result = await enablePush();

        if (result.success) {
            setIsPushEnabled(true);
            showAlert('Berhasil', result.message, 'success');
        } else {
            showAlert('Gagal', result.message, 'error');
        }

        setIsTogglingPush(false);
    };

    const handleMarkAsRead = (id: number) => {
        PushNotificationService.markAsRead(id);
    };

    const handleMarkAsUnread = (id: number) => {
        PushNotificationService.markAsUnread(id);
    };

    const handleMarkAllAsRead = () => {
        PushNotificationService.markAllAsRead();
    };

    const handleSendTestPush = (scope: 'self' | 'all_users' = 'self') => {
        PushNotificationService.sendTest({
            scope,
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
                                        onClick={handleTogglePushNotifications}
                                        disabled={isCheckingPushStatus || isTogglingPush}
                                        className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-70 ${isPushEnabled
                                            ? 'bg-slate-700 hover:bg-slate-800'
                                            : 'bg-purple-600 hover:bg-purple-700'
                                            }`}
                                    >
                                        <BellRing size={16} />
                                        {isCheckingPushStatus
                                            ? 'Memuat Status...'
                                            : isTogglingPush
                                                ? (isPushEnabled ? 'Menonaktifkan...' : 'Mengaktifkan...')
                                                : (isPushEnabled ? 'Nonaktifkan Push' : 'Aktifkan Push')}
                                    </button>
                                )}

                                <button
                                    type="button"
                                    onClick={() => handleSendTestPush('self')}
                                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                                >
                                    <Send size={16} />
                                    Tes Push Saya
                                </button>

                                {/* {isAdmin && ( */}
                                    <button
                                        type="button"
                                        onClick={() => handleSendTestPush('all_users')}
                                        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
                                    >
                                        <Send size={16} />
                                        Tes Push Semua User
                                    </button>
                                {/* )} */}

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
                            const hasActionLink = !!notification.action_url && !isReadEndpointUrl(notification.action_url);

                            return (
                                <div
                                    key={notification.id}
                                    className={`group rounded-2xl border p-4 transition ${isUnread
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
                                            {hasActionLink && (
                                                <Link
                                                    href={notification.action_url as string}
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
                                                <div className="flex items-center gap-2">
                                                    <span className="hidden text-xs font-semibold text-emerald-600 transition md:inline md:group-hover:hidden dark:text-emerald-400">
                                                        Sudah dibaca
                                                    </span>

                                                    <button
                                                        type="button"
                                                        onClick={() => handleMarkAsUnread(notification.id)}
                                                        className="inline-flex items-center gap-1 rounded-lg bg-slate-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800 md:hidden md:group-hover:inline-flex dark:bg-slate-600 dark:hover:bg-slate-500"
                                                    >
                                                        <Bell size={14} />
                                                        Tandai Belum Dibaca
                                                    </button>
                                                </div>
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
