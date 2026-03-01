import { Head, usePage } from '@inertiajs/react';
import { Warehouse as WarehouseIcon } from 'lucide-react';
import AlertModal from '@/components/modal/alert-modal';
import ConfirmStockAdjustModal from '@/components/modal/confirm-stock-adjust-modal';
import ImagePreviewModal from '@/components/modal/image-preview-modal';
import { useAlertModal } from '@/hooks/use-alert-modal';
import { useImagePreviewModal } from '@/hooks/use-image-preview-modal';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import CurrentStockSection from './current-stock-section';
import { useStockAdjustment } from './hooks/use-stock-adjustment';
import { useStockistFilters } from './hooks/use-stockist-filters';
import { useWarehouseManagement } from './hooks/use-warehouse-management';
import SalesStockSummarySection from './sales-stock-summary-section';
import StockAdjustmentSection from './stock-adjustment-section';
import StockMovementsSection from './stock-movements-section';
import StockistFiltersSection from './stockist-filters-section';
import type { PageProps } from './types';
import WarehouseManagementSection from './warehouse-management-section';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Stockist Settings',
        href: '/settings/stockist',
    },
];

export default function StockistSettingsPage() {
    const { stocks, movements, products, salesStockSummaries, salesUsers, warehouses, filters, flash } = usePage<PageProps>().props;
    const { isPreviewOpen, previewUrl, openPreview, closePreview } = useImagePreviewModal();
    const { alertConfig, showAlert, closeAlert } = useAlertModal();

    const {
        warehouseForm,
        setWarehouseForm,
        warehouseLoading,
        createFileInputRef,
        setWarehouseCreateFile,
        editingWarehouseId,
        warehouseEditForm,
        setWarehouseEditForm,
        setWarehouseEditFile,
        deleteWarehouseConfirmOpen,
        warehouseToDelete,
        closeDeleteWarehouseConfirm,
        confirmDeleteWarehouse,
        createWarehouse,
        startEditWarehouse,
        cancelEditWarehouse,
        saveWarehouseUpdate,
        deleteWarehouse,
    } = useWarehouseManagement();

    const {
        setSearchInput,
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
    } = useStockistFilters({
        initialSearch: filters.search,
        initialWarehouseFilter: filters.warehouse_id,
        salesStockSummaries,
        movements,
    });

    const {
        stockAdjustLoading,
        stockAdjustProgress,
        confirmPreviewOpen,
        setConfirmPreviewOpen,
        clearListConfirmOpen,
        setClearListConfirmOpen,
        stockAdjustForm,
        setStockAdjustForm,
        stockAdjustLines,
        setStockAdjustLines,
        selectableSalesUsers,
        submitStockAdjustment,
        addStockAdjustLine,
        removeStockAdjustLine,
    } = useStockAdjustment({
        salesUsers,
        showAlert,
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Stockist Settings" />

            <div className="min-h-screen space-y-8 bg-blue-50/20 dark:bg-blue-950/10 pb-20 pt-8 px-4 sm:px-6 lg:px-8">
                {(flash?.success || flash?.error || flash?.warning || flash?.info) && (
                    <div
                        className={`rounded-xl border px-4 py-3 text-sm ${flash?.success
                            ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300'
                            : flash?.error
                                ? 'border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-700 dark:bg-rose-900/20 dark:text-rose-300'
                                : 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                            }`}
                    >
                        {flash?.success || flash?.error || flash?.warning || flash?.info}
                    </div>
                )}

                <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                    <h1 className="flex items-center gap-3 text-2xl font-bold text-gray-900 dark:text-white md:text-3xl">
                        <WarehouseIcon className="h-8 w-8 text-indigo-600 md:h-10 md:w-10" />
                        Stockist Management
                    </h1>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        Monitor stok per gudang dan audit pergerakan stok dari flow pengiriman / retur.
                    </p>
                </section>

                <WarehouseManagementSection
                    warehouses={warehouses}
                    warehouseForm={warehouseForm}
                    setWarehouseForm={setWarehouseForm}
                    warehouseLoading={warehouseLoading}
                    createFileInputRef={createFileInputRef}
                    setWarehouseCreateFile={setWarehouseCreateFile}
                    createWarehouse={createWarehouse}
                    editingWarehouseId={editingWarehouseId}
                    warehouseEditForm={warehouseEditForm}
                    setWarehouseEditForm={setWarehouseEditForm}
                    setWarehouseEditFile={setWarehouseEditFile}
                    saveWarehouseUpdate={saveWarehouseUpdate}
                    cancelEditWarehouse={cancelEditWarehouse}
                    startEditWarehouse={startEditWarehouse}
                    deleteWarehouse={deleteWarehouse}
                    onPreviewImage={openPreview}
                />

                <StockAdjustmentSection
                    warehouses={warehouses}
                    products={products}
                    stocks={stocks}
                    salesUsers={salesUsers}
                    selectableSalesUsers={selectableSalesUsers}
                    stockAdjustForm={stockAdjustForm}
                    setStockAdjustForm={setStockAdjustForm}
                    stockAdjustLines={stockAdjustLines}
                    stockAdjustLoading={stockAdjustLoading}
                    stockAdjustProgress={stockAdjustProgress}
                    setClearListConfirmOpen={setClearListConfirmOpen}
                    addStockAdjustLine={addStockAdjustLine}
                    removeStockAdjustLine={removeStockAdjustLine}
                    setConfirmPreviewOpen={setConfirmPreviewOpen}
                    onPreviewImage={openPreview}
                />

                <AlertModal
                    isOpen={alertConfig.isOpen}
                    onClose={closeAlert}
                    title={alertConfig.title}
                    message={alertConfig.message}
                    type={alertConfig.type}
                />

                <AlertModal
                    isOpen={clearListConfirmOpen}
                    onClose={() => setClearListConfirmOpen(false)}
                    title="Kosongkan daftar?"
                    message="Semua item pada daftar penyesuaian OUT akan dihapus. Tindakan ini tidak dapat dibatalkan."
                    type="warning"
                    primaryButtonText="Ya, kosongkan"
                    onPrimaryClick={() => {
                        setStockAdjustLines([]);
                        setClearListConfirmOpen(false);
                    }}
                    secondaryButtonText="Batal"
                    onSecondaryClick={() => setClearListConfirmOpen(false)}
                />

                <AlertModal
                    isOpen={deleteWarehouseConfirmOpen}
                    onClose={closeDeleteWarehouseConfirm}
                    title="Hapus gudang?"
                    message={`Gudang ${warehouseToDelete?.name ?? ''} (${warehouseToDelete?.code ?? ''}) akan dihapus. Tindakan ini tidak dapat dibatalkan.`}
                    type="warning"
                    primaryButtonText="Ya, hapus"
                    onPrimaryClick={confirmDeleteWarehouse}
                    secondaryButtonText="Batal"
                    onSecondaryClick={closeDeleteWarehouseConfirm}
                />

                <ConfirmStockAdjustModal
                    isOpen={confirmPreviewOpen}
                    onClose={() => setConfirmPreviewOpen(false)}
                    onConfirm={() => {
                        setConfirmPreviewOpen(false);
                        submitStockAdjustment();
                    }}
                    stockAdjustForm={stockAdjustForm}
                    stockAdjustLines={stockAdjustLines}
                    products={products}
                    warehouses={warehouses}
                    salesUsers={salesUsers}
                />

                <StockistFiltersSection
                    products={products}
                    warehouses={warehouses}
                    selectedProductIds={selectedProductIds}
                    setSelectedProductIds={setSelectedProductIds}
                    selectedWarehouseIds={selectedWarehouseIds}
                    setSelectedWarehouseIds={setSelectedWarehouseIds}
                    setSearchInput={setSearchInput}
                    setWarehouseFilter={setWarehouseFilter}
                    updateFilters={updateFilters}
                    onPreviewImage={openPreview}
                />

                <SalesStockSummarySection
                    filteredSalesStockSummaries={filteredSalesStockSummaries}
                    salesUsers={salesUsers}
                    selectedUserIds={selectedUserIds}
                    setSelectedUserIds={setSelectedUserIds}
                    onPreviewImage={openPreview}
                />

                <CurrentStockSection
                    stocks={stocks}
                    updateFilters={updateFilters}
                    onPreviewImage={openPreview}
                />

                <StockMovementsSection
                    filteredMovements={filteredMovements}
                    onPreviewImage={openPreview}
                />
            </div>

            {isPreviewOpen && Boolean(previewUrl) && (
                <ImagePreviewModal
                    isOpen={isPreviewOpen}
                    onClose={closePreview}
                    imageUrl={previewUrl}
                />
            )}
        </AppLayout>
    );
}
