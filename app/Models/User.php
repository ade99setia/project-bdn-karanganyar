<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, TwoFactorAuthenticatable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'phone',
        'email',
        'password',
        'avatar',
        'role_id',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
        ];
    }

    public function getRoleNameAttribute(): ?string
    {
        if ($this->relationLoaded('role')) {
            return $this->getRelation('role')?->name;
        }

        if (array_key_exists('role', $this->attributes) && $this->attributes['role']) {
            return $this->attributes['role'];
        }

        return $this->role()?->value('name');
    }

    // Eloquent Relationships to Sales Models
    public function salesAttendances()
    {
        return $this->hasMany(SalesAttendance::class);
    }

    public function salesVisits()
    {
        return $this->hasMany(SalesVisit::class);
    }

    public function salesGpsLogs()
    {
        return $this->hasMany(SalesGpsLog::class);
    }

    public function salesAreas()
    {
        return $this->belongsToMany(SalesArea::class, 'sales_area_user');
    }

    public function productHistories()
    {
        return $this->hasMany(SalesProductHistory::class);
    }

    public function role()
    {
        return $this->belongsTo(Role::class);
    }

    public function employee()
    {
        return $this->hasOne(Employee::class);
    }

}
