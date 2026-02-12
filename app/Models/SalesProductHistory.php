<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class SalesProductHistory extends Model
{
    use HasFactory;

    protected $fillable = [
        'sales_visit_id',
        'product_id',
        'customer_id',
        'user_id',
        'action_type',
        'quantity',
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

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
