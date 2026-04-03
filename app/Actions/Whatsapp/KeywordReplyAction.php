<?php

namespace App\Actions\Whatsapp;

use Illuminate\Support\Str;
use App\DTO\IncomingWhatsappMessage;
use App\Services\EvolutionApiService;

class KeywordReplyAction
{
    private const FAST_TEXT_DELAY_MS = 200;
    private const FAST_MEDIA_DELAY_MS = 250;

    public function __construct(
        protected EvolutionApiService $wa
    ) {}

    public function execute(IncomingWhatsappMessage $message): void
    {
        $keywords = [

            'ping' => [
                'type' => 'text',
                'text' => 'Pong 🤖'
            ],

            'harga' => [
                'type' => 'text',
                'text' => 'Silakan cek website kami untuk harga terbaru'
            ],

            'info' => [
                'type' => 'media',
                'file' => public_path('images/splash.png'),
                'caption' => "📌 Informasi Produk\n\nBerikut katalog terbaru kami."
            ],

            'brosur' => [
                'type' => 'media_text',
                'file' => public_path('images/splash.png'),
                'caption' => 'Ini brosur terbaru kami',
                'text' => 'Silakan dipelajari, jika ada pertanyaan kabari ya'
            ],

            'url' => [
                'type' => 'url',
                'title' => 'Promo Testing Tombol URL',
                'text' => "Siap sedia di keadaan darurat, SPinjam dengan diskon biaya cicilan jadi pilihan tepat.\n\nPengajuan bisa langsung dari HP dan pencarian cepat sekitar 5 menit.\n\nTemukan voucher diskonmu di sini.",
                'button_text' => 'Cek di sini',
                'footer' => 'Testing CTA URL dari bot',
                'thumbnail_url' => 'https://dummyimage.com/1200x630/f97316/ffffff.png&text=Promo+Testing',
                'url' => 'https://laravel.com'
            ],

        ];

        $textLower = strtolower($message->text);

        foreach ($keywords as $keyword => $config) {

            if (!Str::contains($textLower, $keyword)) {
                continue;
            }

            switch ($config['type']) {

                case 'text':
                    $this->wa->sendText(
                        $message->target,
                        $config['text'],
                        self::FAST_TEXT_DELAY_MS,
                        true,
                        [
                            'type' => "auto_reply_{$message->chatType}_{$keyword}"
                        ]
                    );
                    break;

                case 'media':
                    $this->wa->sendMedia(
                        $message->target,
                        $config['file'],
                        $config['caption'] ?? '',
                        'image',
                        [
                            'type' => "auto_reply_{$message->chatType}_{$keyword}",
                            'delay' => self::FAST_MEDIA_DELAY_MS,
                        ]
                    );
                    break;

                case 'media_text':
                    $mediaResult = $this->wa->sendMedia(
                        $message->target,
                        $config['file'],
                        $config['caption'] ?? '',
                        'image',
                        [
                            'type' => "auto_reply_{$message->chatType}_{$keyword}",
                            'delay' => self::FAST_MEDIA_DELAY_MS,
                        ]
                    );

                    if (!($mediaResult['success'] ?? false)) {
                        break;
                    }

                    $this->wa->sendText(
                        $message->target,
                        $config['text'],
                        self::FAST_TEXT_DELAY_MS,
                        true,
                        [
                            'type' => "auto_reply_{$message->chatType}_{$keyword}"
                        ]
                    );
                    break;
            }

            return;
        }
    }
}