import { router } from '@inertiajs/react';
import axios from 'axios';
import { useMemo, useState } from 'react';
import { PushNotificationService } from '@/services/push-notification-service';
import type { SalesUser, StockAdjustForm, StockAdjustLine } from '../types';
import type { Product, Warehouse } from '../types';

interface UseStockAdjustmentParams {
    salesUsers: SalesUser[];
    products: Product[];
    warehouses: Warehouse[];
    showAlert: (title: string, message: React.ReactNode, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

export function useStockAdjustment({ salesUsers, products, warehouses, showAlert }: UseStockAdjustmentParams) {
    const [stockAdjustLoading, setStockAdjustLoading] = useState(false);
    const [stockAdjustProgress, setStockAdjustProgress] = useState<{ current: number; total: number } | null>(null);
    const [confirmPreviewOpen, setConfirmPreviewOpen] = useState(false);
    const [clearListConfirmOpen, setClearListConfirmOpen] = useState(false);

    const [stockAdjustForm, setStockAdjustForm] = useState<StockAdjustForm>({
        product_id: '',
        warehouse_id: '',
        user_id: '',
        type: 'in',
        quantity: '',
        reference: '',
        note: '',
    });

    const [stockAdjustLines, setStockAdjustLines] = useState<StockAdjustLine[]>([]);

    const selectableSalesUsers = useMemo(() => {
        return salesUsers.filter((salesUser) => {
            if (!stockAdjustForm.warehouse_id) {
                return true;
            }

            return Number(salesUser.warehouse_id) === Number(stockAdjustForm.warehouse_id);
        });
    }, [salesUsers, stockAdjustForm.warehouse_id]);

    const sendOutAssignmentNotifications = async (assignments: Array<{ user_id: number; quantity: number; reference?: string | null }>) => {
        if (stockAdjustForm.type !== 'out' || assignments.length === 0) {
            return;
        }

        const product = products.find((item) => String(item.id) === String(stockAdjustForm.product_id));
        const warehouse = warehouses.find((item) => String(item.id) === String(stockAdjustForm.warehouse_id));

        const aggregated = new Map<number, { quantity: number; references: string[] }>();

        assignments.forEach((assignment) => {
            const current = aggregated.get(assignment.user_id) ?? { quantity: 0, references: [] };
            current.quantity += Number(assignment.quantity || 0);

            const cleanReference = (assignment.reference ?? '').trim();
            if (cleanReference && !current.references.includes(cleanReference)) {
                current.references.push(cleanReference);
            }

            aggregated.set(assignment.user_id, current);
        });

        let failedCount = 0;

        for (const [userId, info] of aggregated.entries()) {
            const user = salesUsers.find((salesUser) => salesUser.id === userId);
            const productLabel = product?.name ?? 'produk';
            const warehouseLabel = warehouse?.name ?? 'gudang';
            const referencesText = info.references.length > 0 ? ` Ref: ${info.references.join(', ')}.` : '';

            try {
                await PushNotificationService.sendTargeted({
                    targetUserIds: [userId],
                    title: 'Assign Stok Baru',
                    message: `Halo ${user?.name ?? 'Sales'}, Anda menerima ${info.quantity} pcs ${productLabel} dari ${warehouseLabel}.${referencesText}`,
                    type: 'stock_assignment',
                    actionUrl: '/notifications',
                    data: {
                        product_id: Number(stockAdjustForm.product_id),
                        warehouse_id: Number(stockAdjustForm.warehouse_id),
                        quantity: info.quantity,
                        references: info.references,
                    },
                });
            } catch {
                failedCount += 1;
            }
        }

        if (failedCount > 0) {
            throw new Error('Sebagian notifikasi assign gagal dikirim.');
        }
    };

    const submitStockAdjustment = async (availableOutStock?: number) => {
        if (!stockAdjustForm.product_id || !stockAdjustForm.warehouse_id) {
            return;
        }

        if (stockAdjustLines.length > 0) {
            setStockAdjustLoading(true);
            setStockAdjustProgress({ current: 0, total: stockAdjustLines.length });
            const successfulOutAssignments: Array<{ user_id: number; quantity: number; reference?: string | null }> = [];

            for (let i = 0; i < stockAdjustLines.length; i += 1) {
                const line = stockAdjustLines[i];
                setStockAdjustProgress({ current: i + 1, total: stockAdjustLines.length });

                const payload = {
                    product_id: Number(stockAdjustForm.product_id),
                    warehouse_id: Number(stockAdjustForm.warehouse_id),
                    type: stockAdjustForm.type,
                    user_id: stockAdjustForm.type === 'out' ? Number(line.user_id) : null,
                    quantity: Number(line.quantity),
                    reference: line.reference ?? null,
                    note: line.note ?? null,
                };

                try {
                    await axios.post('/settings/stocks/adjust', payload);

                    if (stockAdjustForm.type === 'out') {
                        successfulOutAssignments.push({
                            user_id: Number(line.user_id),
                            quantity: Number(line.quantity),
                            reference: line.reference ?? null,
                        });
                    }
                } catch (err: unknown) {
                    let msg = `Gagal menyimpan baris ${i + 1}`;
                    if (typeof err === 'object' && err !== null) {
                        const errorObj = err as { response?: { status?: number; data?: { message?: string } }, message?: string };
                        if (errorObj.response) {
                            const status = errorObj.response.status;
                            msg += ` (status ${status})`;
                            if (errorObj.response.data?.message) msg += `: ${errorObj.response.data.message}`;
                        } else if (errorObj.message) {
                            msg += `: ${errorObj.message}`;
                        }
                    }
                    setStockAdjustLoading(false);
                    setStockAdjustProgress(null);
                    return showAlert('Gagal', msg, 'error');
                }
            }

            try {
                await sendOutAssignmentNotifications(successfulOutAssignments);
            } catch {
                showAlert('Peringatan', 'Stok tersimpan, namun ada notifikasi assign yang belum terkirim.', 'warning');
            }

            setStockAdjustLines([]);
            setStockAdjustForm((prev) => ({
                ...prev,
                user_id: prev.type === 'out' ? prev.user_id : '',
                quantity: '',
                reference: '',
                note: '',
            }));
            setStockAdjustLoading(false);
            setStockAdjustProgress(null);

            showAlert('Berhasil', 'Data berhasil disimpan.', 'success');
            router.reload({ only: ['stocks', 'movements', 'salesStockSummaries'] });
            return;
        }

        if (!stockAdjustForm.quantity) return;
        if (stockAdjustForm.type === 'out' && !stockAdjustForm.user_id) return;

        if (stockAdjustForm.type === 'out' && typeof availableOutStock === 'number') {
            const requestQty = Number(stockAdjustForm.quantity || 0);
            if (requestQty > availableOutStock) {
                showAlert('Qty melebihi stok', `Stok tersedia saat ini hanya ${availableOutStock}.`, 'warning');
                return;
            }
        }

        setStockAdjustLoading(true);
        const singleOutAssignment = stockAdjustForm.type === 'out'
            ? [{
                user_id: Number(stockAdjustForm.user_id),
                quantity: Number(stockAdjustForm.quantity),
                reference: stockAdjustForm.reference.trim() || null,
            }]
            : [];

        router.post('/settings/stocks/adjust', {
            product_id: Number(stockAdjustForm.product_id),
            warehouse_id: Number(stockAdjustForm.warehouse_id),
            type: stockAdjustForm.type,
            user_id: stockAdjustForm.type === 'out' ? Number(stockAdjustForm.user_id) : null,
            quantity: Number(stockAdjustForm.quantity),
            reference: stockAdjustForm.reference.trim() || null,
            note: stockAdjustForm.note.trim() || null,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                if (singleOutAssignment.length > 0) {
                    void sendOutAssignmentNotifications(singleOutAssignment).catch(() => {
                        showAlert('Peringatan', 'Stok tersimpan, namun notifikasi assign belum terkirim.', 'warning');
                    });
                }

                setStockAdjustForm((prev) => ({
                    ...prev,
                    user_id: prev.type === 'out' ? prev.user_id : '',
                    quantity: '',
                    reference: '',
                    note: '',
                }));
                router.reload({ only: ['stocks', 'movements', 'salesStockSummaries'] });
            },
            onFinish: () => setStockAdjustLoading(false),
        });
    };

    const addStockAdjustLine = (availableOutStock?: number) => {
        if (!stockAdjustForm.user_id || !stockAdjustForm.quantity) return;

        if (stockAdjustForm.type === 'out' && typeof availableOutStock === 'number') {
            const requestQty = Number(stockAdjustForm.quantity || 0);
            if (availableOutStock <= 0) {
                showAlert('Stok habis', 'Tidak ada stok tersisa untuk ditambahkan ke daftar.', 'warning');
                return;
            }
            if (requestQty > availableOutStock) {
                showAlert('Qty melebihi stok', `Maksimal qty yang bisa ditambahkan sekarang adalah ${availableOutStock}.`, 'warning');
                return;
            }
        }

        const line: StockAdjustLine = {
            user_id: Number(stockAdjustForm.user_id),
            quantity: Number(stockAdjustForm.quantity),
            reference: stockAdjustForm.reference.trim() || null,
            note: stockAdjustForm.note.trim() || null,
        };

        setStockAdjustLines((prev) => [...prev, line]);

        setStockAdjustForm((prev) => ({
            ...prev,
            user_id: prev.type === 'out' ? '' : '',
            quantity: '',
            reference: '',
            note: '',
        }));
    };

    const removeStockAdjustLine = (index: number) => {
        setStockAdjustLines((prev) => prev.filter((_, i) => i !== index));
    };

    return {
        stockAdjustLoading,
        stockAdjustProgress,
        confirmPreviewOpen,
        setConfirmPreviewOpen,
        clearListConfirmOpen,
        setClearListConfirmOpen,
        stockAdjustForm,
        setStockAdjustForm,
        stockAdjustLines,
        setStockAdjustLines,
        selectableSalesUsers,
        submitStockAdjustment,
        addStockAdjustLine,
        removeStockAdjustLine,
    };
}
