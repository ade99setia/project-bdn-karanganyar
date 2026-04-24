import { useEffect, useState } from 'react';
import { X, Loader2, TrendingUp, ShoppingBag, Banknote, AlertTriangle, CheckCircle2, XCircle, ReceiptText, Scale } from 'lucide-react';
import axios from 'axios';
import type { CashierShift } from '@/types/pos';

interface ShiftReport {
    shift: CashierShift;
    total_transactions: number;
    voided_count: number;
    total_revenue: number;
    total_discount: number;
    total_cash_received: number;
    total_change: number;
    total_items_sold: number;
    opening_balance: number;
    expected_cash: number;
    actual_cash: number | null;
    difference: number | null;
}

interface Props {
    isOpen: boolean;
    shift: CashierShift | null;
    onClose: () => void;
}

export default function ShiftReportDrawer({ isOpen, shift, onClose }: Props) {
    const [report, setReport] = useState<ShiftReport | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!isOpen || !shift) return;
        setIsLoading(true); setError('');
        axios.get(`/pos/shifts/${shift.id}/report`)
            .then(r => setReport(r.data))
            .catch(() => setError('Gagal memuat laporan shift'))
            .finally(() => setIsLoading(false));
    }, [isOpen, shift]);

    if (!isOpen) return null;

    const fmt = (v: number) => `Rp ${v.toLocaleString('id-ID')}`;
    const isActive = shift?.status === 'open';

    return (
        <>
            <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />

            <div className="fixed left-0 top-0 bottom-0 z-50 w-full max-w-md bg-white dark:bg-zinc-900 shadow-2xl flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-zinc-800 shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                            <TrendingUp size={14} className="text-indigo-600" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">Laporan Shift</p>
                            <p className="text-xs text-gray-400 flex items-center gap-1">
                                <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                                {isActive ? 'Shift sedang berjalan' : 'Shift sudah ditutup'}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 flex items-center justify-center text-gray-400 transition-colors">
                        <X size={15} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {isLoading && (
                        <div className="flex items-center justify-center h-40">
                            <Loader2 size={24} className="animate-spin text-indigo-400" />
                        </div>
                    )}
                    {error && (
                        <div className="m-4 flex items-center gap-2 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-xl px-4 py-3">
                            <AlertTriangle size={14} /> {error}
                        </div>
                    )}

                    {report && (
                        <div className="p-4 space-y-4">
                            {/* Waktu shift */}
                            <div className="bg-gray-50 dark:bg-zinc-800 rounded-xl px-4 py-3 space-y-1 text-xs text-gray-500 dark:text-gray-400">
                                <div className="flex justify-between">
                                    <span>Dibuka</span>
                                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                                        {new Date(report.shift.opened_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                {!isActive && report.shift.closed_at && (
                                    <div className="flex justify-between">
                                        <span>Ditutup</span>
                                        <span className="font-semibold text-gray-700 dark:text-gray-300">
                                            {new Date(report.shift.closed_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Summary cards */}
                            <div className="grid grid-cols-2 gap-3">
                                <SummaryCard
                                    icon={<ReceiptText size={16} />}
                                    label="Transaksi"
                                    value={String(report.total_transactions)}
                                    sub={report.voided_count > 0 ? `${report.voided_count} void` : undefined}
                                    color="indigo"
                                />
                                <SummaryCard
                                    icon={<ShoppingBag size={16} />}
                                    label="Item Terjual"
                                    value={String(report.total_items_sold)}
                                    color="violet"
                                />
                                <SummaryCard
                                    icon={<TrendingUp size={16} />}
                                    label="Total Penjualan"
                                    value={fmtShort(report.total_revenue)}
                                    sub={report.total_discount > 0 ? `diskon ${fmtShort(report.total_discount)}` : undefined}
                                    color="emerald"
                                />
                                <SummaryCard
                                    icon={<Banknote size={16} />}
                                    label="Uang Masuk"
                                    value={fmtShort(report.total_cash_received)}
                                    sub={`kembalian ${fmtShort(report.total_change)}`}
                                    color="amber"
                                />
                            </div>

                            {/* Rekonsiliasi kas */}
                            <div className="rounded-xl border border-gray-200 dark:border-zinc-700 overflow-hidden">
                                <div className="px-4 py-2.5 bg-gray-50 dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700">
                                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                                        <Scale size={11} /> Rekonsiliasi Kas
                                    </p>
                                </div>
                                <div className="px-4 py-3 space-y-2">
                                    <ReconRow label="Saldo Awal" value={fmt(report.opening_balance)} />
                                    <ReconRow label="Total Penjualan Tunai" value={`+${fmt(report.total_revenue)}`} highlight="emerald" />
                                    <div className="border-t border-dashed border-gray-200 dark:border-zinc-700 pt-2">
                                        <ReconRow label="Kas yang Diharapkan" value={fmt(report.expected_cash)} bold />
                                    </div>

                                    {!isActive && report.actual_cash !== null && (
                                        <>
                                            <ReconRow label="Kas Aktual" value={fmt(report.actual_cash)} />
                                            <div className="border-t border-dashed border-gray-200 dark:border-zinc-700 pt-2">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Selisih</span>
                                                    <div className="flex items-center gap-1.5">
                                                        {(report.difference ?? 0) === 0 ? (
                                                            <CheckCircle2 size={13} className="text-emerald-500" />
                                                        ) : (
                                                            <XCircle size={13} className={(report.difference ?? 0) > 0 ? 'text-emerald-500' : 'text-red-500'} />
                                                        )}
                                                        <span className={`text-sm font-black ${
                                                            (report.difference ?? 0) === 0 ? 'text-emerald-600'
                                                            : (report.difference ?? 0) > 0 ? 'text-emerald-600'
                                                            : 'text-red-600'
                                                        }`}>
                                                            {(report.difference ?? 0) >= 0 ? '+' : ''}{fmt(report.difference ?? 0)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {isActive && (
                                        <p className="text-[10px] text-gray-400 italic pt-1">
                                            Selisih kas akan dihitung saat shift ditutup
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

// ── Sub-components ─────────────────────────────────────────────────────────
function SummaryCard({ icon, label, value, sub, color }: {
    icon: React.ReactNode; label: string; value: string; sub?: string;
    color: 'indigo' | 'emerald' | 'amber' | 'violet';
}) {
    const colors = {
        indigo: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400',
        emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
        amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
        violet: 'bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400',
    };
    return (
        <div className={`rounded-xl px-3 py-3 ${colors[color]}`}>
            <div className="flex items-center gap-1.5 mb-1 opacity-70">{icon}<span className="text-[10px] font-bold uppercase tracking-wide">{label}</span></div>
            <p className="text-xl font-black tabular-nums">{value}</p>
            {sub && <p className="text-[10px] opacity-60 mt-0.5">{sub}</p>}
        </div>
    );
}

function ReconRow({ label, value, bold, highlight }: { label: string; value: string; bold?: boolean; highlight?: 'emerald' | 'red' }) {
    return (
        <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
            <span className={`text-xs tabular-nums ${bold ? 'font-black text-gray-900 dark:text-white' : 'font-semibold text-gray-700 dark:text-gray-300'} ${highlight === 'emerald' ? 'text-emerald-600' : highlight === 'red' ? 'text-red-600' : ''}`}>
                {value}
            </span>
        </div>
    );
}

function fmtShort(v: number): string {
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1).replace(/\.0$/, '')}jt`;
    if (v >= 1_000) return `${(v / 1_000).toFixed(0)}rb`;
    return v.toLocaleString('id-ID');
}
