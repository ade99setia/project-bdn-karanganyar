<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class SalesVisitProduct extends Model
{
    use HasFactory;

    protected $fillable = [
        'sales_visit_id',
        'product_id',
        'quantity',
        'price',
        'value',
        'action_type',
        'note',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'price' => 'integer',
        'value' => 'integer',
    ];

    /*
    |--------------------------------------------------------------------------
    | RELATIONSHIPS
    |--------------------------------------------------------------------------
    */

    public function visit()
    {
        return $this->belongsTo(SalesVisit::class, 'sales_visit_id');
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    /*
    |--------------------------------------------------------------------------
    | ACTION TYPE CONSTANT (BEST PRACTICE)
    |--------------------------------------------------------------------------
    */

    public const ACTION_TERJUAL = 'terjual';
    public const ACTION_RETUR   = 'retur';

    /*
    |--------------------------------------------------------------------------
    | MODEL EVENTS
    |--------------------------------------------------------------------------
    */

    protected static function booted()
    {
        static::creating(function ($model) {
            if (is_null($model->price) && $model->product) {
                $model->price = $model->product->price ?? 0;
            }

            if (is_null($model->value) && !is_null($model->price) && !is_null($model->quantity)) {
                $model->value = $model->calculateSignedValue();
            }
        });

        static::updating(function ($model) {
            if ($model->isDirty(['quantity', 'price', 'action_type'])) {
                $model->value = $model->calculateSignedValue();
            }
        });
    }

    /*
    |--------------------------------------------------------------------------
    | HELPER METHODS
    |--------------------------------------------------------------------------
    */

    public function isTerjual(): bool
    {
        return in_array($this->action_type, [self::ACTION_TERJUAL, 'sold'], true);
    }

    public function isRetur(): bool
    {
        return in_array($this->action_type, [self::ACTION_RETUR, 'returned'], true);
    }

    public function isNegativeAction(): bool
    {
        return $this->isRetur();
    }

    public function calculateSignedValue(): int
    {
        $price = (int) ($this->price ?? 0);
        $quantity = (int) ($this->quantity ?? 0);
        $rawValue = $price * $quantity;

        return $this->isNegativeAction() ? -$rawValue : $rawValue;
    }
}
