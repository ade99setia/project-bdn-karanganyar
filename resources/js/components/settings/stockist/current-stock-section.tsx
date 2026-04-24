import { ImageIcon } from 'lucide-react';
import PaginationBar from '@/components/ui/pagination-bar';
import type { Pagination, ProductStockRow } from './types';

interface Props {
    stocks: Pagination<ProductStockRow>;
    updateFilters: (newFilters: { search?: string; warehouse_id?: number; page?: number }) => void;
    onPreviewImage: (url: string) => void;
}

export default function CurrentStockSection({ stocks, updateFilters, onPreviewImage }: Props) {
    return (
        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
            <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-800">
                <h2 className="font-semibold text-gray-900 dark:text-white">Stok Saat Ini</h2>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 text-left dark:bg-gray-800/60">
                        <tr>
                            <th className="px-4 py-3">Produk</th>
                            <th className="px-4 py-3">SKU</th>
                            <th className="px-4 py-3">Kategori</th>
                            <th className="px-4 py-3">Gudang</th>
                            <th className="px-4 py-3 text-right">Qty</th>
                        </tr>
                    </thead>
                    <tbody>
                        {stocks.data.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                                    Belum ada data stok.
                                </td>
                            </tr>
                        )}
                        {stocks.data.map((row) => (
                            <tr key={row.id} className="border-t border-gray-100 dark:border-gray-800">
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-800 shrink-0 border border-zinc-200 dark:border-zinc-700">
                                            {row.product && row.product.file_path ? (
                                                <button
                                                    type="button"
                                                    title="Lihat gambar"
                                                    onClick={() => onPreviewImage(`/storage/${row.product.file_path}`)}
                                                    className="block w-full h-full"
                                                >
                                                    <img src={`/storage/${row.product.file_path}`} alt={row.product.name || ''} className="w-full h-full object-cover cursor-pointer" />
                                                </button>
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center"><ImageIcon size={16} className="text-zinc-400" /></div>
                                            )}
                                        </div>
                                        <div className="min-w-0 truncate font-medium text-gray-900 dark:text-white">{row.product.name}</div>
                                    </div>
                                </td>
                                <td className="px-4 py-3">{row.product.sku}</td>
                                <td className="px-4 py-3">{row.product.category || '-'}</td>
                                <td className="px-4 py-3">
                                    {row.warehouse.name} ({row.warehouse.code})
                                </td>
                                <td className="px-4 py-3 text-right font-semibold">{row.quantity}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <PaginationBar
                currentPage={stocks.current_page}
                lastPage={stocks.last_page}
                total={stocks.total}
                perPage={stocks.per_page}
                onPageChange={(page) => updateFilters({ page })}
            />
        </section>
    );
}
