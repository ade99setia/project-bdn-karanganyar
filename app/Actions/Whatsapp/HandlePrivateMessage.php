<?php

namespace App\Actions\Whatsapp;

use App\DTO\IncomingWhatsappMessage;

class HandlePrivateMessage
{
    public function __construct(
        protected KeywordReplyAction $keywordReply
    ) {}

    public function execute(IncomingWhatsappMessage $message): void
    {
        $this->keywordReply->execute($message);
    }
}