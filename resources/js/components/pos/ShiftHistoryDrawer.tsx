import { useState, useEffect, useCallback } from 'react';
import { X, Loader2, ReceiptText, User, ChevronRight, XCircle, AlertTriangle, CheckCircle2, Search } from 'lucide-react';
import axios from 'axios';
import type { Transaction, CashierShift } from '@/types/pos';

interface Props {
    isOpen: boolean;
    shift: CashierShift | null;
    onClose: () => void;
    onViewReceipt: (transaction: Transaction) => void;
}

interface ShiftSummary {
    total_transactions: number;
    total_revenue: number;
    total_discount: number;
    voided_count: number;
}

export default function ShiftHistoryDrawer({ isOpen, shift, onClose, onViewReceipt }: Props) {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [voidingId, setVoidingId] = useState<number | null>(null);
    const [voidError, setVoidError] = useState('');

    const fetchTransactions = useCallback(async () => {
        if (!shift) return;
        setIsLoading(true); setError('');
        try {
            const res = await axios.get('/pos/transactions/list', {
                params: { shift_id: shift.id, per_page: 50 },
            });
            setTransactions(Array.isArray(res.data) ? res.data : []);
        } catch {
            setError('Gagal memuat riwayat transaksi');
        } finally {
            setIsLoading(false);
        }
    }, [shift]);

    useEffect(() => {
        if (isOpen && shift) fetchTransactions();
        if (!isOpen) { setSearch(''); setVoidError(''); }
    }, [isOpen, shift, fetchTransactions]);

    const handleVoid = async (tx: Transaction) => {
        if (!confirm(`Batalkan transaksi ${tx.transaction_number}?`)) return;
        setVoidingId(tx.id); setVoidError('');
        try {
            await axios.post(`/pos/transactions/${tx.id}/void`);
            setTransactions(prev => prev.map(t => t.id === tx.id ? { ...t, status: 'voided' } : t));
        } catch (err: any) {
            setVoidError(err.response?.data?.error || 'Gagal membatalkan transaksi');
        } finally {
            setVoidingId(null);
        }
    };

    const filtered = transactions.filter(t =>
        !search || t.transaction_number.toLowerCase().includes(search.toLowerCase()) ||
        t.member?.name?.toLowerCase().includes(search.toLowerCase())
    );

    const summary: ShiftSummary = transactions.reduce((acc, t) => {
        if (t.status === 'voided') return { ...acc, voided_count: acc.voided_count + 1 };
        return {
            ...acc,
            total_transactions: acc.total_transactions + 1,
            total_revenue: acc.total_revenue + t.grand_total,
            total_discount: acc.total_discount + t.total_discount,
        };
    }, { total_transactions: 0, total_revenue: 0, total_discount: 0, voided_count: 0 });

    const fmt = (v: number) => `Rp ${v.toLocaleString('id-ID')}`;

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />

            {/* Drawer */}
            <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-white dark:bg-zinc-900 shadow-2xl flex flex-col">

                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-zinc-800 shrink-0">
                    <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">Riwayat Transaksi</p>
                        <p className="text-xs text-gray-400">Shift aktif • {transactions.length} transaksi</p>
                    </div>
                    <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 flex items-center justify-center text-gray-400 transition-colors">
                        <X size={15} />
                    </button>
                </div>

                {/* Summary cards */}
                {!isLoading && transactions.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 px-4 py-3 border-b border-gray-100 dark:border-zinc-800 shrink-0">
                        <SummaryCard label="Transaksi" value={String(summary.total_transactions)} color="indigo" />
                        <SummaryCard label="Pendapatan" value={fmtShort(summary.total_revenue)} color="emerald" />
                        <SummaryCard label="Diskon" value={fmtShort(summary.total_discount)} color="amber" />
                    </div>
                )}

                {/* Search */}
                <div className="px-4 py-2 border-b border-gray-100 dark:border-zinc-800 shrink-0">
                    <div className="flex items-center gap-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2">
                        <Search size={13} className="text-gray-400 shrink-0" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Cari no. transaksi atau member..."
                            className="flex-1 bg-transparent text-sm outline-none text-gray-900 dark:text-white placeholder-gray-400"
                        />
                        {search && <button onClick={() => setSearch('')} className="text-gray-400 hover:text-gray-600"><XCircle size={13} /></button>}
                    </div>
                </div>

                {/* Void error */}
                {voidError && (
                    <div className="mx-4 mt-2 flex items-center gap-2 text-xs text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2 shrink-0">
                        <AlertTriangle size={12} /> {voidError}
                    </div>
                )}

                {/* List */}
                <div className="flex-1 overflow-y-auto">
                    {isLoading && (
                        <div className="flex items-center justify-center h-32">
                            <Loader2 size={20} className="animate-spin text-indigo-400" />
                        </div>
                    )}
                    {error && (
                        <div className="flex flex-col items-center justify-center h-32 gap-2 text-gray-400">
                            <AlertTriangle size={24} strokeWidth={1} />
                            <p className="text-sm">{error}</p>
                            <button onClick={fetchTransactions} className="text-xs text-indigo-500 hover:underline">Coba lagi</button>
                        </div>
                    )}
                    {!isLoading && !error && filtered.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-32 gap-2 text-gray-300 dark:text-zinc-700">
                            <ReceiptText size={32} strokeWidth={1} />
                            <p className="text-sm text-gray-400">{search ? 'Tidak ditemukan' : 'Belum ada transaksi'}</p>
                        </div>
                    )}
                    {!isLoading && filtered.map(tx => (
                        <TransactionRow
                            key={tx.id}
                            transaction={tx}
                            isVoiding={voidingId === tx.id}
                            onView={() => onViewReceipt(tx)}
                            onVoid={() => handleVoid(tx)}
                            fmt={fmt}
                        />
                    ))}
                </div>
            </div>
        </>
    );
}

// ── Sub-components ─────────────────────────────────────────────────────────
function SummaryCard({ label, value, color }: { label: string; value: string; color: 'indigo' | 'emerald' | 'amber' }) {
    const colors = {
        indigo: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400',
        emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400',
        amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400',
    };
    return (
        <div className={`rounded-xl px-3 py-2 ${colors[color]}`}>
            <p className="text-[10px] font-medium opacity-70">{label}</p>
            <p className="text-sm font-bold truncate">{value}</p>
        </div>
    );
}

interface RowProps {
    transaction: Transaction;
    isVoiding: boolean;
    onView: () => void;
    onVoid: () => void;
    fmt: (v: number) => string;
}

function TransactionRow({ transaction: tx, isVoiding, onView, onVoid, fmt }: RowProps) {
    const isVoided = tx.status === 'voided';
    const time = new Date(tx.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    return (
        <div className={`px-4 py-3 border-b border-gray-100 dark:border-zinc-800 last:border-0 ${isVoided ? 'opacity-50' : ''} cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors`} onClick={onView}>
            <div className="flex items-center gap-3">
                {/* Icon */}
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isVoided ? 'bg-red-100 dark:bg-red-900/20' : 'bg-indigo-100 dark:bg-indigo-900/20'}`}>
                    {isVoided
                        ? <XCircle size={14} className="text-red-500" />
                        : <CheckCircle2 size={14} className="text-indigo-600" />
                    }
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{tx.transaction_number}</p>
                        {isVoided && <span className="text-[9px] font-bold text-red-500 bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded-full shrink-0">VOID</span>}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span>{time}</span>
                        {tx.member && (
                            <>
                                <span>•</span>
                                <span className="flex items-center gap-0.5 truncate">
                                    <User size={9} /> {tx.member.name}
                                </span>
                            </>
                        )}
                    </div>
                </div>

                {/* Amount */}
                <div className="text-right shrink-0">
                    <p className={`text-sm font-bold ${isVoided ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                        {fmt(tx.grand_total)}
                    </p>
                    <p className="text-[10px] text-gray-400">{tx.items?.length ?? 0} item</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                    {!isVoided && (
                        <button
                            onClick={e => { e.stopPropagation(); onVoid(); }}
                            disabled={isVoiding}
                            className="w-7 h-7 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center justify-center text-gray-300 hover:text-red-500 transition-colors disabled:opacity-50"
                            title="Batalkan transaksi"
                        >
                            {isVoiding ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} />}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

function fmtShort(v: number): string {
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1).replace(/\.0$/, '')}jt`;
    if (v >= 1_000) return `${(v / 1_000).toFixed(0)}rb`;
    return v.toLocaleString('id-ID');
}
