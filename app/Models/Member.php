<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Member extends Model
{
    protected $fillable = [
        'user_id',
        'membership_tier_id',
        'member_number',
        'name',
        'phone',
        'email',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    protected $appends = ['status'];

    public function getStatusAttribute(): string
    {
        return $this->is_active ? 'active' : 'inactive';
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function membershipTier(): BelongsTo
    {
        return $this->belongsTo(MembershipTier::class);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(PosTransaction::class);
    }
}
