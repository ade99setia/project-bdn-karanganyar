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
        'is_active',
        'valid_from',
        'valid_until',
    ];

    protected $casts = [
        'discount_percentage' => 'float',
        'is_active'           => 'boolean',
        'valid_from'          => 'date',
        'valid_until'         => 'date',
    ];

    public function isValid(): bool
    {
        if (!$this->is_active) return false;
        $today = now()->toDateString();
        if ($this->valid_from && $this->valid_from->toDateString() > $today) return false;
        if ($this->valid_until && $this->valid_until->toDateString() < $today) return false;
        return true;
    }

    public function membershipTier(): BelongsTo
    {
        return $this->belongsTo(MembershipTier::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
