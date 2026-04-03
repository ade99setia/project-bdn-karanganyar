<?php

namespace App\Actions\Whatsapp;

use Illuminate\Support\Str;
use App\DTO\IncomingWhatsappMessage;
use App\Models\WhatsappLog;

class DispatchIncomingMessage
{
    public function __construct(
        protected HandleGroupMessage $handleGroup,
        protected HandlePrivateMessage $handlePrivate
    ) {}

    public function execute(array $payload): void
    {
        $event = strtolower($payload['event'] ?? '');
        $event = str_replace('_', '.', $event);

        if ($event !== 'messages.upsert') {
            return;
        }

        $data = $payload['data'] ?? [];
        $messageData = $data['messages'][0] ?? $data[0] ?? $data;

        if (!$messageData || !isset($messageData['key'])) {
            return;
        }

        $remoteJid = $messageData['key']['remoteJid'] ?? '';
        $fromMe    = $messageData['key']['fromMe'] ?? false;

        if ($fromMe) {
            return;
        }

        $isGroup  = str_ends_with($remoteJid, '@g.us');
        $chatType = $isGroup ? 'group' : 'private';

        $messageContent = $messageData['message'] ?? [];
        $text = $messageContent['conversation']
            ?? $messageContent['extendedTextMessage']['text']
            ?? '';

        if (!$text) {
            return;
        }

        $dto = new IncomingWhatsappMessage(
            target: $remoteJid,
            text: $text,
            chatType: $chatType,
            isGroup: $isGroup,
            payload: $payload
        );

        WhatsappLog::create([
            'type' => 'incoming',
            'chat_type' => $chatType,
            'target' => $remoteJid,
            'message' => $text,
            'payload' => $payload,
            'http_status' => 200,
        ]);

        $isGroup
            ? $this->handleGroup->execute($dto)
            : $this->handlePrivate->execute($dto);
    }
}