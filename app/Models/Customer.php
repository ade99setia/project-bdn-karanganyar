<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Customer extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'phone', 'email', 'address', 'lat', 'lng', 'notes'];

    protected $casts = [
        // Pastikan ini double atau decimal agar presisi tidak hilang
        'lat' => 'double',
        'lng' => 'double',
    ];

    public function visits()
    {
        return $this->hasMany(SalesVisit::class);
    }

    public function scopeNearby($query, $lat, $lng, $radius = 2)
    {
        $range = ($radius / 111) * 1.2;

        $query->whereBetween('lat', [$lat - $range, $lat + $range])
            ->whereBetween('lng', [$lng - $range, $lng + $range]);

        $driver = config('database.default');

        if ($driver === 'mysql' || $driver === 'pgsql') {
            $haversine = "(6371 * acos(
                        cos(radians(?)) 
                        * cos(radians(lat)) 
                        * cos(radians(lng) - radians(?)) 
                        + sin(radians(?)) 
                        * sin(radians(lat))
                      ))";

            return $query
                ->select('*')
                ->selectRaw("{$haversine} + 0 AS distance", [$lat, $lng, $lat])
                ->havingRaw("distance < ?", [$radius])
                ->orderBy('distance');
        }

        return $query;
    }
}
