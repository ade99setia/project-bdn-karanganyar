<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SalesVisit extends Model
{
    protected $fillable = [
        'user_id',
        'sales_attendance_id',
        'activity_type',
        'description',
        'visited_at',
        'lat',
        'lng',
        'address',
        'is_fake_gps',
        'fake_gps_score',
    ];

    protected $casts = [
        'visited_at' => 'datetime',
        'is_fake_gps' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function attendance()
    {
        return $this->belongsTo(SalesAttendance::class, 'sales_attendance_id');
    }

    public function photos()
    {
        return $this->hasMany(SalesVisitPhoto::class);
    }
}
