<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class KioskToken extends Model
{
    use HasFactory;

    protected $table = 'kiosk_tokens';

    protected $fillable = [
        'user_id',
        'token',
        'active',
        'expired_at',
        'ip',
    ];

    protected $casts = [
        'active' => 'boolean',
        'expired_at' => 'datetime',
    ];

    protected $hidden = [
        'token',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function scopeValid($query)
    {
        return $query
            ->where('active', true)
            ->where(function ($q) {
                $q->whereNull('expired_at')
                    ->orWhere('expired_at', '>', now());
            });
    }

    public static function generateToken(): string
    {
        return hash('sha256', Str::random(60));
    }

    public function isExpired(): bool
    {
        return $this->expired_at && $this->expired_at->isPast();
    }
}
