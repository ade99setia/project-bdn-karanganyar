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

interface ConfirmStockAdjustModalProps {
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

export default function ConfirmStockAdjustModal({
	isOpen,
	onClose,
	onConfirm,
	stockAdjustForm,
	stockAdjustLines,
	products,
	warehouses,
	salesUsers,
}: ConfirmStockAdjustModalProps) {
	if (!isOpen) return null;

	const product = products.find(p => String(p.id) === String(stockAdjustForm.product_id));
	const warehouse = warehouses.find(w => String(w.id) === String(stockAdjustForm.warehouse_id));

	const linesToShow = stockAdjustLines.length > 0 ? stockAdjustLines : (stockAdjustForm.quantity ? [{ user_id: Number(stockAdjustForm.user_id) || 0, quantity: Number(stockAdjustForm.quantity), reference: stockAdjustForm.reference ?? null, note: stockAdjustForm.note ?? null }] : []);

	return createPortal(
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4" onClick={onClose}>
			<div className="relative w-full max-w-3xl max-h-[92vh] overflow-hidden rounded-2xl bg-white shadow-lg dark:bg-gray-900" onClick={(e) => e.stopPropagation()}>
				<button onClick={onClose} className="absolute top-3 right-3 z-10 rounded-md p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100">
					<X size={18} />
				</button>

				<div className="max-h-[92vh] overflow-y-auto p-4 sm:p-6">
					<div className="flex items-center gap-4">
						<div className="rounded-full bg-amber-100 p-3 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
							<AlertTriangle size={28} />
						</div>
						<div>
							<h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Konfirmasi Penyesuaian Stok</h3>
							<p className="text-sm text-gray-600 dark:text-gray-400">Periksa kembali data sebelum menyimpan. Perubahan tidak dapat dibatalkan.</p>
						</div>
					</div>

					<div className="mt-6 space-y-4 text-sm text-gray-700 dark:text-gray-300">
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<div>
								<div className="text-xs uppercase text-zinc-400 dark:text-zinc-500">Produk</div>
								<div className="font-medium">{product ? `${product.name} ${product.sku ? `(${product.sku})` : ''}` : '—'}</div>
							</div>
							<div>
								<div className="text-xs uppercase text-zinc-400 dark:text-zinc-500">Gudang</div>
								<div className="font-medium">{warehouse ? `${warehouse.name} ${warehouse.code ? `(${warehouse.code})` : ''}` : '—'}</div>
							</div>
							<div>
								<div className="text-xs uppercase text-zinc-400 dark:text-zinc-500">Tipe</div>
								<div className="font-medium">{stockAdjustForm.type === 'in' ? 'IN (Tambah)' : 'OUT (Kurang)'}</div>
							</div>
							<div>
								<div className="text-xs uppercase text-zinc-400 dark:text-zinc-500">Reference</div>
								<div className="font-medium">{stockAdjustForm.reference || '—'}</div>
							</div>
						</div>

						<div>
							<div className="text-xs uppercase text-zinc-400 dark:text-zinc-500">Detail Qty</div>
							<div className="mt-2 overflow-x-auto rounded-md border border-gray-200 dark:border-gray-700">
								<table className="min-w-full text-sm">
									<thead className="bg-gray-50 dark:bg-gray-800/70">
										<tr>
											<th className="px-3 py-2 text-left text-gray-700 dark:text-gray-300">User</th>
											<th className="px-3 py-2 text-left text-gray-700 dark:text-gray-300">Qty</th>
											<th className="px-3 py-2 text-left text-gray-700 dark:text-gray-300">Ref</th>
										</tr>
									</thead>
									<tbody>
										{linesToShow.map((l, idx) => {
											const user = salesUsers.find(s => s.id === l.user_id);
											return (
												<tr key={idx} className="border-t border-gray-200 dark:border-gray-700">
													<td className="px-3 py-2">
														<div className="flex items-center gap-3">
															<div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
																{user && user.avatar ? (
																	<img src={`/storage/profiles/${user.avatar}`} alt={user.name} className="h-full w-full object-cover" />
																) : (
																	(user?.name?.charAt(0) || 'U')
																)}
															</div>
															<div>
																<div className="font-medium">{user ? user.name : (l.user_id ? `User ${l.user_id}` : '—')}</div>
																<div className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">ID: {user ? user.id : (l.user_id || '—')}{user && user.phone ? ` • ${user.phone}` : ''}</div>
															</div>
														</div>
													</td>
													<td className="px-3 py-2">{l.quantity}</td>
													<td className="px-3 py-2">{l.reference || '—'}</td>
												</tr>
											);
										})}
									</tbody>
								</table>
							</div>
						</div>
					</div>

					<div className="mt-6 flex flex-col-reverse justify-end gap-2 sm:flex-row sm:gap-3">
						<button onClick={onClose} className="rounded-xl bg-gray-100 px-4 py-2 text-gray-700 transition hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700">Batal</button>
						<button onClick={onConfirm} className="rounded-xl bg-amber-600 px-4 py-2 text-white transition hover:bg-amber-700 dark:bg-amber-600 dark:hover:bg-amber-500">Konfirmasi & Simpan</button>
					</div>
				</div>
			</div>
		</div>,
		document.body
	);
}

export type { ConfirmStockAdjustModalProps };
