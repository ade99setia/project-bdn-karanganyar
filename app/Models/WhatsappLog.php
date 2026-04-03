<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WhatsappLog extends Model
{
    protected $table = 'whatsapp_logs';

    protected $fillable = [
        'device',
        'sender',
        'sender_name',
        'type',
        'keyword',
        'message',
        'payload',
        'http_status',
    ];

    protected $casts = [
        'payload' => 'array',
    ];
}