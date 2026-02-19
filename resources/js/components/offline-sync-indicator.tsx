import { CheckCircle2, Clock3, Wifi, WifiOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useOfflineSyncStatus } from '@/hooks/use-offline-sync-status';

export function OfflineSyncIndicator() {
    const { isOnline, queueCount, lastSyncedAt } = useOfflineSyncStatus();

    if (!isOnline) {
        return (
            <Badge variant="destructive" className="gap-1.5">
                <WifiOff className="size-3.5" />
                Offline
            </Badge>
        );
    }

    if (queueCount > 0) {
        return (
            <Badge variant="secondary" className="gap-1.5">
                <Clock3 className="size-3.5" />
                Queued ({queueCount})
            </Badge>
        );
    }

    return (
        <Badge variant="outline" className="gap-1.5">
            {lastSyncedAt ? (
                <>
                    <CheckCircle2 className="size-3.5" />
                    Synced
                </>
            ) : (
                <>
                    <Wifi className="size-3.5" />
                    Online
                </>
            )}
        </Badge>
    );
}
