import { Head, router, usePage } from '@inertiajs/react';
import { Search, Plus, Package } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import FormModalProduct from '@/components/settings/products/FormModalProduct';
import TableWithPaginationProduct from '@/components/settings/products/TableWithPaginationProduct';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import type { BreadcrumbItem } from '@/types';

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

interface PageProps {
    products: Pagination<ProductRow>;
    filters: {
        search?: string;
        category?: string;
        per_page?: number;
    };
    categories: string[];
    flash?: {
        success?: string;
        error?: string;
        warning?: string;
        info?: string;
    };
    [key: string]: unknown;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Product Settings',
        href: '/settings/products',
    },
];

export default function ProductSettings() {
    const { products, filters, categories, flash } = usePage<PageProps>().props;

    const [searchInput, setSearchInput] = useState(filters.search || '');
    const perPage = filters.per_page || 10;
    const [categoryFilter, setCategoryFilter] = useState<string | undefined>(filters.category || undefined);

    const [showFormModal, setShowFormModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState<ProductRow | null>(null);
    const [formLoading, setFormLoading] = useState(false);

    const [form, setForm] = useState({
        name: '',
        sku: '',
        category: '',
        description: '',
        price: '',
        is_active: true,
    });

    const isEdit = editingProduct !== null;

    const updateFilters = useCallback(
        (newFilters: { search?: string; per_page?: number; page?: number; category?: string }) => {
            const hasCategoryFilter = Object.prototype.hasOwnProperty.call(newFilters, 'category');
            const nextCategory = hasCategoryFilter ? (newFilters.category || undefined) : categoryFilter;

            const params: Record<string, string | number | undefined> = {
                search: newFilters.search ?? (searchInput || undefined),
                per_page: newFilters.per_page ?? perPage,
                page: newFilters.page,
                category: nextCategory,
            };

            router.get('/settings/products', params, {
                preserveState: true,
                replace: true,
                preserveScroll: true,
            });
        },
        [perPage, categoryFilter, searchInput]
    );

    useEffect(() => {
        const timer = setTimeout(() => {
            if ((filters.search || '') !== searchInput) {
                updateFilters({ search: searchInput || undefined, page: 1 });
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchInput, filters.search, updateFilters]);

    const openCreateModal = () => {
        setEditingProduct(null);
        setForm({
            name: '',
            sku: '',
            category: '',
            description: '',
            price: '',
            is_active: true,
        });
        setShowFormModal(true);
    };

    const openEditModal = (product: ProductRow) => {
        setEditingProduct(product);
        setForm({
            name: product.name,
            sku: product.sku,
            category: product.category || '',
            description: product.description || '',
            price: String(product.price),
            is_active: product.is_active,
        });
        setShowFormModal(true);
    };

    const handleDeleteProduct = (product: ProductRow) => {
        if (!confirm(`Hapus produk ${product.name}?`)) return;

        router.delete(`/settings/products/${product.id}`, {
            preserveScroll: true,
        });
    };

    const handleFormChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = event.target;
        let inputValue: string | boolean = value;

        // Handle is_active checkbox value conversion
        if (name === 'is_active') {
            inputValue = value === 'true' || value === '1';
        }

        setForm((prev) => ({
            ...prev,
            [name]: inputValue,
        }));
    };

    const handleSubmit = (formData: typeof form, imageFile: File | null) => {
        setFormLoading(true);

        const payload = new FormData();
        payload.append('name', formData.name);
        payload.append('sku', formData.sku);
        payload.append('category', formData.category || '');
        payload.append('description', formData.description || '');
        payload.append('price', formData.price);
        payload.append('is_active', formData.is_active ? '1' : '0');

        if (imageFile) {
            payload.append('image', imageFile);
        }

        const options: Record<string, unknown> = {
            preserveScroll: true,
            onFinish: () => {
                setFormLoading(false);
            },
            onSuccess: () => {
                setShowFormModal(false);
            },
        };

        if (isEdit && editingProduct) {
            // For Laravel to recognize PATCH request through FormData
            payload.append('_method', 'PUT');
            router.post(`/settings/products/${editingProduct.id}`, payload, options);
            return;
        }

        router.post('/settings/products', payload, options);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Product Settings" />

            <SettingsLayout>
                <div className="space-y-8">
                    {(flash?.success || flash?.error || flash?.warning || flash?.info) && (
                        <div
                            className={`rounded-xl border px-4 py-3 text-sm ${
                                flash?.success
                                    ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300'
                                    : flash?.error
                                      ? 'border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-700 dark:bg-rose-900/20 dark:text-rose-300'
                                      : 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                            }`}
                        >
                            {flash?.success || flash?.error || flash?.warning || flash?.info}
                        </div>
                    )}

                    <section>
                        <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-lg dark:border-gray-800 dark:bg-gray-900 md:p-8">
                            <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
                                <div>
                                    <h1 className="flex items-center gap-3 text-2xl font-bold text-gray-900 dark:text-white md:text-3xl">
                                        <Package className="h-8 w-8 text-indigo-600 md:h-10 md:w-10" />
                                        Product Management
                                    </h1>
                                    <p className="mt-2 text-gray-600 dark:text-gray-400">Kelola data produk di sistem (CRUD dengan upload gambar).</p>
                                </div>
                            </div>
                        </div>

                        <div className="mb-6">
                            <div className="flex flex-col gap-4 md:flex-row md:items-end">
                                <div className="flex-1">
                                    <label className="mb-2 block text-sm font-semibold text-gray-900 dark:text-white">
                                        Cari Produk
                                    </label>
                                    <div className="relative">
                                        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Cari nama, SKU, atau deskripsi..."
                                            value={searchInput}
                                            onChange={(e) => setSearchInput(e.target.value)}
                                            className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800"
                                        />
                                    </div>
                                </div>

                                <div className="w-full md:w-56">
                                    <label className="mb-2 block text-sm font-semibold text-gray-900 dark:text-white">
                                        Filter Kategori
                                    </label>
                                    <select
                                        value={categoryFilter || ''}
                                        onChange={(e) => {
                                            const value = e.target.value || undefined;
                                            setCategoryFilter(value);
                                            updateFilters({ category: value, page: 1 });
                                        }}
                                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800"
                                    >
                                        <option value="">Semua Kategori</option>
                                        {categories.map((cat) => (
                                            <option key={cat} value={cat}>
                                                {cat}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <button
                                    onClick={() => openCreateModal()}
                                    className="flex items-center gap-2 rounded-xl bg-linear-to-br from-indigo-600 to-purple-600 px-6 py-3 font-semibold text-white shadow-lg transition hover:from-indigo-700 hover:to-purple-700 md:py-4"
                                >
                                    <Plus className="h-5 w-5" />
                                    Tambah Produk
                                </button>
                            </div>
                        </div>

                        <TableWithPaginationProduct
                            products={products}
                            onEdit={openEditModal}
                            onDelete={handleDeleteProduct}
                            updateFilters={(payload) => updateFilters(payload)}
                        />
                    </section>
                </div>
            </SettingsLayout>

            <FormModalProduct
                isOpen={showFormModal}
                onClose={() => setShowFormModal(false)}
                onSubmit={handleSubmit}
                form={form}
                onChange={handleFormChange}
                isEdit={isEdit}
                loading={formLoading}
                editingProductId={editingProduct?.id ?? null}
                currentImage={editingProduct?.file_path ?? null}
            />
        </AppLayout>
    );
}
