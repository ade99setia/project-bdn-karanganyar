<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PosTransactionItem extends Model
{
    protected $fillable = [
        'pos_transaction_id',
        'product_id',
        'quantity',
        'unit_price',
        'discount_percentage',
        'discount_amount',
        'subtotal',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'unit_price' => 'float',
        'discount_percentage' => 'float',
        'discount_amount' => 'float',
        'subtotal' => 'float',
    ];

    public function transaction(): BelongsTo
    {
        return $this->belongsTo(PosTransaction::class, 'pos_transaction_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
