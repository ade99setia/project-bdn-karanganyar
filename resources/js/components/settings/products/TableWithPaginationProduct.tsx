import { Pencil, Trash2, Image as ImageIcon } from 'lucide-react';

interface ProductRow {
    id: number;
    name: string;
    file_path: string | null;
    sku: string;
    category: string | null;
    description: string | null;
    price: number;
    is_active: boolean;
    created_at: string | null;
    updated_at: string | null;
}

interface Pagination<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
}

interface Props {
    products: Pagination<ProductRow>;
    onEdit: (product: ProductRow) => void;
    onDelete: (product: ProductRow) => void;
    updateFilters: (payload: Record<string, unknown>) => void;
}

export default function TableWithPaginationProduct({ products, onEdit, onDelete, updateFilters }: Props) {
    const handlePageChange = (page: number) => {
        updateFilters({ page });
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(price);
    };

    return (
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-800">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 text-left dark:bg-gray-800/60">
                        <tr className="border-b border-gray-200 dark:border-gray-800">
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                                Gambar
                            </th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                                Nama
                            </th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                                SKU
                            </th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                                Kategori
                            </th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                                Harga
                            </th>
                            <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900 dark:text-white">
                                Status
                            </th>
                            <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900 dark:text-white">
                                Aksi
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.data.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                                    Tidak ada produk
                                </td>
                            </tr>
                        ) : (
                            products.data.map((product) => (
                                <tr key={product.id} className="border-b border-gray-200 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50">
                                    <td className="px-6 py-4">
                                        {product.file_path ? (
                                            <img
                                                src={`/storage/${product.file_path}`}
                                                alt={product.name}
                                                className="h-10 w-10 rounded-lg object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-200 dark:bg-gray-700">
                                                <ImageIcon className="h-5 w-5 text-gray-400" />
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                                        {product.name}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                                        {product.sku}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                                        {product.category || '-'}
                                    </td>
                                    <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">
                                        {formatPrice(product.price)}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${product.is_active
                                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                            : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                                            }`}>
                                            {product.is_active ? 'Aktif' : 'Nonaktif'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => onEdit(product)}
                                                className="rounded-lg bg-blue-100 p-2 text-blue-600 transition hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50"
                                                title="Edit"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => onDelete(product)}
                                                className="rounded-lg bg-red-100 p-2 text-red-600 transition hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
                                                title="Hapus"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {products.last_page > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between border-t border-gray-200 px-4 py-3 sm:px-6 dark:border-gray-800 gap-4 sm:gap-0">
                    {/* Info */}
                    <div className="text-sm text-gray-700 dark:text-gray-300 order-2 sm:order-1">
                        Menampilkan <span className="font-medium">{products.from}</span> -{" "}
                        <span className="font-medium">{products.to}</span> dari{" "}
                        <span className="font-medium">{products.total}</span> produk
                    </div>

                    {/* Pagination buttons */}
                    <nav className="order-1 sm:order-2" aria-label="Pagination">
                        <div className="flex items-center justify-center gap-1 sm:gap-2 flex-wrap">
                            {/* Previous */}
                            <button
                                onClick={() => handlePageChange(products.current_page - 1)}
                                disabled={products.current_page === 1}
                                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition"
                            >
                                Sebelumnya
                            </button>

                            {(() => {
                                const pages: (number | string)[] = [];
                                const current = products.current_page;
                                const total = products.last_page;
                                const delta = 2;

                                pages.push(1);

                                if (current - delta > 2) {
                                    pages.push("...");
                                }

                                for (let i = Math.max(2, current - delta); i <= Math.min(total - 1, current + delta); i++) {
                                    pages.push(i);
                                }

                                if (current + delta < total - 1) {
                                    pages.push("...");
                                }

                                if (total > 1) {
                                    pages.push(total);
                                }

                                return pages.map((page, idx) => {
                                    if (page === "...") {
                                        return (
                                            <span
                                                key={`ellipsis-${idx}`}
                                                className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400"
                                            >
                                                ...
                                            </span>
                                        );
                                    }

                                    return (
                                        <button
                                            key={page}
                                            onClick={() => handlePageChange(page as number)}
                                            className={`min-w-10 rounded-md px-3 py-2 text-sm font-medium transition ${page === current
                                                    ? "bg-indigo-600 text-white border-indigo-600"
                                                    : "border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                                                }`}
                                        >
                                            {page}
                                        </button>
                                    );
                                });
                            })()}

                            {/* Next */}
                            <button
                                onClick={() => handlePageChange(products.current_page + 1)}
                                disabled={products.current_page === products.last_page}
                                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition"
                            >
                                Selanjutnya
                            </button>
                        </div>
                    </nav>
                </div>
            )}
        </div>
    );
}
