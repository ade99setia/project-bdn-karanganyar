import { router } from '@inertiajs/react';
import { useCallback, useEffect, useState } from 'react';
import type { DiscountFilters, MemberFilters } from '../types';

interface UseMembershipFiltersParams {
    initialMemberFilters: MemberFilters;
    initialDiscountFilters: DiscountFilters;
}

// Helper: build tier_ids param (undefined if empty, single number if 1, array if many)
const tierParam = (ids: Array<string | number>) =>
    ids.length === 0 ? undefined : ids.length === 1 ? Number(ids[0]) : ids.map(Number);

export function useMembershipFilters({ initialMemberFilters, initialDiscountFilters }: UseMembershipFiltersParams) {
    const [memberSearch, setMemberSearch] = useState(initialMemberFilters.search ?? '');
    const [memberTierIds, setMemberTierIds] = useState<string[]>(
        initialMemberFilters.tier_ids?.map(String) ?? []
    );
    const [memberStatus, setMemberStatus] = useState(initialMemberFilters.status ?? '');

    const [discountSearch, setDiscountSearch] = useState(initialDiscountFilters.search ?? '');
    const [discountTierIds, setDiscountTierIds] = useState<string[]>(
        initialDiscountFilters.tier_ids?.map(String) ?? []
    );

    const buildParams = (
        mSearch: string,
        mTiers: string[],
        mStatus: string,
        mPage: number | undefined,
        dSearch: string,
        dTiers: string[],
        dPage: number | undefined,
    ) => ({
        member_search: mSearch || undefined,
        member_tier_ids: tierParam(mTiers),
        member_status: mStatus || undefined,
        member_page: mPage,
        discount_search: dSearch || undefined,
        discount_tier_ids: tierParam(dTiers),
        discount_page: dPage,
    });

    const updateMemberFilters = useCallback(
        (overrides: MemberFilters = {}) => {
            router.get(
                '/settings/membership',
                buildParams(
                    overrides.search ?? memberSearch,
                    memberTierIds,
                    overrides.status ?? memberStatus,
                    overrides.page,
                    discountSearch,
                    discountTierIds,
                    undefined,
                ),
                { preserveState: true, replace: true, preserveScroll: true }
            );
        },
        [memberSearch, memberTierIds, memberStatus, discountSearch, discountTierIds]
    );

    const updateDiscountFilters = useCallback(
        (overrides: DiscountFilters = {}) => {
            router.get(
                '/settings/membership',
                buildParams(
                    memberSearch,
                    memberTierIds,
                    memberStatus,
                    undefined,
                    overrides.search ?? discountSearch,
                    discountTierIds,
                    overrides.page,
                ),
                { preserveState: true, replace: true, preserveScroll: true }
            );
        },
        [memberSearch, memberTierIds, memberStatus, discountSearch, discountTierIds]
    );

    // Debounce member search
    useEffect(() => {
        const t = setTimeout(() => {
            if ((initialMemberFilters.search ?? '') !== memberSearch) {
                router.get(
                    '/settings/membership',
                    buildParams(memberSearch, memberTierIds, memberStatus, 1, discountSearch, discountTierIds, undefined),
                    { preserveState: true, replace: true, preserveScroll: true }
                );
            }
        }, 450);
        return () => clearTimeout(t);
    }, [memberSearch]); // eslint-disable-line react-hooks/exhaustive-deps

    // Debounce discount search
    useEffect(() => {
        const t = setTimeout(() => {
            if ((initialDiscountFilters.search ?? '') !== discountSearch) {
                router.get(
                    '/settings/membership',
                    buildParams(memberSearch, memberTierIds, memberStatus, undefined, discountSearch, discountTierIds, 1),
                    { preserveState: true, replace: true, preserveScroll: true }
                );
            }
        }, 450);
        return () => clearTimeout(t);
    }, [discountSearch]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleMemberTierChange = (ids: string[]) => {
        setMemberTierIds(ids);
        router.get(
            '/settings/membership',
            buildParams(memberSearch, ids, memberStatus, 1, discountSearch, discountTierIds, undefined),
            { preserveState: true, replace: true, preserveScroll: true }
        );
    };

    const handleDiscountTierChange = (ids: string[]) => {
        setDiscountTierIds(ids);
        router.get(
            '/settings/membership',
            buildParams(memberSearch, memberTierIds, memberStatus, undefined, discountSearch, ids, 1),
            { preserveState: true, replace: true, preserveScroll: true }
        );
    };

    const handleMemberStatusChange = (status: string) => {
        setMemberStatus(status);
        router.get(
            '/settings/membership',
            buildParams(memberSearch, memberTierIds, status, 1, discountSearch, discountTierIds, undefined),
            { preserveState: true, replace: true, preserveScroll: true }
        );
    };

    return {
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
    };
}
