import { useState } from 'react';
import { Clock, DollarSign, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { router } from '@inertiajs/react';
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

    const handleOpenShift = async () => {
        const balance = parseFloat(openingBalance);
        if (isNaN(balance) || balance < 0) {
            setError('Saldo awal tidak valid');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const response = await axios.post('/pos/shifts/open', {
                opening_balance: balance
            });

            onShiftChange(response.data.shift);
            setOpeningBalance('');
            router.reload();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Gagal membuka shift');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCloseShift = async () => {
        const balance = parseFloat(closingBalance);
        if (isNaN(balance) || balance < 0) {
            setError('Saldo akhir tidak valid');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const response = await axios.post('/pos/shifts/close', {
                closing_balance: balance
            });

            onShiftChange(null);
            setClosingBalance('');
            setShowCloseForm(false);
            router.reload();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Gagal menutup shift');
        } finally {
            setIsLoading(false);
        }
    };

    if (!currentShift) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="w-5 h-5" />
                        Buka Shift
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Alert>
                        <AlertCircle className="w-4 h-4" />
                        <AlertDescription>
                            Anda harus membuka shift terlebih dahulu sebelum melakukan transaksi
                        </AlertDescription>
                    </Alert>

                    {error && (
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Saldo Awal (Rp)
                        </label>
                        <Input
                            type="number"
                            placeholder="0"
                            value={openingBalance}
                            onChange={(e) => setOpeningBalance(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleOpenShift()}
                        />
                    </div>

                    <Button
                        className="w-full"
                        onClick={handleOpenShift}
                        disabled={isLoading || !openingBalance}
                    >
                        {isLoading ? 'Membuka Shift...' : 'Buka Shift'}
                    </Button>
                </CardContent>
            </Card>
        );
    }

    if (showCloseForm) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="w-5 h-5" />
                        Tutup Shift
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="p-3 border rounded bg-blue-50 dark:bg-blue-900/20 space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span>Saldo Awal:</span>
                            <span className="font-medium">
                                Rp {currentShift.opening_balance.toLocaleString('id-ID')}
                            </span>
                        </div>
                        {currentShift.expected_cash !== undefined && (
                            <div className="flex justify-between">
                                <span>Saldo yang Diharapkan:</span>
                                <span className="font-medium">
                                    Rp {currentShift.expected_cash.toLocaleString('id-ID')}
                                </span>
                            </div>
                        )}
                    </div>

                    {error && (
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Saldo Akhir Aktual (Rp)
                        </label>
                        <Input
                            type="number"
                            placeholder="0"
                            value={closingBalance}
                            onChange={(e) => setClosingBalance(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleCloseShift()}
                        />
                    </div>

                    {closingBalance && currentShift.expected_cash !== undefined && (
                        <div className="p-3 border rounded">
                            <div className="flex justify-between items-center">
                                <span className="text-sm">Selisih:</span>
                                <span className={`font-bold ${
                                    parseFloat(closingBalance) - currentShift.expected_cash >= 0
                                        ? 'text-green-600'
                                        : 'text-red-600'
                                }`}>
                                    Rp {(parseFloat(closingBalance) - currentShift.expected_cash).toLocaleString('id-ID')}
                                </span>
                            </div>
                        </div>
                    )}

                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => {
                                setShowCloseForm(false);
                                setClosingBalance('');
                                setError('');
                            }}
                        >
                            Batal
                        </Button>
                        <Button
                            className="flex-1"
                            onClick={handleCloseShift}
                            disabled={isLoading || !closingBalance}
                        >
                            {isLoading ? 'Menutup Shift...' : 'Tutup Shift'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Shift Aktif
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
                        <span className="font-medium">
                            {new Date(currentShift.opened_at).toLocaleString('id-ID')}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span>Saldo Awal:</span>
                        <span className="font-medium">
                            Rp {currentShift.opening_balance.toLocaleString('id-ID')}
                        </span>
                    </div>
                </div>

                <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => setShowCloseForm(true)}
                >
                    Tutup Shift
                </Button>
            </CardContent>
        </Card>
    );
}
