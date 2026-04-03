<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use App\Models\WhatsappLog;

/**
 * @method array sendText(string $number, string $text, int $delay = 1200, bool $linkPreview = true, array $meta = [])
 * @method array sendButtons(string $number, string $title, string $description = '', string $footer = '', array $buttons = [], array $meta = [])
 * @method array sendMedia(string $number, string $filePath, string $caption = '', string $mediaType = 'image', array $meta = [])
 */
class EvolutionApiService
{
    protected string $baseUrl;
    protected string $instanceName;
    protected string $apiKey;
    protected static array $mediaCache = [];

    public function __construct()
    {
        $this->baseUrl = config('services.evolution.base_url');
        $this->instanceName = config('services.evolution.instance');
        $this->apiKey = config('services.evolution.api_key');
    }

    /**
     * Mengirim pesan teks via Evolution API
     */
    public function sendText(string $number, string $text, int $delay = 1200, bool $linkPreview = true, array $meta = []): array
    {
        $endpoint = "{$this->baseUrl}/message/sendText/{$this->instanceName}";

        try {
            $response = Http::withoutVerifying() // <--- bypass SSL lokal
                ->timeout(15)
                ->withHeaders([
                    'apikey'       => $this->apiKey,
                    'Content-Type' => 'application/json',
                ])
                ->post($endpoint, [
                    'number'      => $number,
                    'text'        => $text,
                    'delay'       => $delay,
                    'linkPreview' => $linkPreview
                ]);

            // Catat PESAN KELUAR ke WhatsappLog
            WhatsappLog::create([
                'type'        => 'outgoing',
                'target'      => $number,
                'message'     => $text,
                'keyword'     => $meta['type'] ?? 'broadcast', // Ambil type dari meta, default 'broadcast'
                'payload'     => array_merge(['api_response' => $response->json()], $meta),
                'http_status' => $response->status(),
            ]);

            return [
                'success' => $response->successful(),
                'status'  => $response->status(),
                'data'    => $response->json(),
                'error'   => $response->successful() ? null : $response->body()
            ];
        } catch (\Exception $e) {
            WhatsappLog::create([
                'type'        => 'outgoing_failed',
                'target'      => $number,
                'message'     => $text,
                'keyword'     => $meta['type'] ?? 'error',
                'payload'     => ['error_message' => $e->getMessage()],
                'http_status' => 500,
            ]);

            return [
                'success' => false,
                'status'  => 500,
                'data'    => null,
                'error'   => 'Server Error: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Mengirim pesan media (Gambar, PDF, Video, dll) via Evolution API
     */
    public function sendMedia(
        string $number,
        string $filePath,
        string $caption = '',
        string $mediaType = 'image',
        array $meta = []
    ): array {

        $endpoint = "{$this->baseUrl}/message/sendMedia/{$this->instanceName}";

        if (!file_exists($filePath)) {
            WhatsappLog::create([
                'type'        => 'outgoing_failed',
                'target'      => $number,
                'message'     => $caption,
                'keyword'     => $meta['type'] ?? 'media_error',
                'payload'     => [
                    'error' => "File tidak ditemukan: {$filePath}",
                    'file' => $filePath,
                ],
                'http_status' => 404,
            ]);

            return [
                'success' => false,
                'status'  => 404,
                'error'   => "File tidak ditemukan: {$filePath}"
            ];
        }

        $fileName = is_string($meta['file_name'] ?? null) && trim((string) $meta['file_name']) !== ''
            ? trim((string) $meta['file_name'])
            : basename($filePath);
        $mimeType = mime_content_type($filePath) ?: 'application/octet-stream';
        $delay = max(0, (int) ($meta['delay'] ?? 250));

        $cacheKey = $filePath . '|' . (string) filemtime($filePath);
        if (isset(self::$mediaCache[$cacheKey])) {
            $base64 = self::$mediaCache[$cacheKey];
        } else {
            $base64 = base64_encode(file_get_contents($filePath));
            self::$mediaCache = [$cacheKey => $base64];
        }

        $mediaDataUri = "data:{$mimeType};base64,{$base64}";

        try {
            $attempts = [
                [
                    'name' => 'v2_mediaMessage_datauri',
                    'body' => [
                        'number' => $number,
                        'options' => [
                            'delay' => $delay,
                            'presence' => 'composing'
                        ],
                        'mediaMessage' => [
                            'mediatype' => $mediaType,
                            'fileName'  => $fileName,
                            'caption'   => $caption,
                            'media'     => $mediaDataUri
                        ]
                    ],
                ],
                [
                    'name' => 'v2_mediaMessage_base64',
                    'body' => [
                        'number' => $number,
                        'options' => [
                            'delay' => $delay,
                            'presence' => 'composing'
                        ],
                        'mediaMessage' => [
                            'mediatype' => $mediaType,
                            'fileName'  => $fileName,
                            'caption'   => $caption,
                            'media'     => $base64
                        ]
                    ],
                ],
                [
                    'name' => 'legacy_flat_datauri',
                    'body' => [
                        'number'    => $number,
                        'mediatype' => $mediaType,
                        'mimetype'  => $mimeType,
                        'caption'   => $caption,
                        'media'     => $mediaDataUri,
                        'fileName'  => $fileName,
                        'delay'     => $delay,
                    ],
                ],
                [
                    'name' => 'legacy_flat_base64',
                    'body' => [
                        'number'    => $number,
                        'mediatype' => $mediaType,
                        'mimetype'  => $mimeType,
                        'caption'   => $caption,
                        'media'     => $base64,
                        'fileName'  => $fileName,
                        'delay'     => $delay,
                    ],
                ],
            ];

            $response = null;
            $payloadFormat = null;
            $attemptTrace = [];

            foreach ($attempts as $attempt) {
                $candidate = Http::withoutVerifying()
                    ->timeout(30)
                    ->withHeaders([
                        'apikey' => $this->apiKey,
                        'Content-Type' => 'application/json',
                    ])
                    ->post($endpoint, $attempt['body']);

                $attemptTrace[] = [
                    'format' => $attempt['name'],
                    'status' => $candidate->status(),
                    'success' => $candidate->successful(),
                    'response' => $candidate->json() ?? $candidate->body(),
                ];

                $response = $candidate;
                $payloadFormat = $attempt['name'];

                if ($candidate->successful()) {
                    break;
                }
            }

            // LOG SUCCESS
            WhatsappLog::create([
                'type'        => $response->successful() ? 'outgoing' : 'outgoing_failed',
                'target'      => $number,
                'message'     => $caption,
                'keyword'     => $meta['type'] ?? 'media',
                'payload'     => array_merge([
                    'file' => $filePath,
                    'mime_type' => $mimeType,
                    'payload_format' => $payloadFormat,
                    'attempt_trace' => $attemptTrace,
                    'api_response' => $response->json() ?? $response->body()
                ], $meta),
                'http_status' => $response->status(),
            ]);

            return [
                'success' => $response->successful(),
                'status'  => $response->status(),
                'data'    => $response->json(),
                'error'   => $response->successful() ? null : $response->body()
            ];
        } catch (\Exception $e) {

            WhatsappLog::create([
                'type'        => 'outgoing_failed',
                'target'      => $number,
                'message'     => $caption,
                'keyword'     => 'media_error',
                'payload'     => ['error' => $e->getMessage()],
                'http_status' => 500,
            ]);

            return [
                'success' => false,
                'status'  => 500,
                'error'   => $e->getMessage()
            ];
        }
    }
}
