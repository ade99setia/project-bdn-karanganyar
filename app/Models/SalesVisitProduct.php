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
        'action_type',
        'note',
    ];

    public function visit()
    {
        return $this->belongsTo(SalesVisit::class, 'sales_visit_id');
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
