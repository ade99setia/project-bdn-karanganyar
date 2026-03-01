import { ImageIcon } from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';
import UserMultiSelect from '@/components/inputs/UserMultiSelect';
import type { SalesStockSummaryRow, SalesUser } from './types';

interface Props {
    filteredSalesStockSummaries: SalesStockSummaryRow[];
    salesUsers: SalesUser[];
    selectedUserIds: Array<string | number>;
    setSelectedUserIds: Dispatch<SetStateAction<Array<string | number>>>;
    onPreviewImage: (url: string) => void;
}

export default function SalesStockSummarySection({
    filteredSalesStockSummaries,
    salesUsers,
    selectedUserIds,
    setSelectedUserIds,
    onPreviewImage,
}: Props) {
    return (
        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
            <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-800">
                <h2 className="font-semibold text-gray-900 dark:text-white">Stok Bawaan per Sales</h2>
            </div>

            <div className="m-4">
                <UserMultiSelect
                    items={salesUsers.map((s) => ({ id: s.id, title: s.name, subtitle: `ID: ${s.id}${s.phone ? ` • ${s.phone}` : ''}`, image: s.avatar ? `/storage/profiles/${s.avatar}` : null }))}
                    value={selectedUserIds}
                    onChange={(ids) => setSelectedUserIds(ids)}
                    placeholder="Cari sales..."
                    onPreviewImage={(url) => onPreviewImage(String(url))}
                />
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 text-left dark:bg-gray-800/60">
                        <tr>
                            <th className="px-4 py-3">Sales</th>
                            <th className="px-4 py-3">Gudang</th>
                            <th className="px-4 py-3">Produk</th>
                            <th className="px-4 py-3">SKU</th>
                            <th className="px-4 py-3 text-right">Qty Bawaan</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredSalesStockSummaries.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                                    Belum ada stok bawaan sales.
                                </td>
                            </tr>
                        )}
                        {filteredSalesStockSummaries.map((row) => (
                            <tr key={row.id} className="border-t border-gray-100 dark:border-gray-800">
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-800 shrink-0 border border-zinc-200 dark:border-zinc-700">
                                            {(() => {
                                                const user = salesUsers.find((s) => String(s.id) === String(row.user.id));
                                                if (user?.avatar) {
                                                    return (
                                                        <button
                                                            type="button"
                                                            title="Lihat gambar"
                                                            onClick={() => onPreviewImage(`/storage/profiles/${user.avatar}`)}
                                                            className="w-full h-full block"
                                                        >
                                                            <img src={`/storage/profiles/${user.avatar}`} alt={row.user.name || ''} className="w-full h-full object-cover cursor-pointer" />
                                                        </button>
                                                    );
                                                }
                                                return <div className="w-full h-full flex items-center justify-center"><ImageIcon size={16} className="text-zinc-400" /></div>;
                                            })()}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="truncate font-medium">{row.user.name || '-'}</div>
                                            <div className="text-xs text-zinc-500">
                                                {(() => {
                                                    const user = salesUsers.find((s) => String(s.id) === String(row.user.id));
                                                    if (!user) return `ID: ${row.user.id}`;
                                                    return `ID: ${user.id}${user.phone ? ` • ${user.phone}` : ''}`;
                                                })()}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-3">{row.warehouse.name ? `${row.warehouse.name} (${row.warehouse.code})` : '-'}</td>
                                <td className="px-4 py-3">{row.product.name || '-'}</td>
                                <td className="px-4 py-3">{row.product.sku || '-'}</td>
                                <td className="px-4 py-3 text-right font-semibold">{row.quantity}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
}
