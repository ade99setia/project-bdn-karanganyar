import { Breadcrumbs } from '@/components/breadcrumbs';
import { OfflineSyncIndicator } from '@/components/offline-sync-indicator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    return (
        <header className="flex h-10 md:h-11 items-center justify-between border-b border-sidebar-border/50 pl-1 pr-2 md:pl-2 md:pr-3">
            <div className="flex items-center gap-1 min-w-0">
                <SidebarTrigger className="shrink-0 -ml-1 scale-90" />
                <div className="truncate text-sm">
                    <Breadcrumbs breadcrumbs={breadcrumbs} />
                </div>
            </div>

            <div className="flex items-center shrink-0 scale-90">
                <OfflineSyncIndicator />
            </div>
        </header>
    );
}
