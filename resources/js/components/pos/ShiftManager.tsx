import { useState, useEffect } from 'react';
import { Clock, AlertCircle, ArrowRight, Wallet, History, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import axios from 'axios';

interface CashierShift {
    id: number;
    status: string;
    opened_at: string;
    opening_balance: number;
    closing_balance?: number;
    expected_cash?: number;
}

interface ShiftManagerProps {
    currentShift: CashierShift | null;
    onShiftChange: (shift: CashierShift | null) => void;
}

export default function ShiftManager({ currentShift, onShiftChange }: ShiftManagerProps) {
    const [openingBalance, setOpeningBalance] = useState('');
    const [closingBalance, setClosingBalance] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [showCloseForm, setShowCloseForm] = useState(false);
    const [shiftSnapshot, setShiftSnapshot] = useState<CashierShift | null>(null);

    const openCloseForm = () => {
        setShiftSnapshot(currentShift);
        setShowCloseForm(true);
    };

    useEffect(() => {
        if (!currentShift) {
            setShowCloseForm(false);
            setShiftSnapshot(null);
        }
    }, [currentShift]);

    const handleOpenShift = async () => {
        const balance = parseFloat(openingBalance);
        if (isNaN(balance) || balance < 0) { setError('Saldo awal tidak valid'); return; }
        setIsLoading(true); setError('');
        try {
            const res = await axios.post('/pos/shifts/open', { opening_balance: balance });
            setOpeningBalance('');
            onShiftChange(res.data.shift);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Gagal membuka shift');
        } finally { setIsLoading(false); }
    };

    const handleCloseShift = async () => {
        const balance = parseFloat(closingBalance);
        if (isNaN(balance) || balance < 0) { setError('Saldo akhir tidak valid'); return; }
        setIsLoading(true); setError('');
        try {
            await axios.post('/pos/shifts/close', { closing_balance: balance });
            setClosingBalance('');
            setShowCloseForm(false);
            setShiftSnapshot(null);
            onShiftChange(null);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Gagal menutup shift');
        } finally { setIsLoading(false); }
    };

    //  ── UI STATE: BELUM ADA SHIFT ──────────────────────────────────────────
    if (!currentShift) {
        return (
            <div className="space-y-5 py-2">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-xl text-blue-600">
                        <Wallet className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold tracking-tight text-zinc-800 dark:text-zinc-100">Buka Shift</h3>
                        <p className="text-xs text-zinc-500">Mulai sesi kasir untuk hari ini</p>
                    </div>
                </div>

                <div className="space-y-4">
                    {error && (
                        <Alert variant="destructive" className="rounded-xl border-red-100 bg-red-50 dark:bg-red-900/20">
                            <AlertDescription className="text-xs font-medium">{error}</AlertDescription>
                        </Alert>
                    )}

                    <div className="space-y-2.5">
                        <label className="text-sm font-semibold text-zinc-600 dark:text-zinc-400 ml-1">Modal Awal</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-blue-600 transition-colors font-bold text-sm">Rp</div>
                            <Input
                                type="number"
                                placeholder="0"
                                value={openingBalance}
                                className="pl-12 h-12 rounded-xl border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-lg font-bold focus:ring-4 focus:ring-blue-500/10 transition-all"
                                onChange={e => setOpeningBalance(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleOpenShift()}
                            />
                        </div>
                    </div>

                    <Button
                        className="w-full h-12 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98]"
                        onClick={handleOpenShift}
                        disabled={isLoading || !openingBalance}
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        {isLoading ? 'Membuka...' : 'Buka Shift Sekarang'}
                    </Button>
                </div>
            </div>
        );
    }

    // ── UI STATE: TUTUP SHIFT FORM ──────────────────────────────────────────
    if (showCloseForm && shiftSnapshot) {
        const expectedCash = shiftSnapshot.expected_cash ?? null;
        const selisih = closingBalance && expectedCash !== null
            ? parseFloat(closingBalance) - expectedCash
            : null;

        return (
            <div className="space-y-5 py-2">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-zinc-600">
                        <Clock className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold tracking-tight text-zinc-800 dark:text-zinc-100">Tutup Shift</h3>
                        <p className="text-xs text-zinc-500">Validasi saldo akhir kasir</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800">
                        <p className="text-[10px] uppercase font-bold text-zinc-400 mb-0.5">Saldo Awal</p>
                        <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Rp {shiftSnapshot.opening_balance.toLocaleString('id-ID')}</p>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-blue-50/50 dark:bg-blue-900/20 border border-blue-100/50 dark:border-blue-800/50">
                        <p className="text-[10px] uppercase font-bold text-blue-500 mb-0.5">Ekspektasi</p>
                        <p className="text-sm font-bold text-blue-700 dark:text-blue-300 text-right">Rp {expectedCash?.toLocaleString('id-ID') ?? '0'}</p>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-blue-600 font-bold">Rp</div>
                        <Input
                            type="number"
                            placeholder="Input Saldo Aktual..."
                            value={closingBalance}
                            className="pl-12 h-14 rounded-2xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xl font-black focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                            onChange={e => setClosingBalance(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleCloseShift()}
                        />
                    </div>
                </div>

                {selisih !== null && (
                    <div className={`p-4 rounded-2xl border animate-in fade-in slide-in-from-top-2 ${selisih >= 0 ? 'bg-emerald-50/50 border-emerald-100 dark:bg-emerald-900/10' : 'bg-red-50/50 border-red-100 dark:bg-red-900/10'}`}>
                        <div className="flex justify-between items-center">
                            <p className="text-[10px] font-bold uppercase text-zinc-400">Selisih</p>
                            <span className={`text-lg font-black ${selisih >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                {selisih >= 0 ? '+' : ''}Rp {selisih.toLocaleString('id-ID')}
                            </span>
                        </div>
                    </div>
                )}

                <div className="flex gap-3">
                    <Button variant="ghost" className="flex-1 h-12 rounded-xl font-bold" onClick={() => setShowCloseForm(false)}>Batal</Button>
                    <Button className="flex-[2] h-12 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 shadow-blue-500/20" onClick={handleCloseShift} disabled={isLoading || !closingBalance}>
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : 'Selesaikan Shift'}
                    </Button>
                </div>
            </div>
        );
    }

    // ── UI STATE: SHIFT AKTIF ──────────────────────────────────────────────
    return (
        <div className="space-y-4 py-2">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl text-emerald-600 relative">
                        <History className="w-5 h-5" />
                        <span className="absolute top-0 right-0 h-2.5 w-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-zinc-950 animate-pulse"></span>
                    </div>

                    <div>
                        <h3 className="text-sm font-bold tracking-tight text-zinc-800 dark:text-zinc-100 leading-none mb-1.5">
                            Shift Berjalan
                        </h3>
                        <div className="flex flex-col gap-0.5">
                            <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                                <Clock size={10} />
                                {new Date(currentShift.opened_at).toLocaleDateString('id-ID', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric'
                                })}
                            </p>
                            <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-500">
                                Pukul {new Date(currentShift.opened_at).toLocaleTimeString('id-ID', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="text-right">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase leading-none mb-1">Modal Awal</p>
                    <p className="text-sm font-black text-zinc-700 dark:text-zinc-100 tracking-tight">
                        Rp {currentShift.opening_balance.toLocaleString('id-ID')}
                    </p>
                </div>
            </div>

            <Button
                variant="outline"
                className="w-full h-11 rounded-xl font-bold border-zinc-200 dark:border-zinc-800 hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all flex items-center justify-center gap-2 group shadow-sm shadow-zinc-100 dark:shadow-none"
                onClick={openCloseForm}
            >
                Akhiri Sesi Kasir
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Button>
        </div>
    );
}