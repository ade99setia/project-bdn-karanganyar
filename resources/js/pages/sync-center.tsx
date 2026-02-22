import { Capacitor } from '@capacitor/core';
import { Head } from '@inertiajs/react';
import { CheckCircle2, Clock3, RefreshCw, Trash2, Wifi, WifiOff, Eraser } from 'lucide-react';
import { useMemo, useState } from 'react';
import AlertModal from '@/components/modal/alert-modal';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useOfflineSyncStatus } from '@/hooks/use-offline-sync-status';
import AppLayout from '@/layouts/app-layout';
import {
    clearOfflineQueue,
    flushOfflineQueue,
    getOfflineQueuedRequests,
    removeOfflineQueuedRequest,
    retryOfflineQueuedRequest,
    type QueuedRequest,
} from '@/lib/offline-http';
import type { BreadcrumbItem } from '@/types';

interface Props {
    role: string;
}

export default function SyncCenter({ role }: Props) {
    const isNativeApp = Capacitor.isNativePlatform();
    const [loadingSync, setLoadingSync] = useState(false);
    const [loadingClear, setLoadingClear] = useState(false);
    const [isResetting, setIsResetting] = useState(false);
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const [lastActionText, setLastActionText] = useState('');
    const [methodFilter, setMethodFilter] = useState<'all' | 'post' | 'put' | 'patch' | 'delete'>('all');
    const [endpointKeyword, setEndpointKeyword] = useState('');
    const [retryingItemId, setRetryingItemId] = useState<string | null>(null);

    const syncStatus = useOfflineSyncStatus();

    const queuedRequests = useMemo<QueuedRequest[]>(
        () => getOfflineQueuedRequests(),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [syncStatus.queueCount, syncStatus.lastSyncedAt, syncStatus.lastFlushFailedAt, syncStatus.isOnline],
    );

    const filteredQueuedRequests = useMemo(() => {
        const keyword = endpointKeyword.trim().toLowerCase();

        return queuedRequests.filter((item) => {
            const methodMatch = methodFilter === 'all' || item.method === methodFilter;
            const endpointMatch = keyword.length === 0 || item.url.toLowerCase().includes(keyword);

            return methodMatch && endpointMatch;
        });
    }, [endpointKeyword, methodFilter, queuedRequests]);

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Sync Center',
            href: `/${role}/sync-center`,
        },
    ];

    const handleSyncNow = async () => {
        setLoadingSync(true);
        setLastActionText('Menyinkronkan antrean...');

        try {
            await flushOfflineQueue();
            const remaining = getOfflineQueuedRequests().length;
            setLastActionText(
                remaining === 0
                    ? 'Sinkronisasi berhasil, antrean kosong.'
                    : `Sebagian data belum terkirim. Sisa antrean: ${remaining}.`,
            );
        } finally {
            setLoadingSync(false);
        }
    };

    const handleClearQueue = () => {
        setLoadingClear(true);
        clearOfflineQueue();
        setLastActionText('Antrean offline dihapus.');
        setLoadingClear(false);
    };

    const handleRemoveOne = (id: string) => {
        removeOfflineQueuedRequest(id);
        setLastActionText('Satu item antrean berhasil dihapus.');
    };

    const handleRetryOne = async (id: string) => {
        if (!syncStatus.isOnline || retryingItemId) {
            return;
        }

        setRetryingItemId(id);

        try {
            const success = await retryOfflineQueuedRequest(id);
            setLastActionText(
                success
                    ? 'Item antrean berhasil dikirim ulang.'
                    : 'Retry gagal. Item tetap di antrean.',
            );
        } finally {
            setRetryingItemId(null);
        }
    };

    async function clearLocalAppData() {
        localStorage.clear();
        sessionStorage.clear();

        document.cookie.split(';').forEach((cookieChunk) => {
            const key = cookieChunk.split('=')[0]?.trim();
            if (!key) {
                return;
            }

            document.cookie = `${key}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
        });

        if ('caches' in window) {
            const cacheKeys = await caches.keys();
            await Promise.all(cacheKeys.map((cacheKey) => caches.delete(cacheKey)));
        }

        if ('serviceWorker' in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations();
            await Promise.all(registrations.map((registration) => registration.unregister()));
        }

        if ('indexedDB' in window) {
            const idbWithDatabases = window.indexedDB as IDBFactory & {
                databases?: () => Promise<Array<{ name?: string }>>;
            };

            if (typeof idbWithDatabases.databases === 'function') {
                const databases = await idbWithDatabases.databases();

                await Promise.all(
                    (databases || []).map((database) => {
                        if (!database?.name) {
                            return Promise.resolve();
                        }

                        return new Promise<void>((resolve) => {
                            const request = window.indexedDB.deleteDatabase(database.name!);
                            request.onsuccess = () => resolve();
                            request.onerror = () => resolve();
                            request.onblocked = () => resolve();
                        });
                    }),
                );
            }
        }
    }

    async function resetApplicationData() {
        if (isResetting) {
            return;
        }

        setIsResetting(true);
        setShowClearConfirm(false);

        try {
            await clearLocalAppData();
            window.location.replace('/offline.html?after_clear=1');
        } catch {
            window.location.replace('/offline.html?after_clear=1&status=partial');
        }
    }

    function requestClearApplicationData() {
        if (isResetting) {
            return;
        }

        setShowClearConfirm(true);
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Sync Center" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Card className="rounded-xl border border-sidebar-border/70 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-1">
                            <h2 className="text-base font-semibold">Status Sinkronisasi</h2>
                            <p className="text-sm text-muted-foreground">
                                Pantau data yang masih antre saat offline dan kirim ulang secara manual.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-xs">
                            {!syncStatus.isOnline ? (
                                <span className="inline-flex items-center gap-1 rounded-md border border-red-500/50 px-2 py-1 text-red-500">
                                    <WifiOff className="size-3.5" /> Offline
                                </span>
                            ) : syncStatus.queueCount > 0 ? (
                                <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/50 px-2 py-1 text-amber-500">
                                    <Clock3 className="size-3.5" /> Queued ({syncStatus.queueCount})
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/50 px-2 py-1 text-emerald-600 dark:text-emerald-400">
                                    <CheckCircle2 className="size-3.5" /> Synced
                                </span>
                            )}

                            {syncStatus.isOnline && (
                                <span className="inline-flex items-center gap-1 rounded-md border border-sidebar-border px-2 py-1 text-muted-foreground">
                                    <Wifi className="size-3.5" /> Online
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                        <Button
                            onClick={handleSyncNow}
                            disabled={!syncStatus.isOnline || loadingSync}
                            className="gap-2"
                        >
                            <RefreshCw className={`size-4 ${loadingSync ? 'animate-spin' : ''}`} />
                            Sync Sekarang
                        </Button>

                        <Button
                            variant="outline"
                            onClick={handleClearQueue}
                            disabled={queuedRequests.length === 0 || loadingClear}
                            className="gap-2"
                        >
                            <Trash2 className="size-4" />
                            Hapus Antrean
                        </Button>

                        {isNativeApp && (
                            <Button
                                variant="destructive"
                                onClick={requestClearApplicationData}
                                disabled={isResetting}
                                className="gap-2"
                            >
                                <Eraser className="size-4" />
                                {isResetting ? 'Membersihkan...' : 'Clear App'}
                            </Button>
                        )}
                    </div>

                    {lastActionText && (
                        <p className="mt-3 text-xs text-muted-foreground">{lastActionText}</p>
                    )}
                </Card>

                <Card className="rounded-xl border border-sidebar-border/70 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <h3 className="text-sm font-semibold">Daftar Antrean ({queuedRequests.length})</h3>
                        <div className="flex flex-wrap gap-2">
                            <select
                                value={methodFilter}
                                onChange={(event) =>
                                    setMethodFilter(
                                        event.target.value as
                                            | 'all'
                                            | 'post'
                                            | 'put'
                                            | 'patch'
                                            | 'delete',
                                    )
                                }
                                className="h-9 rounded-md border border-sidebar-border bg-background px-3 text-xs"
                            >
                                <option value="all">Semua Metode</option>
                                <option value="post">POST</option>
                                <option value="put">PUT</option>
                                <option value="patch">PATCH</option>
                                <option value="delete">DELETE</option>
                            </select>

                            <input
                                type="text"
                                value={endpointKeyword}
                                onChange={(event) => setEndpointKeyword(event.target.value)}
                                placeholder="Filter endpoint..."
                                className="h-9 min-w-44 rounded-md border border-sidebar-border bg-background px-3 text-xs"
                            />
                        </div>
                    </div>

                    {filteredQueuedRequests.length === 0 ? (
                        <p className="mt-3 text-sm text-muted-foreground">
                            Tidak ada item antrean yang sesuai filter.
                        </p>
                    ) : (
                        <div className="mt-3 space-y-2">
                            {filteredQueuedRequests.map((item) => (
                                <div
                                    key={item.id}
                                    className="rounded-lg border border-sidebar-border/70 p-3"
                                >
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                            {item.method}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {new Date(item.createdAt).toLocaleString('id-ID')}
                                        </p>
                                    </div>
                                    <div className="mt-1 flex items-start justify-between gap-2">
                                        <p className="break-all text-sm">{item.url}</p>
                                        <div className="flex gap-1">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleRetryOne(item.id)}
                                                disabled={!syncStatus.isOnline || retryingItemId !== null}
                                                className="gap-1"
                                            >
                                                <RefreshCw
                                                    className={`size-3.5 ${retryingItemId === item.id ? 'animate-spin' : ''}`}
                                                />
                                                Retry
                                            </Button>

                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleRemoveOne(item.id)}
                                                disabled={retryingItemId === item.id}
                                                className="gap-1"
                                            >
                                                <Trash2 className="size-3.5" />
                                                Hapus
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            </div>

            <AlertModal
                isOpen={showClearConfirm}
                onClose={() => setShowClearConfirm(false)}
                title="Konfirmasi Clear App"
                message="Data lokal, cache, dan sesi aplikasi akan dihapus. Aplikasi akan kembali ke halaman offline."
                type="warning"
                primaryButtonText={isResetting ? 'Membersihkan...' : 'Ya, Clear App'}
                onPrimaryClick={resetApplicationData}
                secondaryButtonText="Batal"
                onSecondaryClick={() => setShowClearConfirm(false)}
            />
        </AppLayout>
    );
}
