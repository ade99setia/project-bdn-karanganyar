import { DatabaseSearch } from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';
import ProductMultiSelect from '@/components/inputs/ProductMultiSelect';
import WerehouseMultiSelect from '@/components/inputs/WerehouseMultiSelect';
import type { Product, Warehouse } from './types';

interface Props {
    products: Product[];
    warehouses: Warehouse[];
    selectedProductIds: Array<string | number>;
    setSelectedProductIds: Dispatch<SetStateAction<Array<string | number>>>;
    selectedWarehouseIds: Array<string | number>;
    setSelectedWarehouseIds: Dispatch<SetStateAction<Array<string | number>>>;
    setSearchInput: Dispatch<SetStateAction<string>>;
    setWarehouseFilter: Dispatch<SetStateAction<number | undefined>>;
    updateFilters: (newFilters: { search?: string; warehouse_id?: number; page?: number }) => void;
    onPreviewImage: (url: string) => void;
}

export default function StockistFiltersSection({
    products,
    warehouses,
    selectedProductIds,
    setSelectedProductIds,
    selectedWarehouseIds,
    setSelectedWarehouseIds,
    setSearchInput,
    setWarehouseFilter,
    updateFilters,
    onPreviewImage,
}: Props) {
    return (
        <section className="grid grid-cols-1 gap-4 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900 md:grid-cols-2">

            <div className='md:col-span-2'>
                <h1 className="flex items-center gap-3 text-2xl font-bold text-gray-900 dark:text-white md:text-3xl">
                    <DatabaseSearch className="h-8 w-8 text-orange-600 md:h-10 md:w-10" />
                    Filter Data Stock
                </h1>
            </div>

            <div>
                <ProductMultiSelect
                    items={products.map((p) => ({ id: p.id, title: p.name, subtitle: p.sku, image: p.file_path ? `/storage/${p.file_path}` : null }))}
                    value={selectedProductIds}
                    onChange={(ids) => setSelectedProductIds(ids)}
                    onQueryChange={(q) => setSearchInput(q)}
                    placeholder="Nama / SKU..."
                    label="Cari Produk"
                    onPreviewImage={(url) => onPreviewImage(String(url))}
                />
            </div>

            <div>
                <WerehouseMultiSelect
                    items={warehouses.map((w) => ({ id: w.id, title: w.name, subtitle: w.code, image: w.file_path ? `/storage/${w.file_path}` : null }))}
                    value={selectedWarehouseIds}
                    onChange={(ids) => {
                        setSelectedWarehouseIds(ids);
                        if (ids.length === 1) {
                            const v = Number(ids[0]);
                            setWarehouseFilter(v);
                            updateFilters({ warehouse_id: v, page: 1 });
                        } else {
                            setWarehouseFilter(undefined);
                            updateFilters({ warehouse_id: undefined, page: 1 });
                        }
                    }}
                    placeholder="Gudang..."
                    label="Cari Gudang"
                    onPreviewImage={(url) => onPreviewImage(String(url))}
                />
            </div>
        </section>
    );
}
