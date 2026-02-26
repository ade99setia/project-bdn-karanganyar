import { ClipboardListIcon, Target, TrendingUp, BarChart2 } from 'lucide-react';
import type { ReactNode } from 'react';

export type BreakdownItem = {
    label: string;
    value: number;
    percent: number;
    color: string;
};

type DashboardStats = {
    visits_today: number;
    visits_this_month: number;
    target_visit_today: number;
    target_visit_month: number;
    visit_completion_today: number;
    visit_completion_month: number;
};

type CollectionStatusProps = {
    stats: DashboardStats;
    activityBreakdown: BreakdownItem[];
    productActionBreakdown: BreakdownItem[];
};

const ProgressCircle = ({ value, color }: { value: number; color: string }) => {
    const safeValue = Math.max(0, Math.min(100, value));
    const radius = 45;
    const circumference = 2 * Math.PI * radius;
    const dashOffset = circumference - (circumference * safeValue) / 100;

    return (
        <div className="relative h-32 w-32">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r={radius} stroke="currentColor" className="text-gray-200 dark:text-gray-700" strokeWidth="10" fill="none" />
                <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    stroke="currentColor"
                    className={color}
                    strokeWidth="10"
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={dashOffset}
                    strokeLinecap="round"
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{safeValue.toFixed(2)}%</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">Progress</span>
            </div>
        </div>
    );
};

const BreakdownList = ({ title, icon, data }: { title: string; icon: ReactNode; data: BreakdownItem[] }) => {
    return (
        <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
                {icon}
                {title}
            </h3>
            <div className="space-y-3">
                {data.length === 0 ? (
                    <div className="rounded-lg border border-dashed px-3 py-4 text-xs text-gray-500 dark:border-gray-600 dark:text-gray-400">
                        Belum ada data untuk periode ini.
                    </div>
                ) : (
                    data.map((item) => (
                        <div key={item.label} className="space-y-1.5 rounded-lg bg-gray-50 p-3 dark:bg-gray-900/40">
                            <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-300">
                                <span className="font-medium text-gray-800 dark:text-gray-200">{item.label}</span>
                                <span>{item.value} ({item.percent.toFixed(2)}%)</span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                                <div className={`h-full ${item.color}`} style={{ width: `${Math.min(100, item.percent)}%` }} />
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default function CollectionStatus({ stats, activityBreakdown, productActionBreakdown }: CollectionStatusProps) {
    const dailyGap = stats.target_visit_today - stats.visits_today;
    const monthlyGap = stats.target_visit_month - stats.visits_this_month;

    return (
        <div className="grid gap-6 lg:grid-cols-2">
            <div className="group flex flex-col gap-4 rounded-lg border bg-white p-6 shadow-sm transition-transform duration-300 hover:scale-[1.01] dark:border-gray-700 dark:bg-gray-800">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-800 dark:text-gray-200">
                    <ClipboardListIcon className="h-5 w-5 text-orange-600" />
                    Detail Collection Target
                </h2>

                <div className="flex items-center justify-between rounded-lg bg-orange-50 p-3 dark:bg-orange-900/20">
                    <div className="text-sm font-bold text-orange-700 dark:text-orange-300">{stats.visits_today} Visit</div>
                    <div className="text-sm font-bold text-blue-700 dark:text-blue-300">Target {stats.target_visit_today}</div>
                    <div className="text-sm font-bold text-emerald-700 dark:text-emerald-300">{stats.visit_completion_today.toFixed(2)}%</div>
                </div>

                <div className="flex justify-center py-2">
                    <ProgressCircle value={stats.visit_completion_today} color="text-orange-500" />
                </div>

                <div className="space-y-2 text-sm text-gray-700 dark:text-gray-200">
                    <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1"><Target className="h-4 w-4 text-blue-600" /> Harian</span>
                        <span className="font-semibold">{stats.visits_today}/{stats.target_visit_today} visit</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-600">
                        <div className="h-full rounded-full bg-orange-500" style={{ width: `${Math.min(100, stats.visit_completion_today)}%` }} />
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                        GAP hari ini: <span className={dailyGap > 0 ? 'font-semibold text-rose-500' : 'font-semibold text-emerald-500'}>{dailyGap > 0 ? `-${dailyGap}` : `+${Math.abs(dailyGap)}`}</span> visit
                    </div>
                </div>

                <BreakdownList
                    title="Komposisi Aktivitas Visit"
                    icon={<BarChart2 className="h-4 w-4 text-orange-500" />}
                    data={activityBreakdown}
                />
            </div>

            <div className="group flex flex-col gap-4 rounded-lg border bg-white p-6 shadow-sm transition-transform duration-300 hover:scale-[1.01] dark:border-gray-700 dark:bg-gray-800">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-800 dark:text-gray-200">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    Detail Collection Status
                </h2>

                <div className="flex items-center justify-between rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
                    <div className="text-sm font-bold text-blue-700 dark:text-blue-300">{stats.visits_this_month} Visit</div>
                    <div className="text-sm font-bold text-orange-700 dark:text-orange-300">Target {stats.target_visit_month}</div>
                    <div className="text-sm font-bold text-emerald-700 dark:text-emerald-300">{stats.visit_completion_month.toFixed(2)}%</div>
                </div>

                <div className="flex justify-center py-2">
                    <ProgressCircle value={stats.visit_completion_month} color="text-blue-500" />
                </div>

                <div className="space-y-2 text-sm text-gray-700 dark:text-gray-200">
                    <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1"><Target className="h-4 w-4 text-orange-600" /> Bulanan</span>
                        <span className="font-semibold">{stats.visits_this_month}/{stats.target_visit_month} visit</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-600">
                        <div className="h-full rounded-full bg-blue-500" style={{ width: `${Math.min(100, stats.visit_completion_month)}%` }} />
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                        GAP bulan ini: <span className={monthlyGap > 0 ? 'font-semibold text-rose-500' : 'font-semibold text-emerald-500'}>{monthlyGap > 0 ? `-${monthlyGap}` : `+${Math.abs(monthlyGap)}`}</span> visit
                    </div>
                </div>

                <BreakdownList
                    title="Aksi Produk oleh Tim"
                    icon={<ClipboardListIcon className="h-4 w-4 text-blue-500" />}
                    data={productActionBreakdown}
                />
            </div>
        </div>
    );
}
