import { Head, router } from '@inertiajs/react';
import {
    Users,
    Store,
    Package,
    ClipboardCheck,
    TrendingUp,
    ShieldAlert,
    MapPinned,
    RefreshCcw,
    Calendar,
    Filter,
} from 'lucide-react';
import { useState } from 'react';
import { DayPicker } from 'react-day-picker';
import ImagePreviewModal from '@/components/modal/image-preview-modal';
import VisitDetailModal from '@/components/modal/visit-detail-modal';
import VisitHistorySection from '@/components/section/visit-history-section';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import CollectionStatus, { type BreakdownItem } from '../../components/dashboard/CollectionStatus';
import ProgressTable, { type ProgressRow } from '../../components/dashboard/ProgressTable';
import 'react-day-picker/dist/style.css';

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
    target_delivery_today: number;
    target_delivery_month: number;
    visit_completion_today: number;
    visit_completion_month: number;
    collection_status_visit: number;
    collection_status_delivery: number;
    collection_target_visit: number;
    collection_target_delivery: number;
    sales_value: number;
    return_value: number;
    net_profit_value: number;
}

interface RecentVisit {
    id: number;
    user: {
        id: number;
        name: string;
        avatar?: string | null;
    };
    sales_name?: string;
    customer_name?: string;
    activity_type: string;
    description?: string;
    address?: string;
    lat?: number;
    lng?: number;
    photos?: Array<{ file_path: string }>;
    products?: Array<{
        id: number;
        name: string;
        sku: string;
        file_path?: string;
        pivot: {
            quantity: number;
            action_type: string;
            price?: number;
            value?: number;
        };
    }>;
    visited_at: string;
    is_fake_gps: boolean;
}

interface Product {
    id: number;
    name: string;
    file_path?: string;
    sku: string;
    category?: string;
}

interface ModalProduct {
    id: number;
    name: string;
    file_path?: string;
    sku: string;
    category?: string;
    pivot: {
        quantity: number;
        action_type: string;
        price?: number;
        value?: number;
    };
}

interface DashboardProps {
    stats: DashboardStats;
    filters: {
        filterType: 'single' | 'range';
        date: string;
        startDate: string;
        endDate: string;
    };
    period: {
        start: string;
        end: string;
        isRange: boolean;
    };
    activityBreakdown: BreakdownItem[];
    productActionBreakdown: BreakdownItem[];
    products: Product[];
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
    filters,
    period,
    activityBreakdown,
    productActionBreakdown,
    products,
    progressPerSales,
    recentVisits,
}: DashboardProps) {
    const [filterType, setFilterType] = useState<'single' | 'range'>(filters.filterType || 'single');
    const [singleDate, setSingleDate] = useState(filters.date);
    const [startDate, setStartDate] = useState(filters.startDate);
    const [endDate, setEndDate] = useState(filters.endDate);
    const [openPicker, setOpenPicker] = useState<'single' | 'rangeStart' | 'rangeEnd' | null>(null);
    const [selectedVisit, setSelectedVisit] = useState<RecentVisit | null>(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [previewUrl, setPreviewUrl] = useState('');
    const totalItems = recentVisits.length;
    const startIndex = 0;
    const endIndex = totalItems;
    const currentItems = recentVisits;

    const modalProducts: ModalProduct[] = products.map((product) => ({
        ...product,
        pivot: {
            quantity: 0,
            action_type: '',
            price: 0,
            value: 0,
        },
    }));

    const formatDateLabel = (dateString?: string) => {
        if (!dateString) return 'Pilih tanggal';
        const date = new Date(`${dateString}T00:00:00`);
        return new Intl.DateTimeFormat('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        }).format(date);
    };

    const toDateString = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0,
        }).format(Number(value) || 0);
    };

    const applyFilter = () => {
        router.get(
            '/supervisor/dashboard',
            {
                filterType,
                date: singleDate,
                startDate,
                endDate,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            }
        );
    };

    const refreshData = () => {
        router.get(
            '/supervisor/dashboard',
            {
                filterType,
                date: singleDate,
                startDate,
                endDate,
                refresh: true,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            }
        );
    };

    const formatTimeOnly = (timeStr?: string | null) => {
        if (!timeStr) return '—';
        return new Date(timeStr).toLocaleTimeString('id-ID', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    };

    const dailyCompletion = stats.target_visit_today > 0
        ? (stats.visits_today / stats.target_visit_today) * 100
        : 0;

    // const monthlyCompletion = stats.target_visit_month > 0
    //     ? (stats.visits_this_month / stats.target_visit_month) * 100
    //     : 0;

    const totalCollectionToday = stats.collection_status_visit + stats.collection_status_delivery;
    const totalCollectionTargetToday = stats.collection_target_visit + stats.collection_target_delivery;

    const totalCollectionCompletion = totalCollectionTargetToday > 0
        ? (totalCollectionToday / totalCollectionTargetToday) * 100
        : 0;

    const deliveryMinimumCompletion = stats.collection_target_delivery > 0
        ? (stats.collection_status_delivery / stats.collection_target_delivery) * 100
        : 100;

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
            label: 'Customer Dikunjungi Tim',
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
            label: 'Sales Hadir di Periode',
            color: 'text-emerald-600',
        },
        {
            icon: MapPinned,
            value: stats.visits_today,
            label: period.isRange ? 'Visit Periode' : 'Visit Harian',
            color: 'text-cyan-600',
        },
        {
            icon: TrendingUp,
            value: `${dailyCompletion.toFixed(2)}%`,
            label: period.isRange ? 'Pencapaian Target Periode' : 'Pencapaian Target Harian',
            color: 'text-green-600',
        },
        // {
        //     icon: TrendingUp,
        //     value: `${monthlyCompletion.toFixed(2)}%`,
        //     label: 'Pencapaian Target Bulanan',
        //     color: 'text-orange-600',
        // },
        {
            icon: ShieldAlert,
            value: stats.fake_gps_today,
            label: period.isRange ? 'Fake GPS Periode' : 'Fake GPS Harian',
            color: 'text-rose-600',
        },
        {
            icon: ClipboardCheck,
            value: `${totalCollectionToday}/${totalCollectionTargetToday}`,
            label: `Total Collection vs Target (${totalCollectionCompletion.toFixed(2)}%)`,
            color: 'text-indigo-600',
        },
        {
            icon: Package,
            value: `${stats.collection_status_delivery}/${stats.collection_target_delivery}`,
            label: `Pengiriman vs Minimal (${deliveryMinimumCompletion.toFixed(2)}%)`,
            color: 'text-teal-600',
        },
        {
            icon: TrendingUp,
            value: formatCurrency(stats.sales_value),
            label: 'Hasil Penjualan',
            color: 'text-emerald-600',
        },
        {
            icon: RefreshCcw,
            value: formatCurrency(stats.return_value),
            label: 'Pengembalian Dana',
            color: 'text-rose-600',
        },
        {
            icon: ClipboardCheck,
            value: formatCurrency(stats.net_profit_value),
            label: 'Laba Bersih',
            color: 'text-blue-600',
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex flex-col gap-6 p-6">
                <div className="rounded-xl border bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <div className="mb-3 text-sm font-semibold text-gray-800 dark:text-gray-200">Filter Periode Dashboard</div>
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                        <div className="flex-1 min-w-45 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
                            <div className="grid grid-cols-2 gap-1">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setFilterType('single');
                                        setOpenPicker(null);
                                    }}
                                    className={`rounded-md px-4 py-1.5 text-xs font-semibold transition-all sm:text-sm ${filterType === 'single'
                                        ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-700 dark:text-blue-400'
                                        : 'text-slate-600 hover:bg-slate-200/60 dark:text-slate-300 dark:hover:bg-slate-700/60'
                                        }`}
                                >
                                    Harian
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setFilterType('range');
                                        setOpenPicker(null);
                                    }}
                                    className={`rounded-md px-4 py-1.5 text-xs font-semibold transition-all sm:text-sm ${filterType === 'range'
                                        ? 'bg-orange-500 text-white shadow-sm dark:bg-orange-600 dark:text-white'
                                        : 'text-slate-600 hover:bg-slate-200/60 dark:text-slate-300 dark:hover:bg-slate-700/60'
                                        }`}
                                >
                                    Periode
                                </button>
                            </div>
                        </div>

                        <div className="relative flex-1 min-w-55 rounded-lg border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                            {filterType === 'single' ? (
                                <div className="relative">
                                    <Calendar size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <button
                                        type="button"
                                        onClick={() => setOpenPicker((prev) => (prev === 'single' ? null : 'single'))}
                                        className="w-full cursor-pointer py-2 pl-10 pr-4 text-left text-sm font-medium text-slate-700 focus:outline-none dark:text-slate-200"
                                    >
                                        {formatDateLabel(singleDate)}
                                    </button>

                                    {openPicker === 'single' && (
                                        <div className="absolute left-0 top-[calc(100%+8px)] z-30 rounded-xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-900">
                                            <DayPicker
                                                mode="single"
                                                selected={singleDate ? new Date(`${singleDate}T00:00:00`) : undefined}
                                                onSelect={(date) => {
                                                    if (date) {
                                                        setSingleDate(toDateString(date));
                                                        setOpenPicker(null);
                                                    }
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
                                    <div className="relative flex-1 min-w-27.5">
                                        <button
                                            type="button"
                                            onClick={() => setOpenPicker((prev) => (prev === 'rangeStart' ? null : 'rangeStart'))}
                                            className="w-full border-r border-slate-200 px-3 py-2 text-center text-sm font-medium text-slate-700 focus:outline-none dark:border-slate-700 dark:text-slate-200 sm:border-none"
                                        >
                                            {formatDateLabel(startDate)}
                                        </button>
                                        {openPicker === 'rangeStart' && (
                                            <div className="absolute left-0 top-[calc(100%+8px)] z-30 rounded-xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-900">
                                                <DayPicker
                                                    mode="single"
                                                    selected={startDate ? new Date(`${startDate}T00:00:00`) : undefined}
                                                    onSelect={(date) => {
                                                        if (date) {
                                                            setStartDate(toDateString(date));
                                                            setOpenPicker(null);
                                                        }
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <span className="hidden text-sm text-slate-400 dark:text-slate-500 sm:inline">s/d</span>

                                    <div className="relative flex-1 min-w-27.5">
                                        <button
                                            type="button"
                                            onClick={() => setOpenPicker((prev) => (prev === 'rangeEnd' ? null : 'rangeEnd'))}
                                            className="w-full px-3 py-2 text-center text-sm font-medium text-slate-700 focus:outline-none dark:text-slate-200"
                                        >
                                            {formatDateLabel(endDate)}
                                        </button>
                                        {openPicker === 'rangeEnd' && (
                                            <div className="absolute right-0 top-[calc(100%+8px)] z-30 rounded-xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-900">
                                                <DayPicker
                                                    mode="single"
                                                    selected={endDate ? new Date(`${endDate}T00:00:00`) : undefined}
                                                    onSelect={(date) => {
                                                        if (date) {
                                                            setEndDate(toDateString(date));
                                                            setOpenPicker(null);
                                                        }
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={applyFilter}
                                        className="shrink-0 rounded-md bg-orange-500 p-2.5 text-white transition-colors hover:bg-orange-600"
                                        title="Terapkan Periode tanggal"
                                    >
                                        <Filter size={16} strokeWidth={2.5} />
                                    </button>
                                </div>
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={applyFilter}
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
                        >
                            Terapkan
                        </button>

                        <button
                            type="button"
                            onClick={refreshData}
                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
                        >
                            <RefreshCcw className="h-4 w-4" />
                            Refresh Data
                        </button>
                    </div>
                </div>

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

                <ProgressTable
                    title="PROGRESS TIM SALES"
                    rows={progressPerSales}
                    monitoringFilter={{
                        filterType,
                        date: singleDate,
                        startDate,
                        endDate,
                    }}
                />

                <VisitHistorySection
                    totalItems={totalItems}
                    startIndex={startIndex}
                    endIndex={endIndex}
                    selectedSalesId={null}
                    salesUsers={progressPerSales.map((sales) => ({ id: sales.id, name: sales.name }))}
                    currentItems={currentItems}
                    selectedVisit={selectedVisit}
                    onSelectVisit={(visit) => {
                        const matchedVisit = recentVisits.find((item) => item.id === visit.id);
                        if (matchedVisit) {
                            setSelectedVisit(matchedVisit);
                        }
                    }}
                    formatTimeOnly={formatTimeOnly}
                    itemsPerPage={10}
                    currentPage={1}
                    totalPages={1}
                    onPrevPage={() => {}}
                    onNextPage={() => {}}
                    layout="grid2"
                />

                {selectedVisit && (
                    <VisitDetailModal
                        visit={{
                            ...selectedVisit,
                            customer_name: selectedVisit.customer_name || undefined,
                            customer_phone: undefined,
                            customer_email: undefined,
                        }}
                        products={modalProducts}
                        onClose={() => setSelectedVisit(null)}
                        onPreviewImage={(url: string) => {
                            setPreviewUrl(url);
                            setIsPreviewOpen(true);
                        }}
                        formatTime={formatTimeOnly}
                    />
                )}

                {isPreviewOpen && (
                    <ImagePreviewModal
                        isOpen={isPreviewOpen}
                        onClose={() => {
                            setIsPreviewOpen(false);
                            setPreviewUrl('');
                        }}
                        imageUrl={previewUrl}
                    />
                )}
            </div>
        </AppLayout>
    );
}