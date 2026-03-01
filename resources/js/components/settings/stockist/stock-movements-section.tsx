import { ImageIcon } from 'lucide-react';
import type { Product, StockMovementRow } from './types';

interface Props {
    filteredMovements: StockMovementRow[];
    onPreviewImage: (url: string) => void;
}

export default function StockMovementsSection({ filteredMovements, onPreviewImage }: Props) {
    return (
        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
            <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-800">
                <h2 className="font-semibold text-gray-900 dark:text-white">Audit Stock Movements (25 Terakhir)</h2>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 text-left dark:bg-gray-800/60">
                        <tr>
                            <th className="px-4 py-3">Waktu</th>
                            <th className="px-4 py-3">Tipe</th>
                            <th className="px-4 py-3">By</th>
                            <th className="px-4 py-3">Produk</th>
                            <th className="px-4 py-3">Gudang</th>
                            <th className="px-4 py-3">To Sales</th>
                            <th className="px-4 py-3 text-right">Qty</th>
                            <th className="px-4 py-3">Ref</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredMovements.length === 0 && (
                            <tr>
                                <td colSpan={8} className="px-4 py-6 text-center text-gray-500">
                                    Belum ada movement.
                                </td>
                            </tr>
                        )}
                        {filteredMovements.map((movement) => (
                            <tr key={movement.id} className="border-t border-gray-100 dark:border-gray-800">
                                <td className="px-4 py-3">{new Date(movement.created_at).toLocaleString('id-ID')}</td>
                                <td className="px-4 py-3">
                                    <span
                                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${movement.type === 'in'
                                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                                            : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300'
                                            }`}
                                    >
                                        {movement.type.toUpperCase()}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    {movement.created_by ? (
                                        <div>
                                            {(() => {
                                                const createdBy = movement.created_by as { id: number; name: string; phone?: string | null } | undefined;
                                                return (
                                                    <>
                                                        <a href={`/settings/users?search=${encodeURIComponent(createdBy?.name || '')}`} className="text-sm text-blue-600 hover:underline block">
                                                            {createdBy?.name}
                                                        </a>
                                                        <div className="text-xs text-zinc-500">
                                                            {createdBy?.phone ? `ID: ${createdBy.id} • ${createdBy.phone}` : `ID: ${createdBy?.id}`}
                                                        </div>
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    ) : (
                                        <span className="text-sm text-zinc-600">-</span>
                                    )}
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-800 shrink-0 border border-zinc-200 dark:border-zinc-700">
                                            {movement.product && 'file_path' in movement.product && movement.product.file_path ? (
                                                <button
                                                    type="button"
                                                    title="Lihat gambar"
                                                    onClick={() => onPreviewImage(`/storage/${(movement.product as Product & { file_path?: string | null }).file_path}`)}
                                                    className="block w-full h-full"
                                                >
                                                    <img src={`/storage/${(movement.product as Product & { file_path?: string | null }).file_path}`} alt={movement.product.name || ''} className="w-full h-full object-cover cursor-pointer" />
                                                </button>
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center"><ImageIcon size={16} className="text-zinc-400" /></div>
                                            )}
                                        </div>
                                        <div className="min-w-0">{movement.product.name} ({movement.product.sku})</div>
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    {movement.warehouse.name} ({movement.warehouse.code})
                                </td>
                                <td className="px-4 py-3">
                                    {movement.user ? (
                                        <div>
                                            <a href={`/settings/users?search=${encodeURIComponent(movement.user.name)}`} className="text-sm text-blue-600 hover:underline block">
                                                {movement.user.name}
                                            </a>
                                            <div className="text-xs text-zinc-500">{movement.user.phone ? `ID: ${movement.user.id} • ${movement.user.phone}` : `ID: ${movement.user.id}`}</div>
                                        </div>
                                    ) : (
                                        <span className="text-sm text-zinc-600">-</span>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-right font-semibold">{movement.quantity}</td>
                                <td className="px-4 py-3">
                                    {(() => {
                                        const ref = movement.reference?.toString().trim();
                                        const note = movement.note?.toString().trim();
                                        if (ref && note) return `${ref} - ${note}`;
                                        if (ref) return ref;
                                        if (note) return note;
                                        return '-';
                                    })()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
}
