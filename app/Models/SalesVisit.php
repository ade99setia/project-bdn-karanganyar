<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SalesVisit extends Model
{
    protected $guarded = ['id'];
    
    protected $fillable = [
        'user_id',
        'sales_attendance_id',
        'customer_id',
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

    protected static function booted(): void
    {
        // Auto-cache invalidation disabled - cache expires in 3 minutes
        // If needed, use: php artisan dashboard:clear-cache
    }

    private static function clearDashboardCache($userId): void
    {
        // This is now handled manually via dashboard:clear-cache command
    }

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
    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function products()
    {
        // return $this->hasMany(SalesVisitProduct::class);
        return $this->belongsToMany(Product::class, 'sales_visit_products')
            ->withPivot('quantity', 'action_type', 'note')
            ->withTimestamps();
    }

    public function productHistories()
    {
        return $this->hasMany(SalesProductHistory::class);
    }
}
