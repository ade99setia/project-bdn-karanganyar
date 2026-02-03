import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import type { AppLayoutProps } from '@/types';
import ThemeToggle from "@/components/ui/toggle-theme";

export default ({ children, breadcrumbs, ...props }: AppLayoutProps) => (
    <AppLayoutTemplate breadcrumbs={breadcrumbs} {...props}>
        {children}

        <div className="fixed bottom-4 right-4 z-50">
            <ThemeToggle />
        </div>
    </AppLayoutTemplate>
);
