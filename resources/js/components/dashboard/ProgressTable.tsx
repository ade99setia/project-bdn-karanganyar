import { router } from '@inertiajs/react';
import { TrendingUp, FileBarChart2 } from 'lucide-react';
import ImagePreviewModal from '@/components/modal/image-preview-modal';
import { useImagePreviewModal } from '@/hooks/use-image-preview-modal';

export interface ProgressRow {
    no: number;
    id: number;
    name: string;
    avatar: string | null;
    attendance_today: boolean;
    attendance_status?: 'Belum' | 'Bekerja' | 'Selesai';
    visits_today: number;
    visits_month: number;
    customers_touched: number;
    fake_gps_today: number;
    target_daily: number;
    delivery_today: number;
    target_delivery_daily: number;
    achievement_total_percent: number;
    achievement_delivery_percent: number;
    achievement_percent: number;
    achievement_raw_percent: number;
    last_visit_at: string | null;
}

type ProgressTableProps = {
    title: string;
    rows: ProgressRow[];
};

const getAchievementColor = (value: number) => {
    if (value >= 100) return 'text-emerald-600 dark:text-emerald-400';
    if (value >= 70) return 'text-amber-600 dark:text-amber-400';
    return 'text-rose-600 dark:text-rose-400';
};

const getAttendanceBadgeClass = (status: 'Belum' | 'Bekerja' | 'Selesai') => {
    if (status === 'Selesai') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300';
    if (status === 'Bekerja') return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';
    return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300';
};

export default function ProgressTable({ title, rows }: ProgressTableProps) {
    const { isPreviewOpen, previewUrl, openPreview, closePreview } = useImagePreviewModal();

    return (
        <>
            <div className="rounded-xl border border-gray-200/60 bg-white/95 shadow-sm backdrop-blur-md transition-all duration-300 dark:border-gray-700/50 dark:bg-gray-800/90">
                <div className="flex items-center justify-between gap-3 border-b border-gray-200 px-4 py-3 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                        <FileBarChart2 className="h-5 w-5 text-green-600" />
                        <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">{title}</h2>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Target harian: total aktivitas + minimal pengiriman</div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                        <thead>
                            <tr className="bg-green-500/15 text-[12px] uppercase text-green-900 dark:bg-green-700/25 dark:text-green-100">
                                <th className="border px-3 py-3 text-center">No</th>
                                <th className="border px-3 py-3 text-left">Sales</th>
                                <th className="border px-3 py-3 text-center">Presensi</th>
                                <th className="border px-3 py-3 text-center">Visit Hari Ini</th>
                                <th className="border px-3 py-3 text-center">Visit Bulan Ini</th>
                                <th className="border px-3 py-3 text-center">Customer</th>
                                <th className="border px-3 py-3 text-center">Fake GPS</th>
                                <th className="border px-3 py-3 text-center">Pencapaian</th>
                                <th className="border px-3 py-3 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.length === 0 ? (
                                <tr>
                                    <td className="border px-3 py-8 text-center text-sm text-gray-500 dark:text-gray-400" colSpan={9}>
                                        Belum ada anggota sales pada tim ini.
                                    </td>
                                </tr>
                            ) : (
                                rows.map((row) => {
                                    const attendanceStatus: 'Belum' | 'Bekerja' | 'Selesai' = row.attendance_status
                                        ?? (row.attendance_today ? 'Bekerja' : 'Belum');

                                    return (
                                    <tr key={row.id} className="transition hover:bg-gray-50 dark:hover:bg-gray-700/20">
                                        <td className="border px-3 py-2 text-center font-semibold">{row.no}</td>
                                        <td className="border px-3 py-2">
                                            <div className="flex items-center gap-2">
                                                {row.avatar ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => openPreview(row.avatar as string)}
                                                        className="h-8 w-8 overflow-hidden rounded-full ring-1 ring-blue-200 transition hover:ring-blue-400 focus:outline-none"
                                                        title={`Lihat avatar ${row.name}`}
                                                    >
                                                        <img src={row.avatar} alt={row.name} className="h-full w-full object-cover" />
                                                    </button>
                                                ) : (
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                                        {row.name.slice(0, 1).toUpperCase()}
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="font-medium text-gray-800 dark:text-gray-200">{row.name}</div>
                                                    <div className="text-[11px] text-gray-500 dark:text-gray-400">
                                                        Last visit: {row.last_visit_at ? new Date(row.last_visit_at).toLocaleString('id-ID') : '-'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="border px-3 py-2 text-center">
                                            <span
                                                className={`rounded-full px-2 py-1 text-xs font-semibold ${getAttendanceBadgeClass(attendanceStatus)}`}
                                            >
                                                {attendanceStatus}
                                            </span>
                                        </td>
                                        <td className="border px-3 py-2 text-center font-medium">{row.visits_today}</td>
                                        <td className="border px-3 py-2 text-center">{row.visits_month}</td>
                                        <td className="border px-3 py-2 text-center">{row.customers_touched}</td>
                                        <td className="border px-3 py-2 text-center">{row.fake_gps_today}</td>
                                        <td className="border px-3 py-2 text-center">
                                            <div className="space-y-1">
                                                <div className={`text-xs font-semibold ${getAchievementColor(row.achievement_raw_percent)}`}>
                                                    Overall: {row.achievement_raw_percent.toFixed(2)}%
                                                </div>
                                                <div className="text-[11px] text-gray-500 dark:text-gray-400">
                                                    Total {row.visits_today}/{row.target_daily} ({row.achievement_total_percent.toFixed(2)}%)
                                                </div>
                                                <div className="text-[11px] text-gray-500 dark:text-gray-400">
                                                    Pengiriman {row.delivery_today}/{row.target_delivery_daily} ({row.achievement_delivery_percent.toFixed(2)}%)
                                                </div>
                                                <div className="mx-auto h-2 w-24 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-600">
                                                    <div
                                                        className="h-full rounded-full bg-green-500"
                                                        style={{ width: `${Math.min(100, row.achievement_percent)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="border px-3 py-2 text-center">
                                            <button
                                                onClick={() => router.visit('/supervisor/monitoring-team')}
                                                className="inline-flex h-8 w-8 items-center justify-center rounded bg-green-50 text-green-600 transition hover:bg-green-100 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-800/50"
                                                title={`Buka monitoring tim untuk ${row.name}`}
                                            >
                                                <TrendingUp className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <ImagePreviewModal
                isOpen={isPreviewOpen}
                onClose={closePreview}
                imageUrl={previewUrl}
            />
        </>
    );
}
