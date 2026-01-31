<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SalesVisitPhoto extends Model
{
    protected $fillable = [
        'sales_visit_id',
        'file_path',
        'taken_at',
        'lat',
        'lng',
        'exif_checked',
        'is_fake_gps',
    ];

    protected $casts = [
        'taken_at' => 'datetime',
        'exif_checked' => 'boolean',
        'is_fake_gps' => 'boolean',
    ];

    public function visit()
    {
        return $this->belongsTo(SalesVisit::class, 'sales_visit_id');
    }
}
