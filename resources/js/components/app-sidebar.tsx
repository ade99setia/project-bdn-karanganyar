import { Capacitor } from '@capacitor/core';
import { Link, usePage } from '@inertiajs/react';
import { PhoneCall, LayoutGrid, MonitorCheck } from 'lucide-react';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
// import { dashboard } from '@/routes';
import type { NavItem, SharedData } from '@/types';
import AppLogo from './app-logo';

const footerNavItems: NavItem[] = [
    {
        title: 'Hubungi Kami',
        href: 'https://wa.me/6285600190898?text=Halo%20Admin%20BDN%20Karanganyar%2C%20saya%20ingin%20bertanya%20tentang%20aplikasi.',
        icon: PhoneCall,
    },
];

export function AppSidebar() {
    const { auth } = usePage<SharedData>().props;

    const isNativeApp = Capacitor.isNativePlatform();
    const safeAreaStyle = isNativeApp ? { paddingTop: 'env(safe-area-inset-top, 0px)' } : undefined;


    const mainNavItems: NavItem[] = [
        {
            title: 'Dashboard',
            href: `/${auth.user.role}/dashboard`,
            icon: LayoutGrid,
        },
        {
            title: 'Monitoring Teams',
            href: `/${auth.user.role}/monitoring-team`,
            icon: MonitorCheck,
        },
    ];

    return (
        <Sidebar collapsible="icon" variant="inset" style={safeAreaStyle}>
            <SidebarHeader style={safeAreaStyle}>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={`/${auth.user.role}/dashboard`} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
