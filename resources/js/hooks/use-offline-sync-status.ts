import { useEffect, useState } from 'react';
import {
    getOfflineSyncSnapshot,
    OFFLINE_SYNC_EVENT,
} from '@/lib/offline-http';

interface OfflineSyncStatus {
    isOnline: boolean;
    queueCount: number;
    lastSyncedAt: string | null;
    lastFlushFailedAt: string | null;
}

export function useOfflineSyncStatus() {
    const [status, setStatus] = useState<OfflineSyncStatus>(() =>
        getOfflineSyncSnapshot(),
    );

    useEffect(() => {
        const refresh = () => {
            setStatus(getOfflineSyncSnapshot());
        };

        refresh();

        window.addEventListener('online', refresh);
        window.addEventListener('offline', refresh);
        window.addEventListener('storage', refresh);
        window.addEventListener(OFFLINE_SYNC_EVENT, refresh as EventListener);

        return () => {
            window.removeEventListener('online', refresh);
            window.removeEventListener('offline', refresh);
            window.removeEventListener('storage', refresh);
            window.removeEventListener(
                OFFLINE_SYNC_EVENT,
                refresh as EventListener,
            );
        };
    }, []);

    return status;
}
