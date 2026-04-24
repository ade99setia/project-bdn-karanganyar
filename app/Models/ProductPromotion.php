<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductPromotion extends Model
{
    protected $fillable = [
        'product_id',
        'membership_tier_id',
        'type',
        'buy_quantity',
        'free_quantity',
        'label',
        'is_active',
        'valid_from',
        'valid_until',
    ];

    protected $casts = [
        'is_active'   => 'boolean',
        'valid_from'  => 'date',
        'valid_until' => 'date',
    ];

    protected $appends = ['display_label'];

    public function getDisplayLabelAttribute(): string
    {
        if ($this->label) return $this->label;
        return "Beli {$this->buy_quantity} Gratis {$this->free_quantity}";
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function membershipTier(): BelongsTo
    {
        return $this->belongsTo(MembershipTier::class);
    }

    /** Apakah promo berlaku hari ini */
    public function isValid(): bool
    {
        if (!$this->is_active) return false;
        $today = now()->toDateString();
        if ($this->valid_from && $this->valid_from->toDateString() > $today) return false;
        if ($this->valid_until && $this->valid_until->toDateString() < $today) return false;
        return true;
    }

    /**
     * Hitung jumlah item gratis berdasarkan qty yang dibeli.
     * Contoh: beli 3 gratis 1 → beli 6 gratis 2
     */
    public function calculateFreeItems(int $quantity): int
    {
        if ($quantity < $this->buy_quantity) return 0;
        return (int) floor($quantity / $this->buy_quantity) * $this->free_quantity;
    }
}
