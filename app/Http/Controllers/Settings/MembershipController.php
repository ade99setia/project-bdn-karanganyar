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
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MembershipController extends Controller
{
    /**
     * Show membership management page
     */
    public function index(): Response
    {
        $tiers = MembershipTier::withCount('members')->get();
        $members = Member::with('membershipTier')->where('is_active', true)->get();
        $productDiscounts = MembershipTierProductDiscount::with(['membershipTier', 'product'])->get();

        return Inertia::render('settings/membership/index', [
            'tiers' => $tiers,
            'members' => $members,
            'productDiscounts' => $productDiscounts,
        ]);
    }

    // ========== Membership Tiers ==========

    /**
     * Store new membership tier
     */
    public function storeTier(StoreTierRequest $request): RedirectResponse
    {
        MembershipTier::create($request->validated());

        return redirect()->back()->with('success', 'Tier membership berhasil ditambahkan');
    }

    /**
     * Update membership tier
     */
    public function updateTier(UpdateTierRequest $request, MembershipTier $tier): RedirectResponse
    {
        $tier->update($request->validated());

        return redirect()->back()->with('success', 'Tier membership berhasil diupdate');
    }

    /**
     * Delete membership tier
     */
    public function destroyTier(MembershipTier $tier): RedirectResponse
    {
        // Check if tier has members
        if ($tier->members()->count() > 0) {
            return redirect()->back()->withErrors(['error' => 'Tidak dapat menghapus tier yang masih memiliki member']);
        }

        $tier->delete();

        return redirect()->back()->with('success', 'Tier membership berhasil dihapus');
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
    public function storeMember(StoreMemberRequest $request): RedirectResponse
    {
        // Generate member number if not provided
        $data = $request->validated();
        
        if (empty($data['member_number'])) {
            $data['member_number'] = $this->generateMemberNumber();
        }

        Member::create($data);

        return redirect()->back()->with('success', 'Member berhasil ditambahkan');
    }

    /**
     * Update member
     */
    public function updateMember(UpdateMemberRequest $request, Member $member): RedirectResponse
    {
        $member->update($request->validated());

        return redirect()->back()->with('success', 'Member berhasil diupdate');
    }

    /**
     * Deactivate/delete member
     */
    public function destroyMember(Member $member): RedirectResponse
    {
        // Soft delete by deactivating
        $member->update(['is_active' => false]);

        return redirect()->back()->with('success', 'Member berhasil dinonaktifkan');
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
}
