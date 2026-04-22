<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PosTransaction extends Model
{
    protected $fillable = [
        'transaction_number',
        'warehouse_id',
        'cashier_id',
        'member_id',
        'shift_id',
        'subtotal',
        'total_discount',
        'grand_total',
        'payment_method',
        'cash_received',
        'cash_change',
        'status',
    ];

    protected $casts = [
        'subtotal' => 'float',
        'total_discount' => 'float',
        'grand_total' => 'float',
        'cash_received' => 'float',
        'cash_change' => 'float',
    ];

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function cashier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cashier_id');
    }

    public function member(): BelongsTo
    {
        return $this->belongsTo(Member::class);
    }

    public function shift(): BelongsTo
    {
        return $this->belongsTo(CashierShift::class, 'shift_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(PosTransactionItem::class);
    }

    public function stockMovements(): HasMany
    {
        return $this->hasMany(StockMovement::class, 'pos_transaction_id');
    }
}
