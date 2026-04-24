<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreMemberRequest;
use App\Http\Requests\StoreProductDiscountRequest;
use App\Http\Requests\StoreTierRequest;
use App\Http\Requests\UpdateMemberRequest;
use App\Http\Requests\UpdateTierRequest;
use App\Models\Member;
use App\Models\MembershipTier;
use App\Models\MembershipTierProductDiscount;
use App\Models\Product;
use App\Models\ProductPromotion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MembershipController extends Controller
{
    /**
     * Show membership management page
     */
    public function index(Request $request): Response
    {
        $tiers = MembershipTier::withCount('members')->get();

        // Member filters
        $memberSearch  = $request->input('member_search');
        $memberTierIds = array_filter((array) $request->input('member_tier_ids', []));
        $memberStatus  = $request->input('member_status');
        $memberPage    = max(1, (int) $request->input('member_page', 1));

        $membersQuery = Member::with('membershipTier')
            ->when($memberStatus === 'active', fn ($q) => $q->where('is_active', true))
            ->when($memberStatus === 'inactive', fn ($q) => $q->where('is_active', false))
            ->when(!$memberStatus || $memberStatus === 'all', fn ($q) => $q->where('is_active', true))
            ->when(count($memberTierIds) > 0, fn ($q) => $q->whereIn('membership_tier_id', $memberTierIds))
            ->when($memberSearch, fn ($q) => $q->where(function ($q) use ($memberSearch) {
                $q->where('name', 'like', "%{$memberSearch}%")
                  ->orWhere('member_number', 'like', "%{$memberSearch}%")
                  ->orWhere('phone', 'like', "%{$memberSearch}%")
                  ->orWhere('email', 'like', "%{$memberSearch}%");
            }))
            ->orderBy('name');

        $members = $membersQuery->paginate(15, ['*'], 'member_page', $memberPage)
            ->withQueryString();

        // Product discount filters
        $discountSearch  = $request->input('discount_search');
        $discountTierIds = array_filter((array) $request->input('discount_tier_ids', []));
        $discountPage    = max(1, (int) $request->input('discount_page', 1));

        $discountsQuery = MembershipTierProductDiscount::with(['membershipTier', 'product'])
            ->when(count($discountTierIds) > 0, fn ($q) => $q->whereIn('membership_tier_id', $discountTierIds))
            ->when($discountSearch, fn ($q) => $q->whereHas('product', function ($q) use ($discountSearch) {
                $q->where('name', 'like', "%{$discountSearch}%")
                  ->orWhere('sku', 'like', "%{$discountSearch}%");
            }));

        $productDiscounts = $discountsQuery->paginate(15, ['*'], 'discount_page', $discountPage)
            ->withQueryString();

        return Inertia::render('settings/membership/index', [
            'tiers'            => $tiers,
            'products'         => Product::orderBy('name')->get(['id', 'name', 'sku']),
            'members'          => $members,
            'productDiscounts' => $productDiscounts,
            'promotions'       => ProductPromotion::with(['product', 'membershipTier'])
                ->orderBy('created_at', 'desc')
                ->get(),
            'memberFilters'   => [
                'search'   => $memberSearch,
                'tier_ids' => array_values($memberTierIds),
                'status'   => $memberStatus,
                'page'     => $memberPage,
            ],
            'discountFilters' => [
                'search'   => $discountSearch,
                'tier_ids' => array_values($discountTierIds),
                'page'     => $discountPage,
            ],
        ]);
    }

    // ========== Membership Tiers ==========

    /**
     * Store new membership tier
     */
    public function storeTier(StoreTierRequest $request): JsonResponse
    {
        $tier = MembershipTier::create($request->validated());

        return response()->json(['success' => true, 'tier' => $tier, 'message' => 'Tier membership berhasil ditambahkan']);
    }

    /**
     * Update membership tier
     */
    public function updateTier(UpdateTierRequest $request, MembershipTier $tier): JsonResponse
    {
        $tier->update($request->validated());

        return response()->json(['success' => true, 'tier' => $tier, 'message' => 'Tier membership berhasil diupdate']);
    }

    /**
     * Delete membership tier
     */
    public function destroyTier(MembershipTier $tier): JsonResponse
    {
        if ($tier->members()->count() > 0) {
            return response()->json(['error' => 'Tidak dapat menghapus tier yang masih memiliki member'], 422);
        }

        $tier->delete();

        return response()->json(['success' => true, 'message' => 'Tier membership berhasil dihapus']);
    }

    // ========== Product-Specific Discounts ==========

    /**
     * List product discounts for a tier
     */
    public function indexProductDiscounts(MembershipTier $tier): JsonResponse
    {
        $discounts = $tier->productDiscounts()->with('product')->get();

        return response()->json($discounts);
    }

    /**
     * Store product-specific discount
     */
    public function storeProductDiscount(StoreProductDiscountRequest $request): JsonResponse
    {
        $discount = MembershipTierProductDiscount::create($request->validated());

        return response()->json([
            'success' => true,
            'discount' => $discount->load('product'),
            'message' => 'Diskon produk berhasil ditambahkan',
        ]);
    }

    /**
     * Update product-specific discount
     */
    public function updateProductDiscount(Request $request, MembershipTierProductDiscount $discount): JsonResponse
    {
        $validated = $request->validate([
            'membership_tier_id'  => 'required|exists:membership_tiers,id',
            'product_id'          => 'required|exists:products,id',
            'discount_percentage' => 'required|numeric|min:0|max:100',
            'is_active'           => 'boolean',
            'valid_from'          => 'nullable|date',
            'valid_until'         => 'nullable|date|after_or_equal:valid_from',
        ]);

        $discount->update($validated);

        return response()->json([
            'success'  => true,
            'discount' => $discount->load(['membershipTier', 'product']),
            'message'  => 'Diskon produk berhasil diupdate',
        ]);
    }

    /**
     * Delete product-specific discount
     */
    public function destroyProductDiscount(MembershipTierProductDiscount $discount): JsonResponse
    {
        $discount->delete();

        return response()->json([
            'success' => true,
            'message' => 'Diskon produk berhasil dihapus',
        ]);
    }
    // ========== Members ==========

    /**
     * Store new member
     */
    public function storeMember(StoreMemberRequest $request): JsonResponse
    {
        $data = $request->validated();

        if (empty($data['member_number'])) {
            $data['member_number'] = $this->generateMemberNumber();
        }

        $member = Member::create($data);

        return response()->json(['success' => true, 'member' => $member, 'message' => 'Member berhasil ditambahkan']);
    }

    /**
     * Update member
     */
    public function updateMember(UpdateMemberRequest $request, Member $member): JsonResponse
    {
        $member->update($request->validated());

        return response()->json(['success' => true, 'member' => $member, 'message' => 'Member berhasil diupdate']);
    }

    /**
     * Deactivate/delete member
     */
    public function destroyMember(Member $member): JsonResponse
    {
        $member->update(['is_active' => false]);

        return response()->json(['success' => true, 'message' => 'Member berhasil dinonaktifkan']);
    }

    /**
     * Search members
     */
    public function searchMembers(Request $request): JsonResponse
    {
        $query = $request->input('query', '');

        $members = Member::with('membershipTier')
            ->where('is_active', true)
            ->when($query !== '', function ($q) use ($query) {
                $q->where(function ($q) use ($query) {
                    $q->where('name', 'like', "%{$query}%")
                      ->orWhere('member_number', 'like', "%{$query}%")
                      ->orWhere('phone', 'like', "%{$query}%");
                });
            })
            ->limit(20)
            ->get();

        return response()->json($members);
    }

    /**
     * Generate unique member number
     */
    private function generateMemberNumber(): string
    {
        $prefix = 'MBR';
        $date = now()->format('Ymd');
        
        $lastMember = Member::where('member_number', 'like', "{$prefix}{$date}%")
            ->orderBy('member_number', 'desc')
            ->first();

        if ($lastMember) {
            $lastSequence = (int) substr($lastMember->member_number, -4);
            $newSequence = $lastSequence + 1;
        } else {
            $newSequence = 1;
        }

        return $prefix . $date . str_pad($newSequence, 4, '0', STR_PAD_LEFT);
    }

    // ========== Product Promotions (BXGY) ==========

    public function storePromotion(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'product_id'         => 'required|exists:products,id',
            'membership_tier_id' => 'nullable|exists:membership_tiers,id',
            'buy_quantity'       => 'required|integer|min:1',
            'free_quantity'      => 'required|integer|min:1',
            'label'              => 'nullable|string|max:100',
            'is_active'          => 'boolean',
            'valid_from'         => 'nullable|date',
            'valid_until'        => 'nullable|date|after_or_equal:valid_from',
        ]);

        $validated['type'] = 'bxgy';
        $promo = ProductPromotion::create($validated);

        return response()->json([
            'success'   => true,
            'promotion' => $promo->load(['product', 'membershipTier']),
            'message'   => 'Promo berhasil ditambahkan',
        ]);
    }

    public function updatePromotion(Request $request, ProductPromotion $promotion): JsonResponse
    {
        $validated = $request->validate([
            'product_id'         => 'required|exists:products,id',
            'membership_tier_id' => 'nullable|exists:membership_tiers,id',
            'buy_quantity'       => 'required|integer|min:1',
            'free_quantity'      => 'required|integer|min:1',
            'label'              => 'nullable|string|max:100',
            'is_active'          => 'boolean',
            'valid_from'         => 'nullable|date',
            'valid_until'        => 'nullable|date|after_or_equal:valid_from',
        ]);

        $promotion->update($validated);

        return response()->json([
            'success'   => true,
            'promotion' => $promotion->load(['product', 'membershipTier']),
            'message'   => 'Promo berhasil diupdate',
        ]);
    }

    public function destroyPromotion(ProductPromotion $promotion): JsonResponse
    {
        $promotion->delete();

        return response()->json(['success' => true, 'message' => 'Promo berhasil dihapus']);
    }
}
