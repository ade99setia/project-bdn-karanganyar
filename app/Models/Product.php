<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Product extends Model
{
    use HasFactory;
    protected $guarded = ['id'];

    protected $fillable = [
        'name',
        'file_path',
        'sku',
        'category',
        'description',
        'price',
        'is_active',
    ];

    protected $casts = [
        'price' => 'integer',
        'is_active' => 'boolean',
    ];

    public function visitItems()
    {
        return $this->hasMany(SalesVisitProduct::class);
    }

    public function histories()
    {
        return $this->hasMany(SalesProductHistory::class);
    }
}
