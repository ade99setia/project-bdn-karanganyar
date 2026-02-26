import { Head } from '@inertiajs/react';
import {
    Users,
    Store,
    Package,
    ClipboardCheck,
    TrendingUp,
    ShieldAlert,
    MapPinned,
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import CollectionStatus, { type BreakdownItem } from '../../components/dashboard/CollectionStatus';
import ProgressTable, { type ProgressRow } from '../../components/dashboard/ProgressTable';

interface DashboardStats {
    total_sales: number;
    total_products: number;
    total_customers: number;
    customers_visited_by_team: number;
    visits_today: number;
    visits_this_month: number;
    attendance_present_today: number;
    fake_gps_today: number;
    target_visit_today: number;
    target_visit_month: number;
    visit_completion_today: number;
    visit_completion_month: number;
}

interface RecentVisit {
    id: number;
    sales_name: string | null;
    customer_name: string | null;
    activity_type: string | null;
    visited_at: string | null;
    is_fake_gps: boolean;
}

interface DashboardProps {
    stats: DashboardStats;
    activityBreakdown: BreakdownItem[];
    productActionBreakdown: BreakdownItem[];
    progressPerSales: ProgressRow[];
    recentVisits: RecentVisit[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/supervisor/dashboard',
    },
];

export default function Dashboard({
    stats,
    activityBreakdown,
    productActionBreakdown,
    progressPerSales,
    recentVisits,
}: DashboardProps) {
    const statCards = [
        {
            icon: Users,
            value: stats.total_sales,
            label: 'Total Sales Tim',
            color: 'text-blue-600',
        },
        {
            icon: Store,
            value: stats.customers_visited_by_team,
            label: 'Customer Disentuh Tim',
            color: 'text-purple-600',
        },
        {
            icon: Package,
            value: stats.total_products,
            label: 'Produk Aktif',
            color: 'text-amber-600',
        },
        {
            icon: ClipboardCheck,
            value: stats.attendance_present_today,
            label: 'Presensi Hari Ini',
            color: 'text-emerald-600',
        },
        {
            icon: MapPinned,
            value: stats.visits_today,
            label: 'Visit Hari Ini',
            color: 'text-cyan-600',
        },
        {
            icon: TrendingUp,
            value: `${stats.visit_completion_today.toFixed(2)}%`,
            label: 'Pencapaian Target Harian',
            color: 'text-green-600',
        },
        {
            icon: TrendingUp,
            value: `${stats.visit_completion_month.toFixed(2)}%`,
            label: 'Pencapaian Target Bulanan',
            color: 'text-orange-600',
        },
        {
            icon: ShieldAlert,
            value: stats.fake_gps_today,
            label: 'Fake GPS Hari Ini',
            color: 'text-rose-600',
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex flex-col gap-6 p-6">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {statCards.map((item, index) => (
                        <div
                            key={index}
                            className="flex items-center gap-4 rounded-lg border bg-white p-4 shadow-sm transition-transform hover:scale-[1.02] dark:border-gray-700 dark:bg-gray-800"
                        >
                            <item.icon className={`h-8 w-8 ${item.color}`} />
                            <div>
                                <div className="text-xl font-semibold text-gray-800 dark:text-gray-200">{item.value}</div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">{item.label}</div>
                            </div>
                        </div>
                    ))}
                </div>

                <CollectionStatus
                    stats={stats}
                    activityBreakdown={activityBreakdown}
                    productActionBreakdown={productActionBreakdown}
                />

                <ProgressTable title="PROGRESS TIM SALES" rows={progressPerSales} />

                <div className="rounded-xl border bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <h2 className="mb-4 text-base font-semibold text-gray-800 dark:text-gray-200">Visit Terbaru Tim (Bulan Ini)</h2>
                    {recentVisits.length === 0 ? (
                        <div className="rounded-lg border border-dashed p-6 text-center text-sm text-gray-500 dark:border-gray-600 dark:text-gray-400">
                            Belum ada data visit tim pada periode ini.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {recentVisits.map((visit) => (
                                <div
                                    key={visit.id}
                                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-900/40"
                                >
                                    <div className="space-y-1">
                                        <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                            {visit.sales_name ?? '-'} → {visit.customer_name ?? 'Customer tidak diketahui'}
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                            Aktivitas: {(visit.activity_type ?? 'unknown').replaceAll('_', ' ')}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs">
                                        <span className="rounded-full bg-blue-100 px-2.5 py-1 font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                            {visit.visited_at ? new Date(visit.visited_at).toLocaleString('id-ID') : '-'}
                                        </span>
                                        <span
                                            className={`rounded-full px-2.5 py-1 font-medium ${visit.is_fake_gps
                                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300'
                                                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                                                }`}
                                        >
                                            {visit.is_fake_gps ? 'Fake GPS' : 'Valid'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}