export interface MembershipTier {
    id: number;
    name: string;
    default_discount_percentage: number;
    description?: string | null;
}

export interface Member {
    id: number;
    name: string;
    member_number: string;
    phone: string;
    email?: string | null;
    status: string;
    is_active: boolean;
    membership_tier_id?: number | null;
    membershipTier?: { id?: number; name: string } | null;
    membership_tier?: { id?: number; name: string } | null;
}

export interface ProductDiscount {
    id: number;
    discount_percentage: number;
    is_active: boolean;
    valid_from: string | null;
    valid_until: string | null;
    membership_tier_id?: number | null;
    membershipTier?: { id?: number; name: string } | null;
    membership_tier?: { id?: number; name: string } | null;
    product: {
        id?: number;
        name: string;
        sku: string;
    };
}

export interface Pagination<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

export interface MemberFilters {
    search?: string;
    tier_ids?: number[];
    status?: string;
    page?: number;
}

export interface DiscountFilters {
    search?: string;
    tier_ids?: number[];
    page?: number;
}

export const TIER_COLORS = [
    'bg-violet-50 text-violet-700 ring-violet-600/20 dark:bg-violet-500/10 dark:text-violet-400 dark:ring-violet-500/20',
    'bg-cyan-50 text-cyan-700 ring-cyan-600/20 dark:bg-cyan-500/10 dark:text-cyan-400 dark:ring-cyan-500/20',
    'bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-500/20',
    'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20',
    'bg-orange-50 text-orange-700 ring-orange-600/20 dark:bg-orange-500/10 dark:text-orange-400 dark:ring-orange-500/20',
    'bg-indigo-50 text-indigo-700 ring-indigo-600/20 dark:bg-indigo-500/10 dark:text-indigo-400 dark:ring-indigo-500/20',
];

export const getTierColor = (tierId: number | string | undefined | null, tiers: MembershipTier[]): string => {
    if (tierId == null || tierId === '') return TIER_COLORS[0];
    const id = Number(tierId);
    const idx = tiers.findIndex((t) => t.id === id);
    return TIER_COLORS[(idx >= 0 ? idx : 0) % TIER_COLORS.length];
};

export interface PageProps {
    tiers: MembershipTier[];
    products: Product[];
    members: Pagination<Member>;
    productDiscounts: Pagination<ProductDiscount>;
    promotions: import('./promotion-section').ProductPromotion[];
    memberFilters: MemberFilters;
    discountFilters: DiscountFilters;
    flash?: {
        success?: string;
        error?: string;
        warning?: string;
        info?: string;
    };
    [key: string]: unknown;
}

export interface Product {
    id: number;
    name: string;
    sku: string;
}
