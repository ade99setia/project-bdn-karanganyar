import { CheckCircle2, Clock3, Wifi, WifiOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useOfflineSyncStatus } from '@/hooks/use-offline-sync-status';

export function OfflineSyncIndicator() {
    const { isOnline, queueCount, lastSyncedAt } = useOfflineSyncStatus();

    if (!isOnline) {
        return (
            <Badge className="gap-1.5 bg-red-500/10 text-red-600 border border-red-500/20">
                <WifiOff className="size-3.5" />
                OFFLINE
            </Badge>
        );
    }

    if (queueCount > 0) {
        return (
            <Badge className="gap-1.5 bg-amber-500/10 text-amber-600 border border-amber-500/20">
                <Clock3 className="size-3.5" />
                QUEUED ({queueCount})
            </Badge>
        );
    }

    if (lastSyncedAt) {
        return (
            <Badge className="gap-1.5 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                <CheckCircle2 className="size-3.5" />
                SYNCED
            </Badge>
        );
    }

    return (
        <Badge className="gap-1.5 bg-blue-500/10 text-blue-600 border border-blue-500/20">
            <Wifi className="size-3.5" />
            ONLINE
        </Badge>
    );
}