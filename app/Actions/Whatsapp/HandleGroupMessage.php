<?php

namespace App\Actions\Whatsapp;

use App\DTO\IncomingWhatsappMessage;

class HandleGroupMessage
{
    public function __construct(
        protected KeywordReplyAction $keywordReply
    ) {}

    public function execute(IncomingWhatsappMessage $message): void
    {
        $allowedGroups = [
            '120363366728671096@g.us',
            '120363350533008538@g.us'
        ];

        if (!in_array($message->target, $allowedGroups)) {
            return;
        }

        $this->keywordReply->execute($message);
    }
}