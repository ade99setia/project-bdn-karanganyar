<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CashierShift extends Model
{
    protected $fillable = [
        'warehouse_id',
        'cashier_id',
        'opened_at',
        'closed_at',
        'opening_balance',
        'closing_balance',
        'expected_cash',
        'actual_cash',
        'difference',
        'status',
    ];

    protected $casts = [
        'opened_at' => 'datetime',
        'closed_at' => 'datetime',
        'opening_balance' => 'float',
        'closing_balance' => 'float',
        'expected_cash' => 'float',
        'actual_cash' => 'float',
        'difference' => 'float',
    ];

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function cashier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cashier_id');
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(PosTransaction::class, 'shift_id');
    }
}
