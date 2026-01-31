<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SalesGpsLog extends Model
{
    protected $fillable = [
        'user_id',
        'recorded_at',
        'lat',
        'lng',
        'accuracy',
        'provider',
        'is_mocked',
    ];

    protected $casts = [
        'recorded_at' => 'datetime',
        'is_mocked' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
