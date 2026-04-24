import { useState, useEffect } from 'react';
import { Clock, AlertCircle } from 'lucide-react';
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

    // Snapshot shift data saat form tutup dibuka
    // Ini mencegah crash saat prop currentShift berubah ke null
    // sementara form tutup masih ditampilkan
    const [shiftSnapshot, setShiftSnapshot] = useState<CashierShift | null>(null);

    const openCloseForm = () => {
        setShiftSnapshot(currentShift); // simpan snapshot sebelum apapun berubah
        setShowCloseForm(true);
    };

    // Reset form jika shift berubah dari luar (misal session expired)
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

    // ── Belum ada shift ────────────────────────────────────────────────────
    if (!currentShift) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="w-5 h-5" /> Buka Shift
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Alert>
                        <AlertCircle className="w-4 h-4" />
                        <AlertDescription>Buka shift terlebih dahulu sebelum melakukan transaksi</AlertDescription>
                    </Alert>
                    {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
                    <div>
                        <label className="block text-sm font-medium mb-2">Saldo Awal (Rp)</label>
                        <Input type="number" placeholder="0" value={openingBalance}
                            onChange={e => setOpeningBalance(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleOpenShift()}
                        />
                    </div>
                    <Button className="w-full" onClick={handleOpenShift} disabled={isLoading || !openingBalance}>
                        {isLoading ? 'Membuka Shift...' : 'Buka Shift'}
                    </Button>
                </CardContent>
            </Card>
        );
    }

    // ── Form tutup shift — pakai snapshot, bukan prop langsung ────────────
    if (showCloseForm && shiftSnapshot) {
        const expectedCash = shiftSnapshot.expected_cash ?? null;
        const selisih = closingBalance && expectedCash !== null
            ? parseFloat(closingBalance) - expectedCash
            : null;

        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="w-5 h-5" /> Tutup Shift
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="p-3 border rounded bg-blue-50 dark:bg-blue-900/20 space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span>Saldo Awal:</span>
                            <span className="font-medium">Rp {shiftSnapshot.opening_balance.toLocaleString('id-ID')}</span>
                        </div>
                        {expectedCash !== null && (
                            <div className="flex justify-between">
                                <span>Saldo Diharapkan:</span>
                                <span className="font-medium">Rp {expectedCash.toLocaleString('id-ID')}</span>
                            </div>
                        )}
                    </div>

                    {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

                    <div>
                        <label className="block text-sm font-medium mb-2">Saldo Akhir Aktual (Rp)</label>
                        <Input type="number" placeholder="0" value={closingBalance}
                            onChange={e => setClosingBalance(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleCloseShift()}
                        />
                    </div>

                    {selisih !== null && (
                        <div className="p-3 border rounded">
                            <div className="flex justify-between items-center">
                                <span className="text-sm">Selisih:</span>
                                <span className={`font-bold ${selisih >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    Rp {selisih.toLocaleString('id-ID')}
                                </span>
                            </div>
                        </div>
                    )}

                    <div className="flex gap-2">
                        <Button variant="outline" className="flex-1"
                            onClick={() => { setShowCloseForm(false); setShiftSnapshot(null); setClosingBalance(''); setError(''); }}
                        >Batal</Button>
                        <Button className="flex-1" onClick={handleCloseShift} disabled={isLoading || !closingBalance}>
                            {isLoading ? 'Menutup Shift...' : 'Tutup Shift'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // ── Shift aktif ────────────────────────────────────────────────────────
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" /> Shift Aktif
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="p-3 border rounded bg-green-50 dark:bg-green-900/20 space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span>Status:</span>
                        <span className="font-medium text-green-600">Aktif</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Dibuka:</span>
                        <span className="font-medium">{new Date(currentShift.opened_at).toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Saldo Awal:</span>
                        <span className="font-medium">Rp {currentShift.opening_balance.toLocaleString('id-ID')}</span>
                    </div>
                </div>
                <Button variant="destructive" className="w-full" onClick={openCloseForm}>
                    Tutup Shift
                </Button>
            </CardContent>
        </Card>
    );
}
