import { Capacitor } from '@capacitor/core';
import { Head, Link } from '@inertiajs/react';
import { Bell, CheckCheck, Clock3, BellRing, Inbox } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
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

// Priority badge menggunakan nuansa yang lebih aman untuk mobile
const priorityClassMap: Record<NotificationItem['priority'], string> = {
    low: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
    normal: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
    high: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400',
};

type AlertConfigType = {
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
};

type ReadFilter = 'unread' | 'read';
const READ_FILTER_STORAGE_KEY = 'notifications.readFilter';

export default function SalesNotifications({ notifications, unreadCount }: Props) {
    const Layout = Capacitor.isNativePlatform() ? AppLayoutMobile : AppLayout;

    const [alertConfig, setAlertConfig] = useState<AlertConfigType>({
        isOpen: false, title: '', message: '', type: 'info',
    });

    const showAlert = (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info') => {
        setAlertConfig({ isOpen: true, title, message, type });
    };

    const { enablePush, disablePush, checkPushStatus } = usePushNotifications({ setupListeners: false });

    const [isPushEnabled, setIsPushEnabled] = useState(false);
    const [isCheckingPushStatus, setIsCheckingPushStatus] = useState(Capacitor.isNativePlatform());
    const [isTogglingPush, setIsTogglingPush] = useState(false);
    const [readFilter, setReadFilter] = useState<ReadFilter>(() => {
        if (typeof window === 'undefined') return 'unread';
        return window.localStorage.getItem(READ_FILTER_STORAGE_KEY) === 'read' ? 'read' : 'unread';
    });

    const unreadNotifications = useMemo(() => notifications.data.filter((n) => n.status === 'unread'), [notifications.data]);
    const readNotifications = useMemo(() => notifications.data.filter((n) => n.status !== 'unread'), [notifications.data]);
    const filteredNotifications = readFilter === 'unread' ? unreadNotifications : readNotifications;

    useEffect(() => {
        window.localStorage.setItem(READ_FILTER_STORAGE_KEY, readFilter);
    }, [readFilter]);

    useEffect(() => {
        if (!Capacitor.isNativePlatform()) return;
        let isMounted = true;
        const loadPushStatus = async () => {
            const enabled = await checkPushStatus();
            if (isMounted) {
                setIsPushEnabled(enabled);
                setIsCheckingPushStatus(false);
            }
        };
        loadPushStatus();
        return () => { isMounted = false; };
    }, [checkPushStatus]);

    const handleTogglePushNotifications = async () => {
        if (!Capacitor.isNativePlatform()) {
            showAlert('Perhatian', 'Push notification hanya tersedia di aplikasi mobile native.', 'warning');
            return;
        }

        if (isTogglingPush) return;
        setIsTogglingPush(true);

        if (isPushEnabled) {
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

        const result = await enablePush();
        if (result.success) {
            setIsPushEnabled(true);
            showAlert('Berhasil', result.message, 'success');
        } else {
            showAlert('Gagal', result.message, 'error');
        }
        setIsTogglingPush(false);
    };

    const handleMarkAsRead = (id: number) => PushNotificationService.markAsRead(id);
    const handleMarkAsUnread = (id: number) => PushNotificationService.markAsUnread(id);
    const handleMarkAllAsRead = () => PushNotificationService.markAllAsRead();

    return (
        <Layout breadcrumbs={breadcrumbs}>
            <Head title="Notifikasi" />

            {/* Background slate-50 yang nyaman untuk mata di mobile */}
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24 pt-6 px-4 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-3xl space-y-6">
                    
                    {/* Header Card dengan nuansa Biru */}
                    <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200/50 dark:bg-slate-900 dark:ring-slate-800">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center gap-3.5">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                                    <Bell size={24} />
                                </div>
                                <div>
                                    <h1 className="text-lg font-bold text-slate-900 dark:text-white">Notifikasi</h1>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        Pesan baru: <span className="font-semibold text-orange-500 dark:text-orange-400">{unreadCount}</span>
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                {Capacitor.isNativePlatform() && (
                                    <button
                                        type="button"
                                        onClick={handleTogglePushNotifications}
                                        disabled={isCheckingPushStatus || isTogglingPush}
                                        className={`inline-flex min-h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition-all active:scale-95 disabled:opacity-50 ${
                                            isPushEnabled
                                                ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                                : 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                                        }`}
                                    >
                                        <BellRing size={16} />
                                        <span className="hidden sm:inline">
                                            {isCheckingPushStatus ? 'Memuat...' : isTogglingPush ? 'Memproses...' : (isPushEnabled ? 'Matikan Push' : 'Aktifkan Push')}
                                        </span>
                                    </button>
                                )}

                                <button
                                    type="button"
                                    onClick={handleMarkAllAsRead}
                                    disabled={unreadCount === 0}
                                    className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-blue-50 px-4 text-sm font-semibold text-blue-700 transition-all active:scale-95 disabled:opacity-50 disabled:bg-slate-100 disabled:text-slate-400 dark:bg-blue-500/10 dark:text-blue-400 dark:disabled:bg-slate-800 dark:disabled:text-slate-500"
                                >
                                    <CheckCheck size={16} />
                                    <span className="hidden sm:inline">Tandai Semua Dibaca</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {/* Segmented Control Android Style (Menggunakan Biru & Oranye) */}
                        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-200/60 p-1.5 dark:bg-slate-800/60">
                            <button
                                type="button"
                                onClick={() => setReadFilter('unread')}
                                className={`flex min-h-11 items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all active:scale-95 ${
                                    readFilter === 'unread'
                                        ? 'bg-white text-orange-600 shadow-sm dark:bg-slate-900 dark:text-orange-500'
                                        : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                                }`}
                            >
                                Belum Dibaca 
                                <span className={`flex h-5 w-5 items-center justify-center rounded-md text-[11px] ${
                                    readFilter === 'unread' ? 'bg-orange-100 text-orange-700 dark:bg-orange-500/20' : 'bg-slate-200 text-slate-600 dark:bg-slate-700'
                                }`}>
                                    {unreadNotifications.length}
                                </span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setReadFilter('read')}
                                className={`flex min-h-11 items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all active:scale-95 ${
                                    readFilter === 'read'
                                        ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-900 dark:text-blue-500'
                                        : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                                }`}
                            >
                                Sudah Dibaca
                            </button>
                        </div>

                        {/* Empty State */}
                        {filteredNotifications.length === 0 && (
                            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-transparent py-16 text-center dark:border-slate-700">
                                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                                    <Inbox size={24} className="text-slate-400" />
                                </div>
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                    {readFilter === 'unread' ? 'Hore! Tidak ada notifikasi baru.' : 'Belum ada riwayat notifikasi.'}
                                </p>
                            </div>
                        )}

                        {/* Cards Notifikasi Mobile Style */}
                        <div className="grid gap-3">
                            {filteredNotifications.map((notification) => {
                                const isUnread = notification.status === 'unread';
                                const hasActionLink = !!notification.action_url && !isReadEndpointUrl(notification.action_url);

                                return (
                                    <div
                                        key={notification.id}
                                        className={`group relative overflow-hidden rounded-2xl border p-4 shadow-sm transition-all active:scale-[0.99] sm:p-5 ${
                                            isUnread
                                                ? 'border-orange-100 bg-white dark:border-orange-900/30 dark:bg-slate-900'
                                                : 'border-slate-100 bg-slate-50/50 dark:border-slate-800/80 dark:bg-slate-900/40'
                                        }`}
                                    >
                                        {/* Aksen garis kiri tipis warna oranye untuk unread (Gaya Android Material) */}
                                        {isUnread && (
                                            <div className="absolute left-0 top-0 h-full w-1.5 bg-orange-500"></div>
                                        )}

                                        <div className="flex flex-col gap-3">
                                            {/* Header Card */}
                                            <div className="flex flex-wrap items-start justify-between gap-2">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h2 className={`text-base font-bold ${isUnread ? 'text-slate-900 dark:text-slate-100' : 'text-slate-700 dark:text-slate-300'}`}>
                                                        {notification.title}
                                                    </h2>
                                                    
                                                    {notification.priority !== 'normal' && (
                                                        <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${priorityClassMap[notification.priority]}`}>
                                                            {notification.priority}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                                    <Clock3 size={12} />
                                                    {formatDateTime(notification.created_at)}
                                                </div>
                                            </div>

                                            {/* Body Card */}
                                            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                                                {notification.message}
                                            </p>

                                            {/* Footer Card (Actions) */}
                                            <div className="mt-1 flex flex-wrap items-center gap-2">
                                                {hasActionLink && (
                                                    <Link
                                                        href={`/notifications/${notification.id}/read`}
                                                        className="inline-flex min-h-9 items-center justify-center rounded-xl bg-blue-50 px-4 py-1.5 text-xs font-semibold text-blue-700 transition-colors active:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400"
                                                    >
                                                        Buka Detail
                                                    </Link>
                                                )}

                                                {isUnread ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleMarkAsRead(notification.id)}
                                                        className="inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-orange-50 px-4 py-1.5 text-xs font-semibold text-orange-600 transition-colors active:bg-orange-100 dark:bg-orange-500/10 dark:text-orange-400"
                                                    >
                                                        <CheckCheck size={14} />
                                                        Tandai Dibaca
                                                    </button>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleMarkAsUnread(notification.id)}
                                                        className="inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-transparent px-2 py-1.5 text-xs font-semibold text-slate-400 transition-colors active:bg-slate-200 dark:text-slate-500"
                                                    >
                                                        <BellRing size={14} />
                                                        Tandai Belum Dibaca
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Pagination - Touch Friendly */}
                    {notifications.links.length > 3 && (
                        <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
                            {notifications.links.map((link, index) => {
                                const isTextLabel = link.label.includes('&laquo;') || link.label.includes('&raquo;');
                                return (
                                    <Link
                                        key={`${link.label}-${index}`}
                                        href={link.url ?? '#'}
                                        className={`flex min-h-10 min-w-10 items-center justify-center rounded-xl px-3 text-sm font-semibold transition-all active:scale-95 ${
                                            link.active
                                                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                                                : 'bg-white text-slate-600 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:ring-slate-800'
                                        } ${!link.url ? 'pointer-events-none opacity-50' : ''}`}
                                        preserveScroll
                                        preserveState
                                    >
                                        <span dangerouslySetInnerHTML={{ __html: isTextLabel ? (link.label.includes('&laquo;') ? '‹' : '›') : link.label }} />
                                    </Link>
                                );
                            })}
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