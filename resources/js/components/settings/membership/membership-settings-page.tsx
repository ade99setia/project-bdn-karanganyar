import { Head, usePage } from '@inertiajs/react';
import { CreditCard } from 'lucide-react';
import AlertModal from '@/components/modal/alert-modal';
import { useAlertModal } from '@/hooks/use-alert-modal';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import MemberManagementSection from './member-management-section';
import ProductDiscountSection from './product-discount-section';
import PromotionSection from './promotion-section';
import TierManagementSection from './tier-management-section';
import { useMemberManagement } from './hooks/use-member-management';
import { useMembershipFilters } from './hooks/use-membership-filters';
import { useTierManagement } from './hooks/use-tier-management';
import type { PageProps } from './types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Membership Settings',
        href: '/settings/membership',
    },
];

export default function MembershipSettingsPage() {
    const { tiers, members, productDiscounts, products, promotions, memberFilters, discountFilters, flash } = usePage<PageProps>().props;

    const { alertConfig, showAlert, closeAlert } = useAlertModal();

    const {
        memberSearch,
        setMemberSearch,
        memberTierIds,
        memberStatus,
        discountSearch,
        setDiscountSearch,
        discountTierIds,
        handleMemberTierChange,
        handleDiscountTierChange,
        handleMemberStatusChange,
        updateMemberFilters,
        updateDiscountFilters,
    } = useMembershipFilters({
        initialMemberFilters: memberFilters ?? {},
        initialDiscountFilters: discountFilters ?? {},
    });

    const {
        loading: tierLoading,
        showForm: showTierForm,
        editingTier,
        form: tierForm,
        setForm: setTierForm,
        openCreateForm: openCreateTierForm,
        openEditForm: openEditTierForm,
        cancelForm: cancelTierForm,
        saveTier,
        deleteConfirmOpen: deleteTierConfirmOpen,
        tierToDelete,
        requestDeleteTier,
        closeDeleteConfirm: closeDeleteTierConfirm,
        confirmDeleteTier,
    } = useTierManagement({ showAlert });

    const {
        loading: memberLoading,
        showForm: showMemberForm,
        editingMember,
        form: memberForm,
        setForm: setMemberForm,
        openCreateForm: openCreateMemberForm,
        openEditForm: openEditMemberForm,
        cancelForm: cancelMemberForm,
        saveMember,
        deleteConfirmOpen: deleteMemberConfirmOpen,
        memberToDelete,
        requestDeleteMember,
        closeDeleteConfirm: closeDeleteMemberConfirm,
        confirmDeleteMember,
    } = useMemberManagement({ showAlert });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Membership Settings" />

            <div className="min-h-screen space-y-8 bg-blue-50/20 dark:bg-blue-950/10 pb-20 pt-8 px-4 sm:px-6 lg:px-8">
                {/* Flash message */}
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

                {/* Header */}
                <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                    <h1 className="flex items-center gap-3 text-2xl font-bold text-gray-900 dark:text-white md:text-3xl">
                        <CreditCard className="h-8 w-8 text-indigo-600 md:h-10 md:w-10" />
                        Membership Management
                    </h1>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        Kelola tier keanggotaan, data member, dan diskon produk khusus.
                    </p>
                </section>

                {/* Tiers */}
                <TierManagementSection
                    tiers={tiers ?? []}
                    loading={tierLoading}
                    showForm={showTierForm}
                    editingTier={editingTier}
                    form={tierForm}
                    setForm={setTierForm}
                    openCreateForm={openCreateTierForm}
                    openEditForm={openEditTierForm}
                    cancelForm={cancelTierForm}
                    saveTier={saveTier}
                    requestDeleteTier={requestDeleteTier}
                />

                {/* Members */}
                <MemberManagementSection
                    members={members}
                    tiers={tiers ?? []}
                    loading={memberLoading}
                    showForm={showMemberForm}
                    editingMember={editingMember}
                    form={memberForm}
                    setForm={setMemberForm}
                    openCreateForm={openCreateMemberForm}
                    openEditForm={openEditMemberForm}
                    cancelForm={cancelMemberForm}
                    saveMember={saveMember}
                    requestDeleteMember={requestDeleteMember}
                    memberSearch={memberSearch}
                    setMemberSearch={setMemberSearch}
                    memberTierIds={memberTierIds}
                    memberStatus={memberStatus}
                    onMemberTierChange={handleMemberTierChange}
                    onMemberStatusChange={handleMemberStatusChange}
                    updateMemberFilters={updateMemberFilters}
                />

                {/* Product Discounts */}
                <ProductDiscountSection
                    productDiscounts={productDiscounts}
                    tiers={tiers ?? []}
                    products={products ?? []}
                    showAlert={showAlert}
                    discountSearch={discountSearch}
                    setDiscountSearch={setDiscountSearch}
                    discountTierIds={discountTierIds}
                    onDiscountTierChange={handleDiscountTierChange}
                    updateDiscountFilters={updateDiscountFilters}
                />

                {/* Promotions BXGY */}
                <PromotionSection
                    promotions={promotions ?? []}
                    tiers={tiers ?? []}
                    products={products ?? []}
                    showAlert={showAlert}
                />

                {/* Alert modal */}
                <AlertModal
                    isOpen={alertConfig.isOpen}
                    onClose={closeAlert}
                    title={alertConfig.title}
                    message={alertConfig.message}
                    type={alertConfig.type}
                />

                {/* Delete tier confirm */}
                <AlertModal
                    isOpen={deleteTierConfirmOpen}
                    onClose={closeDeleteTierConfirm}
                    title="Hapus Tier?"
                    message={`Tier "${tierToDelete?.name ?? ''}" akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.`}
                    type="warning"
                    primaryButtonText="Ya, hapus"
                    onPrimaryClick={confirmDeleteTier}
                    secondaryButtonText="Batal"
                    onSecondaryClick={closeDeleteTierConfirm}
                />

                {/* Deactivate member confirm */}
                <AlertModal
                    isOpen={deleteMemberConfirmOpen}
                    onClose={closeDeleteMemberConfirm}
                    title="Nonaktifkan Member?"
                    message={`Member "${memberToDelete?.name ?? ''}" akan dinonaktifkan. Anda dapat mengaktifkannya kembali kapan saja.`}
                    type="warning"
                    primaryButtonText="Ya, nonaktifkan"
                    onPrimaryClick={confirmDeleteMember}
                    secondaryButtonText="Batal"
                    onSecondaryClick={closeDeleteMemberConfirm}
                />
            </div>
        </AppLayout>
    );
}
