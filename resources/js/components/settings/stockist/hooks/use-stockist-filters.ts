import { router } from '@inertiajs/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { SalesStockSummaryRow, StockMovementRow } from '../types';

interface UseStockistFiltersParams {
    initialSearch?: string;
    initialWarehouseFilter?: number;
    salesStockSummaries: SalesStockSummaryRow[];
    movements: StockMovementRow[];
}

export function useStockistFilters({
    initialSearch,
    initialWarehouseFilter,
    salesStockSummaries,
    movements,
}: UseStockistFiltersParams) {
    const [searchInput, setSearchInput] = useState(initialSearch || '');
    const [warehouseFilter, setWarehouseFilter] = useState<number | undefined>(initialWarehouseFilter);
    const [selectedProductIds, setSelectedProductIds] = useState<Array<string | number>>([]);
    const [selectedWarehouseIds, setSelectedWarehouseIds] = useState<Array<string | number>>([]);
    const [selectedUserIds, setSelectedUserIds] = useState<Array<string | number>>([]);

    const updateFilters = useCallback(
        (newFilters: { search?: string; warehouse_id?: number; page?: number }) => {
            const hasWarehouseFilter = Object.prototype.hasOwnProperty.call(newFilters, 'warehouse_id');
            const nextWarehouseId = hasWarehouseFilter ? newFilters.warehouse_id : warehouseFilter;

            router.get(
                '/settings/stockist',
                {
                    search: newFilters.search ?? (searchInput || undefined),
                    warehouse_id: nextWarehouseId,
                    page: newFilters.page,
                },
                {
                    preserveState: true,
                    replace: true,
                    preserveScroll: true,
                }
            );
        },
        [searchInput, warehouseFilter]
    );

    useEffect(() => {
        const timer = setTimeout(() => {
            if ((initialSearch || '') !== searchInput) {
                updateFilters({ search: searchInput || undefined, page: 1 });
            }
        }, 450);

        return () => clearTimeout(timer);
    }, [searchInput, initialSearch, updateFilters]);

    const filteredSalesStockSummaries = useMemo(() => {
        const q = (searchInput || '').trim().toLowerCase();
        const selectedProductIdStrings = selectedProductIds.map(String);
        const selectedUserIdStrings = selectedUserIds.map(String);
        const selectedWarehouseIdStrings = selectedWarehouseIds.length > 0
            ? selectedWarehouseIds.map(String)
            : (warehouseFilter ? [String(warehouseFilter)] : []);

        return salesStockSummaries.filter((row) => {
            if (selectedWarehouseIdStrings.length > 0) {
                if (!row.warehouse?.id) return false;
                if (!selectedWarehouseIdStrings.includes(String(row.warehouse.id))) return false;
            }
            if (selectedUserIdStrings.length > 0) {
                if (!row.user?.id) return false;
                if (!selectedUserIdStrings.includes(String(row.user.id))) return false;
            }
            if (selectedProductIdStrings.length > 0) {
                if (!row.product?.id) return false;
                if (!selectedProductIdStrings.includes(String(row.product.id))) return false;
            }
            if (!q) return true;

            return (
                (row.product?.name || '').toLowerCase().includes(q)
                || (row.product?.sku || '').toLowerCase().includes(q)
                || (row.product?.category || '').toLowerCase().includes(q)
                || (row.user?.name || '').toLowerCase().includes(q)
                || (row.warehouse?.name || '').toLowerCase().includes(q)
                || (row.warehouse?.code || '').toLowerCase().includes(q)
            );
        });
    }, [salesStockSummaries, searchInput, warehouseFilter, selectedProductIds, selectedWarehouseIds, selectedUserIds]);

    const filteredMovements = useMemo(() => {
        const q = (searchInput || '').trim().toLowerCase();
        const selectedProductIdStrings = selectedProductIds.map(String);
        const selectedWarehouseIdStrings = selectedWarehouseIds.length > 0
            ? selectedWarehouseIds.map(String)
            : (warehouseFilter ? [String(warehouseFilter)] : []);

        return movements.filter((movement) => {
            if (selectedWarehouseIdStrings.length > 0) {
                if (!movement.warehouse?.id) return false;
                if (!selectedWarehouseIdStrings.includes(String(movement.warehouse.id))) return false;
            }
            if (selectedProductIdStrings.length > 0) {
                if (!movement.product?.id) return false;
                if (!selectedProductIdStrings.includes(String(movement.product.id))) return false;
            }
            if (!q) return true;

            return (
                (movement.product?.name || '').toLowerCase().includes(q)
                || (movement.product?.sku || '').toLowerCase().includes(q)
                || (movement.warehouse?.name || '').toLowerCase().includes(q)
                || (movement.warehouse?.code || '').toLowerCase().includes(q)
                || (movement.reference || '').toLowerCase().includes(q)
                || (movement.type || '').toLowerCase().includes(q)
            );
        });
    }, [movements, searchInput, warehouseFilter, selectedProductIds, selectedWarehouseIds]);

    return {
        searchInput,
        setSearchInput,
        warehouseFilter,
        setWarehouseFilter,
        selectedProductIds,
        setSelectedProductIds,
        selectedWarehouseIds,
        setSelectedWarehouseIds,
        selectedUserIds,
        setSelectedUserIds,
        updateFilters,
        filteredSalesStockSummaries,
        filteredMovements,
    };
}
