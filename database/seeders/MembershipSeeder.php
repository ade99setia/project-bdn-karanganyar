<?php

namespace Database\Seeders;

use App\Models\Member;
use App\Models\MembershipTier;
use App\Models\MembershipTierProductDiscount;
use App\Models\Product;
use Illuminate\Database\Seeder;

class MembershipSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create membership tiers
        $bronze = MembershipTier::create([
            'name' => 'Bronze',
            'description' => 'Member Bronze mendapat diskon 3% untuk semua produk',
            'default_discount_percentage' => 3.00,
            'applies_to_all_products' => true,
        ]);

        $silver = MembershipTier::create([
            'name' => 'Silver',
            'description' => 'Member Silver mendapat diskon 5% untuk semua produk',
            'default_discount_percentage' => 5.00,
            'applies_to_all_products' => true,
        ]);

        $gold = MembershipTier::create([
            'name' => 'Gold',
            'description' => 'Member Gold mendapat diskon 10% untuk semua produk',
            'default_discount_percentage' => 10.00,
            'applies_to_all_products' => true,
        ]);

        // Create sample members
        Member::create([
            'membership_tier_id' => $bronze->id,
            'member_number' => 'MBR202604220001',
            'name' => 'John Doe',
            'phone' => '081234567890',
            'email' => 'john@example.com',
            'is_active' => true,
        ]);

        Member::create([
            'membership_tier_id' => $silver->id,
            'member_number' => 'MBR202604220002',
            'name' => 'Jane Smith',
            'phone' => '081234567891',
            'email' => 'jane@example.com',
            'is_active' => true,
        ]);

        Member::create([
            'membership_tier_id' => $gold->id,
            'member_number' => 'MBR202604220003',
            'name' => 'Bob Johnson',
            'phone' => '081234567892',
            'email' => 'bob@example.com',
            'is_active' => true,
        ]);

        // Create product-specific discounts (example)
        // Get first 3 products if they exist
        $products = Product::limit(3)->get();
        
        if ($products->count() >= 3) {
            // Gold members get extra 5% discount on first product (total 15%)
            MembershipTierProductDiscount::create([
                'membership_tier_id' => $gold->id,
                'product_id' => $products[0]->id,
                'discount_percentage' => 15.00,
            ]);

            // Silver members get extra 3% discount on second product (total 8%)
            MembershipTierProductDiscount::create([
                'membership_tier_id' => $silver->id,
                'product_id' => $products[1]->id,
                'discount_percentage' => 8.00,
            ]);
        }
    }
}
