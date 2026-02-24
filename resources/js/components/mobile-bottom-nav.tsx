import { usePage, Link } from '@inertiajs/react';
import { Home, MonitorCheck, SquareArrowRight, User, Headset } from 'lucide-react';
import type { JSX } from 'react';
import { useMemo } from 'react';

interface BottomNavItem {
    label: string;
    icon: (isActive: boolean) => JSX.Element;
    href: string;
    activePaths: string[];
}

export default function MobileBottomNav() {
    const { props } = usePage<{ auth?: { user?: { id?: string | number } }; unreadNotificationCount?: number }>();
    const userId = props.auth?.user?.id;
    const unreadCount = Number(props.unreadNotificationCount ?? 0);
    const pathname = typeof window !== 'undefined' ? window.location.pathname : '';

    const menuItems = useMemo<BottomNavItem[]>(() => [
        {
            label: 'Home',
            href: '/sales/dashboard',
            activePaths: ['/sales/dashboard'],
            icon: (active) => <Home size={24} strokeWidth={active ? 2.5 : 2} />,
        },
        {
            label: 'Performa',
            href: userId ? `/sales/monitoring-record/${userId}` : '/sales/dashboard',
            activePaths: userId ? [`/sales/monitoring-record/${userId}`] : ['/sales/dashboard'],
            icon: (active) => <MonitorCheck size={24} strokeWidth={active ? 2.5 : 2} />,
        },
        {
            label: 'Report',
            href: '/sales/dashboard#add-visit',
            activePaths: ['/sales/dashboard#add-visit'],
            icon: () => <SquareArrowRight size={28} strokeWidth={2.5} />,
        },
        {
            label: 'Notification',
            href: '/notifications',
            activePaths: ['/notifications'],
            icon: (active) => <Headset size={24} strokeWidth={active ? 2.5 : 2} />,
        },
        {
            label: 'Profile',
            href: '/settings/profile',
            activePaths: ['/settings/profile'],
            icon: (active) => <User size={24} strokeWidth={active ? 2.5 : 2} />,
        },
    ], [userId]);

    return (
        <div className="fixed inset-x-0 bottom-0 z-40 bg-white/80 backdrop-blur-lg border-t border-gray-100 dark:bg-blue-950/90 dark:border-blue-900 pb-[calc(env(safe-area-inset-bottom,0px)+8px)] shadow-[0_-8px_30px_rgb(0,0,0,0.04)]">
            <div className="mx-auto max-w-xl px-4">
                <div className="grid grid-cols-5 items-center justify-center">
                    {menuItems.map((item, index) => {
                        const isCenter = index === 2;
                        // Penyesuaian logika active agar lebih akurat
                        const isActive = item.activePaths.some((path) => pathname === path);

                        if (isCenter) {
                            return (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    className="relative flex flex-col items-center justify-center -mt-8"
                                >
                                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-500/40 border-[6px] border-white dark:border-blue-950 transition-transform hover:scale-110 active:scale-95">
                                        {item.icon(true)}
                                    </div>
                                    <span className="mt-1 text-[11px] font-bold text-blue-600 dark:text-blue-300">
                                        {item.label}
                                    </span>
                                </Link>
                            );
                        }

                        return (
                            <Link
                                key={item.label}
                                href={item.href}
                                className="relative flex flex-col items-center justify-center pt-3 pb-1 transition-all duration-300"
                            >
                                {/* Indicator line top */}
                                {isActive && (
                                    <div className="absolute top-0 h-1 w-8 rounded-b-full bg-orange-500 animate-pulse" />
                                )}

                                <div className={`
                                    flex items-center justify-center p-2 rounded-2xl transition-all duration-300 relative
                                    ${isActive 
                                        ? 'bg-orange-50 text-orange-600 scale-110 dark:bg-orange-900/40 dark:text-orange-400' 
                                        : 'text-gray-400 dark:text-blue-400/60'}
                                `}>
                                    {item.icon(isActive)}
                                    
                                    {/* Badge notifikasi belum dibaca */}
                                    {item.label === 'Notification' && unreadCount > 0 && (
                                        <div className="absolute -top-1 -right-1 flex items-center justify-center min-w-4.5 h-4.5 px-1 bg-orange-500 text-white text-[10px] font-bold rounded-full border-2 border-white dark:border-blue-950 shadow-lg animate-pulse">
                                            {unreadCount > 99 ? '99+' : unreadCount}
                                        </div>
                                    )}
                                </div>
                                
                                <span className={`
                                    text-[10px] mt-0.5 transition-colors duration-300
                                    ${isActive 
                                        ? 'font-bold text-orange-600 dark:text-orange-400' 
                                        : 'font-medium text-gray-400 dark:text-blue-400/60'}
                                `}>
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}