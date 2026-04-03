<?php

namespace App\DTO;

class IncomingWhatsappMessage
{
    public function __construct(
        public string $target,
        public string $text,
        public string $chatType,
        public bool $isGroup,
        public array $payload
    ) {}
}