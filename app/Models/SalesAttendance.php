<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\User;


class SalesAttendance extends Model
{
    protected $fillable = [
        'user_id',
        'work_date',
        'check_in_at',
        'check_out_at',
        'check_in_lat',
        'check_in_lng',
        'check_out_lat',
        'check_out_lng',
        'check_in_address',
        'check_out_address',
        'device_id',
        'is_fake_gps',
        'fake_gps_note',
    ];

    protected $casts = [
        'work_date' => 'date',
        'check_in_at' => 'datetime',
        'check_out_at' => 'datetime',
        'is_fake_gps' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function visits()
    {
        return $this->hasMany(SalesVisit::class);
    }
}
