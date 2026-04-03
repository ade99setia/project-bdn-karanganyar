<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Actions\Whatsapp\DispatchIncomingMessage;

class WhatsappWebhookController extends Controller
{
    public function handle(Request $request, DispatchIncomingMessage $dispatch)
    {
        $dispatch->execute($request->all());
        return response()->json(['ok' => true]);
    }
}