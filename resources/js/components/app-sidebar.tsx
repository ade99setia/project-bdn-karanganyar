import { Capacitor } from '@capacitor/core';
import { Link, usePage } from '@inertiajs/react';
import { PhoneCall, LayoutGrid, MonitorCheck, RefreshCcwDot, Headset, LibraryBig, CalendarDays, Warehouse, Package, Users } from 'lucide-react';
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

export function AppSidebar() {
    const { auth } = usePage<SharedData>().props;

    const isNativeApp = Capacitor.isNativePlatform();
    const safeAreaStyle = isNativeApp ? { paddingTop: 'env(safe-area-inset-top, 0px)' } : undefined;

    // ===============================
    // MENU CONFIG PER ROLE
    // ===============================
    const roleMenus: Record<
        string,
        (role: string, userId: number | string) => NavItem[]
    > = {
        default: (role) => [
            {
                title: 'Dashboard',
                href: `/${role}/dashboard`,
                icon: LayoutGrid,
            },
        ],

        sales: (role, userId) => [
            {
                title: 'Monitoring Performa',
                href: `/${role}/monitoring-record/${userId}`,
                icon: MonitorCheck,
            },
        ],

        supervisor: (role) => [
            {
                title: 'Monitoring Teams',
                href: `/${role}/monitoring-team`,
                icon: MonitorCheck,
            },
        ],

        stockist: (role, userId) => [
            {
                title: 'Monitoring Performa',
                href: `/${role}/monitoring-record/${userId}`,
                icon: MonitorCheck,
            },
        ],
    };

    // ===============================
    // GLOBAL MENU (SELALU ADA)
    // ===============================
    const globalMenus: NavItem[] = [
        {
            title: 'Notifikasi',
            href: '/notifications',
            icon: Headset,
        },
        {
            title: 'Admin Tools (Dev)',
            href: '#',
            icon: LibraryBig,
            children: [
                {
                    title: 'Users',
                    href: '/settings/users',
                    icon: Users,
                },
                {
                    title: 'Products',
                    href: '/settings/products',
                    icon: Package,
                },
                {
                    title: 'Stockist',
                    href: '/settings/stockist',
                    icon: Warehouse,
                },
                {
                    title: 'Workdays',
                    href: '/settings/workday',
                    icon: CalendarDays,
                },
            ],
        },
    ];

    // ===============================
    // GENERATOR FUNCTION
    // ===============================
    function generateMainNav(auth: SharedData['auth']): NavItem[] {
        const role = auth.user.role as string;
        const userId = auth.user.id;

        const defaultMenu = roleMenus.default(role, userId);
        const specificMenu =
            roleMenus[role as string]?.(role, userId) ?? [];

        return [
            ...defaultMenu,
            ...specificMenu,
            ...globalMenus,
        ];
    }

    // ===============================
    // FINAL RESULT (GANTIKAN YANG LAMA)
    // ===============================
    const mainNavItems: NavItem[] = generateMainNav(auth);


    const footerNavItems: NavItem[] = [
        {
            title: 'Hubungi Kami',
            href: 'https://wa.me/6285600190898?text=Halo%20Admin%20BDN%20Karanganyar%2C%20saya%20ingin%20bertanya%20tentang%20aplikasi.',
            icon: PhoneCall,
        },
        {
            title: 'Sync Center',
            href: `/sync-center`,
            icon: RefreshCcwDot,
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
