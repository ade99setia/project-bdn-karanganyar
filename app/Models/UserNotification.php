<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserNotification extends Model
{
    use HasFactory;

    public const STATUS_UNREAD = 'unread';
    public const STATUS_READ = 'read';
    public const STATUS_ARCHIVED = 'archived';

    public const CHANNEL_IN_APP = 'in_app';
    public const CHANNEL_PUSH = 'push';
    public const CHANNEL_EMAIL = 'email';

    public const PRIORITY_LOW = 'low';
    public const PRIORITY_NORMAL = 'normal';
    public const PRIORITY_HIGH = 'high';

    protected $fillable = [
        'user_id',
        'type',
        'title',
        'message',
        'data',
        'action_url',
        'status',
        'channel',
        'priority',
        'expires_at',
        'read_at',
        'sent_at',
    ];

    protected $casts = [
        'data' => 'array',
        'expires_at' => 'datetime',
        'read_at' => 'datetime',
        'sent_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function scopeVisible($query)
    {
        return $query->where(function ($q) {
            $q->whereNull('expires_at')
                ->orWhere('expires_at', '>', now());
        });
    }

    public function setActionUrlAttribute($value): void
    {
        $this->attributes['action_url'] = self::normalizeActionUrl($value);
    }

    public function getSafeActionUrlAttribute(): ?string
    {
        return self::normalizeActionUrl($this->action_url);
    }

    private static function normalizeActionUrl($url): ?string
    {
        if (!is_string($url) || $url === '') {
            return $url;
        }

        if (preg_match('#^/sales/notifications/\d+/read$#', $url)) {
            return '/sales/notifications';
        }

        return $url;
    }
}
