<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MembershipTierProductDiscount extends Model
{
    protected $fillable = [
        'membership_tier_id',
        'product_id',
        'discount_percentage',
    ];

    protected $casts = [
        'discount_percentage' => 'float',
    ];

    public function membershipTier(): BelongsTo
    {
        return $this->belongsTo(MembershipTier::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
