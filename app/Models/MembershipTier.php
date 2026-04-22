<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MembershipTier extends Model
{
    protected $fillable = [
        'name',
        'description',
        'default_discount_percentage',
        'applies_to_all_products',
    ];

    protected $casts = [
        'default_discount_percentage' => 'float',
        'applies_to_all_products' => 'boolean',
    ];

    public function members(): HasMany
    {
        return $this->hasMany(Member::class);
    }

    public function productDiscounts(): HasMany
    {
        return $this->hasMany(MembershipTierProductDiscount::class);
    }
}
