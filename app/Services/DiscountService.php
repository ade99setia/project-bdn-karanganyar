<?php

namespace App\Services;

use App\Models\Member;
use App\Models\MembershipTier;
use App\Models\MembershipTierProductDiscount;
use App\Models\ProductPromotion;
use Illuminate\Support\Collection;

class DiscountService
{
    /**
     * Calculate discounts for cart items based on member tier.
     * Also applies BXGY promotions (for all customers or tier-specific).
     */
    public function calculateDiscounts(array $cartItems, ?int $memberId): array
    {
        $memberTier = $memberId ? $this->getMemberTier($memberId) : null;

        return array_map(function ($item) use ($memberTier) {
            $productId = $item['product_id'];
            $quantity  = $item['quantity'];
            $unitPrice = $item['unit_price'];

            // 1. Check BXGY promotion (tier-specific first, then all-customer)
            $promo = $this->getActivePromotion($productId, $memberTier?->id);

            if ($promo) {
                $freeItems   = $promo->calculateFreeItems($quantity);
                $discountAmt = $freeItems * $unitPrice;
                $discountPct = $quantity > 0 ? round(($discountAmt / ($unitPrice * $quantity)) * 100, 2) : 0;

                $item['discount_percentage'] = $discountPct;
                $item['discount_amount']     = $discountAmt;
                $item['promo_label']         = $promo->display_label;
                $item['free_items']          = $freeItems;
                return $item;
            }

            // 2. Membership percentage discount
            if ($memberTier) {
                $discountPct = $this->getProductDiscount($productId, $memberTier->id);
                $discountAmt = $unitPrice * $quantity * ($discountPct / 100);

                $item['discount_percentage'] = $discountPct;
                $item['discount_amount']     = $discountAmt;
                $item['promo_label']         = null;
                $item['free_items']          = 0;
                return $item;
            }

            // 3. No discount
            $item['discount_percentage'] = 0.00;
            $item['discount_amount']     = 0.00;
            $item['promo_label']         = null;
            $item['free_items']          = 0;
            return $item;
        }, $cartItems);
    }

    /**
     * Get active BXGY promotion for a product.
     * Priority: tier-specific > all-customer (membership_tier_id IS NULL)
     */
    public function getActivePromotion(int $productId, ?int $tierId): ?ProductPromotion
    {
        $today = now()->toDateString();

        $base = ProductPromotion::where('product_id', $productId)
            ->where('is_active', true)
            ->where(fn ($q) => $q->whereNull('valid_from')->orWhereDate('valid_from', '<=', $today))
            ->where(fn ($q) => $q->whereNull('valid_until')->orWhereDate('valid_until', '>=', $today));

        // Tier-specific first
        if ($tierId) {
            $tierPromo = (clone $base)->where('membership_tier_id', $tierId)->first();
            if ($tierPromo) return $tierPromo;
        }

        // All-customer promo
        return (clone $base)->whereNull('membership_tier_id')->first();
    }

    /**
     * Get discount percentage for specific product and member tier.
     * Priority: specific product discount > default tier discount > 0%
     */
    public function getProductDiscount(int $productId, int $membershipTierId): float
    {
        $today = now()->toDateString();

        $specificDiscount = MembershipTierProductDiscount::where('membership_tier_id', $membershipTierId)
            ->where('product_id', $productId)
            ->where('is_active', true)
            ->where(fn ($q) => $q->whereNull('valid_from')->orWhereDate('valid_from', '<=', $today))
            ->where(fn ($q) => $q->whereNull('valid_until')->orWhereDate('valid_until', '>=', $today))
            ->first();

        if ($specificDiscount) {
            return $specificDiscount->discount_percentage;
        }

        $tier = MembershipTier::find($membershipTierId);

        if ($tier && $tier->applies_to_all_products) {
            return $tier->default_discount_percentage;
        }

        return 0.00;
    }

    /**
     * Get member tier with discount rules.
     */
    public function getMemberTier(int $memberId): ?MembershipTier
    {
        $member = Member::with('membershipTier')->find($memberId);

        if (!$member || !$member->is_active) {
            return null;
        }

        return $member->membershipTier;
    }
}
