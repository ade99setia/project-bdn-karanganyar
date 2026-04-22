<?php

namespace App\Services;

use App\Models\Member;
use App\Models\MembershipTier;
use App\Models\MembershipTierProductDiscount;
use Illuminate\Support\Collection;

class DiscountService
{
    /**
     * Calculate discounts for cart items based on member tier
     * 
     * @param array $cartItems Array of items with product_id, quantity, unit_price
     * @param int|null $memberId Member ID or null for non-member
     * @return array Array with items including discount_percentage and discount_amount
     */
    public function calculateDiscounts(array $cartItems, ?int $memberId): array
    {
        if (!$memberId) {
            // No member, no discounts
            return array_map(function ($item) {
                $item['discount_percentage'] = 0.00;
                $item['discount_amount'] = 0.00;
                return $item;
            }, $cartItems);
        }

        $memberTier = $this->getMemberTier($memberId);
        
        if (!$memberTier) {
            // Member not found or inactive, no discounts
            return array_map(function ($item) {
                $item['discount_percentage'] = 0.00;
                $item['discount_amount'] = 0.00;
                return $item;
            }, $cartItems);
        }

        // Calculate discount for each item
        return array_map(function ($item) use ($memberTier) {
            $discountPercentage = $this->getProductDiscount($item['product_id'], $memberTier->id);
            $discountAmount = $item['unit_price'] * $item['quantity'] * ($discountPercentage / 100);
            
            $item['discount_percentage'] = $discountPercentage;
            $item['discount_amount'] = $discountAmount;
            
            return $item;
        }, $cartItems);
    }

    /**
     * Get discount percentage for specific product and member tier
     * Priority: specific product discount > default tier discount > 0%
     * 
     * @param int $productId
     * @param int $membershipTierId
     * @return float Discount percentage
     */
    public function getProductDiscount(int $productId, int $membershipTierId): float
    {
        // Check for product-specific discount
        $specificDiscount = MembershipTierProductDiscount::where('membership_tier_id', $membershipTierId)
            ->where('product_id', $productId)
            ->first();

        if ($specificDiscount) {
            return $specificDiscount->discount_percentage;
        }

        // Check if tier applies to all products
        $tier = MembershipTier::find($membershipTierId);
        
        if ($tier && $tier->applies_to_all_products) {
            return $tier->default_discount_percentage;
        }

        // No discount
        return 0.00;
    }

    /**
     * Get member tier with discount rules
     * 
     * @param int $memberId
     * @return MembershipTier|null
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
