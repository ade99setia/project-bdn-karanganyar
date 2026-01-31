<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SalesArea extends Model
{
    protected $fillable = [
        'name',
        'polygon_data',
    ];

    protected $casts = [
        'polygon_data' => 'array',
    ];

    public function users()
    {
        return $this->belongsToMany(User::class, 'sales_area_user');
    }
}
