import { X, AlertTriangle } from 'lucide-react';
import React from 'react';
import { createPortal } from 'react-dom';

type Warehouse = { id: number; name: string; code?: string | null };
type Product = { id: number; name: string; sku?: string | null };
type SalesUser = { id: number; name: string; phone?: string | null; avatar?: string | null };

interface Line {
    user_id: number;
    quantity: number;
    reference?: string | null;
    note?: string | null;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    stockAdjustForm: {
        product_id: string | number;
        warehouse_id: string | number;
        user_id: string | number;
        type: 'in' | 'out';
        quantity: string | number;
        reference?: string;
        note?: string;
    };
    stockAdjustLines: Line[];
    products: Product[];
    warehouses: Warehouse[];
    salesUsers: SalesUser[];
}

export default function ConfirmStockAdjustModal({ isOpen, onClose, onConfirm, stockAdjustForm, stockAdjustLines, products, warehouses, salesUsers }: Props) {
    if (!isOpen) return null;

    const product = products.find(p => String(p.id) === String(stockAdjustForm.product_id));
    const warehouse = warehouses.find(w => String(w.id) === String(stockAdjustForm.warehouse_id));

    const linesToShow = stockAdjustLines.length > 0 ? stockAdjustLines : (stockAdjustForm.quantity ? [{ user_id: Number(stockAdjustForm.user_id) || 0, quantity: Number(stockAdjustForm.quantity), reference: stockAdjustForm.reference ?? null, note: stockAdjustForm.note ?? null }] : []);

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-lg overflow-hidden">
                <button onClick={onClose} className="absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-800">
                    <X size={18} />
                </button>

                <div className="p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-full bg-amber-100 text-amber-700">
                            <AlertTriangle size={28} />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Konfirmasi Penyesuaian Stok</h3>
                            <p className="text-sm text-gray-600">Periksa kembali data sebelum menyimpan. Perubahan tidak dapat dibatalkan.</p>
                        </div>
                    </div>

                    <div className="mt-6 space-y-4 text-sm text-gray-700">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <div className="text-xs text-zinc-400 uppercase">Produk</div>
                                <div className="font-medium">{product ? `${product.name} ${product.sku ? `(${product.sku})` : ''}` : '—'}</div>
                            </div>
                            <div>
                                <div className="text-xs text-zinc-400 uppercase">Gudang</div>
                                <div className="font-medium">{warehouse ? `${warehouse.name} ${warehouse.code ? `(${warehouse.code})` : ''}` : '—'}</div>
                            </div>
                            <div>
                                <div className="text-xs text-zinc-400 uppercase">Tipe</div>
                                <div className="font-medium">{stockAdjustForm.type === 'in' ? 'IN (Tambah)' : 'OUT (Kurang)'}</div>
                            </div>
                            <div>
                                <div className="text-xs text-zinc-400 uppercase">Reference</div>
                                <div className="font-medium">{stockAdjustForm.reference || '—'}</div>
                            </div>
                        </div>

                        <div>
                            <div className="text-xs text-zinc-400 uppercase">Detail Qty</div>
                            <div className="mt-2 overflow-x-auto border rounded-md">
                                <table className="min-w-full text-sm">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-3 py-2 text-left">User</th>
                                            <th className="px-3 py-2 text-left">Qty</th>
                                            <th className="px-3 py-2 text-left">Ref</th>
                                            {/* <th className="px-3 py-2 text-left">Note</th> */}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {linesToShow.map((l, idx) => {
                                            const user = salesUsers.find(s => s.id === l.user_id);
                                            return (
                                                <tr key={idx} className="border-t">
                                                    <td className="px-3 py-2">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-8 w-8 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center text-xs font-semibold text-slate-600">
                                                                {user && user.avatar ? (
                                                                    <img src={`/storage/profiles/${user.avatar}`} alt={user.name} className="h-full w-full object-cover" />
                                                                ) : (
                                                                    (user?.name?.charAt(0) || 'U')
                                                                )}
                                                            </div>
                                                            <div>
                                                                <div className="font-medium">{user ? user.name : (l.user_id ? `User ${l.user_id}` : '—')}</div>
                                                                <div className="text-xs text-zinc-500 mt-0.5">ID: {user ? user.id : (l.user_id || '—')}{user && user.phone ? ` • ${user.phone}` : ''}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-2">{l.quantity}</td>
                                                    <td className="px-3 py-2">{l.reference || '—'}</td>
                                                    {/* <td className="px-3 py-2">{l.note || '—'}</td> */}
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 flex gap-3 justify-end">
                        <button onClick={onClose} className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700">Batal</button>
                        <button onClick={onConfirm} className="px-4 py-2 rounded-xl bg-amber-600 text-white">Konfirmasi & Simpan</button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
