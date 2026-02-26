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
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
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
                                        <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                                            product.is_active
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
                <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4 dark:border-gray-800">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                        Menampilkan {products.from} hingga {products.to} dari {products.total} produk
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => handlePageChange(products.current_page - 1)}
                            disabled={products.current_page === 1}
                            className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium transition disabled:opacity-50 dark:border-gray-700"
                        >
                            Sebelumnya
                        </button>
                        {Array.from({ length: products.last_page }, (_, i) => i + 1).map((page) => (
                            <button
                                key={page}
                                onClick={() => handlePageChange(page)}
                                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                                    page === products.current_page
                                        ? 'bg-indigo-600 text-white'
                                        : 'border border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800'
                                }`}
                            >
                                {page}
                            </button>
                        ))}
                        <button
                            onClick={() => handlePageChange(products.current_page + 1)}
                            disabled={products.current_page === products.last_page}
                            className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium transition disabled:opacity-50 dark:border-gray-700"
                        >
                            Selanjutnya
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
