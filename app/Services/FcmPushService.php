<?php

namespace App\Services;

use App\Models\UserDeviceToken;
use App\Models\UserNotification;
use GuzzleHttp\Client;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class FcmPushService
{
    public function sendUserNotification(UserNotification $notification): array
    {
        $tokens = UserDeviceToken::query()
            ->where('user_id', $notification->user_id)
            ->where('is_active', true)
            ->pluck('token')
            ->values();

        if ($tokens->isEmpty()) {
            return [
                'sent' => 0,
                'failed' => 0,
                'message' => 'Tidak ada token perangkat aktif.',
            ];
        }

        $sent = 0;
        $failed = 0;

        foreach ($tokens as $token) {
            $ok = $this->sendToToken(
                token: (string) $token,
                title: $notification->title,
                body: $notification->message,
                data: [
                    'notification_id' => (string) $notification->id,
                    'type' => (string) $notification->type,
                    'action_url' => (string) ($notification->action_url ?? '/sales/notifications'),
                    'priority' => (string) $notification->priority,
                    'channel' => (string) $notification->channel,
                ],
                priority: $notification->priority === UserNotification::PRIORITY_HIGH ? 'high' : 'normal',
            );

            if ($ok) {
                $sent++;
            } else {
                $failed++;
            }
        }

        return [
            'sent' => $sent,
            'failed' => $failed,
            'message' => "Push terkirim ke {$sent} perangkat, gagal {$failed}.",
        ];
    }

    public function sendToToken(string $token, string $title, string $body, array $data = [], string $priority = 'high'): bool
    {
        if ($this->canUseV1()) {
            return $this->sendWithV1($token, $title, $body, $data, $priority);
        }

        return $this->sendWithLegacy($token, $title, $body, $data, $priority);
    }

    protected function sendWithV1(string $token, string $title, string $body, array $data = [], string $priority = 'high'): bool
    {
        $credentials = $this->resolveV1Credentials();

        if ($credentials === null) {
            return false;
        }

        $sendUrl = 'https://fcm.googleapis.com/v1/projects/' . $credentials['project_id'] . '/messages:send';
        $accessToken = $this->getAccessToken($credentials);

        if (!$accessToken) {
            return false;
        }

        $client = new Client([
            'timeout' => 8,
            'headers' => [
                'Authorization' => 'Bearer ' . $accessToken,
                'Content-Type' => 'application/json',
            ],
        ]);

        try {
            $response = $client->post($sendUrl, [
                'json' => [
                    'message' => [
                        'token' => $token,
                        'notification' => [
                            'title' => $title,
                            'body' => $body,
                        ],
                        'data' => $this->normalizeData($data),
                        'android' => [
                            'priority' => $priority === 'high' ? 'HIGH' : 'NORMAL',
                            'notification' => [
                                'sound' => 'default',
                                'channel_id' => 'default',
                                'icon' => 'ic_stat_name',
                                'color' => '#2563eb',
                                'default_sound' => true,
                                'default_vibrate_timings' => true,
                                'default_light_settings' => true,
                                'notification_priority' => $priority === 'high' ? 'PRIORITY_HIGH' : 'PRIORITY_DEFAULT',
                            ],
                        ],
                    ],
                ],
            ]);

            $decoded = json_decode((string) $response->getBody(), true);

            return isset($decoded['name']) && $decoded['name'] !== '';
        } catch (\Throwable $e) {
            Log::error('Gagal kirim push FCM v1.', [
                'error' => $e->getMessage(),
                'token' => substr($token, 0, 20) . '...',
            ]);
            return false;
        }
    }

    protected function sendWithLegacy(string $token, string $title, string $body, array $data = [], string $priority = 'high'): bool
    {
        $serverKey = (string) config('services.fcm.server_key');
        $sendUrl = (string) config('services.fcm.send_url', 'https://fcm.googleapis.com/fcm/send');

        if ($serverKey === '') {
            Log::warning('FCM key tidak ditemukan. Siapkan FCM HTTP v1 atau legacy key.');
            return false;
        }

        $client = new Client([
            'timeout' => 8,
            'headers' => [
                'Authorization' => 'key=' . $serverKey,
                'Content-Type' => 'application/json',
            ],
        ]);

        try {
            $response = $client->post($sendUrl, [
                'json' => [
                    'to' => $token,
                    'priority' => $priority,
                    'notification' => [
                        'title' => $title,
                        'body' => $body,
                        'sound' => 'default',
                    ],
                    'data' => $this->normalizeData($data),
                ],
            ]);

            $decoded = json_decode((string) $response->getBody(), true);

            return (int) ($decoded['success'] ?? 0) > 0;
        } catch (\Throwable $e) {
            Log::error('Gagal kirim push FCM.', [
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    protected function canUseV1(): bool
    {
        return $this->resolveV1Credentials() !== null;
    }

    protected function getAccessToken(array $credentials): ?string
    {
        $cacheKey = 'fcm.v1.access_token.' . md5($credentials['project_id'] . '|' . $credentials['client_email']);

        $cached = Cache::get($cacheKey);
        if (is_string($cached) && $cached !== '') {
            return $cached;
        }

        $jwt = $this->buildServiceAccountJwt(
            $credentials['client_email'],
            $credentials['private_key'],
            $credentials['token_uri']
        );

        if (!$jwt) {
            return null;
        }

        $client = new Client(['timeout' => 8]);

        try {
            $response = $client->post($credentials['token_uri'], [
                'form_params' => [
                    'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                    'assertion' => $jwt,
                ],
            ]);

            $decoded = json_decode((string) $response->getBody(), true);
            $accessToken = (string) ($decoded['access_token'] ?? '');
            $expiresIn = (int) ($decoded['expires_in'] ?? 3600);

            if ($accessToken === '') {
                return null;
            }

            $ttl = max(60, $expiresIn - 120);
            Cache::put($cacheKey, $accessToken, now()->addSeconds($ttl));

            return $accessToken;
        } catch (\Throwable $e) {
            Log::error('Gagal mendapatkan access token FCM v1.', [
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }

    protected function resolveV1Credentials(): ?array
    {
        $projectId = (string) config('services.fcm.project_id');
        $clientEmail = (string) config('services.fcm.client_email');
        $privateKey = (string) config('services.fcm.private_key');
        $tokenUri = (string) config('services.fcm.token_uri', 'https://oauth2.googleapis.com/token');

        if ($projectId !== '' && $clientEmail !== '' && $privateKey !== '') {
            return [
                'project_id' => $projectId,
                'client_email' => $clientEmail,
                'private_key' => str_replace('\\n', "\n", $privateKey),
                'token_uri' => $tokenUri,
            ];
        }

        $serviceAccountPath = (string) config('services.fcm.service_account_path');
        if ($serviceAccountPath === '') {
            return null;
        }

        if (!is_file($serviceAccountPath)) {
            Log::warning('File service account FCM tidak ditemukan.', [
                'path' => $serviceAccountPath,
            ]);
            return null;
        }

        try {
            $json = json_decode((string) file_get_contents($serviceAccountPath), true, 512, JSON_THROW_ON_ERROR);
        } catch (\Throwable $e) {
            Log::error('Gagal membaca service account FCM.', [
                'error' => $e->getMessage(),
                'path' => $serviceAccountPath,
            ]);
            return null;
        }

        if (!is_array($json)) {
            return null;
        }

        $fileProjectId = (string) ($json['project_id'] ?? '');
        $fileClientEmail = (string) ($json['client_email'] ?? '');
        $filePrivateKey = (string) ($json['private_key'] ?? '');
        $fileTokenUri = (string) ($json['token_uri'] ?? 'https://oauth2.googleapis.com/token');

        if ($fileProjectId === '' || $fileClientEmail === '' || $filePrivateKey === '') {
            Log::warning('Field service account FCM tidak lengkap.', [
                'path' => $serviceAccountPath,
            ]);
            return null;
        }

        return [
            'project_id' => $fileProjectId,
            'client_email' => $fileClientEmail,
            'private_key' => $filePrivateKey,
            'token_uri' => $fileTokenUri,
        ];
    }

    protected function buildServiceAccountJwt(string $clientEmail, string $privateKey, string $tokenUri): ?string
    {
        if ($clientEmail === '' || $privateKey === '' || $tokenUri === '') {
            return null;
        }

        $header = [
            'alg' => 'RS256',
            'typ' => 'JWT',
        ];

        $now = time();
        $payload = [
            'iss' => $clientEmail,
            'scope' => 'https://www.googleapis.com/auth/firebase.messaging',
            'aud' => $tokenUri,
            'iat' => $now,
            'exp' => $now + 3600,
        ];

        $segments = [
            $this->base64UrlEncode(json_encode($header, JSON_UNESCAPED_SLASHES)),
            $this->base64UrlEncode(json_encode($payload, JSON_UNESCAPED_SLASHES)),
        ];

        $signingInput = implode('.', $segments);

        // Convert private key string to OpenSSL resource
        $privateKeyResource = openssl_pkey_get_private($privateKey);
        if ($privateKeyResource === false) {
            Log::error('Gagal memproses private key untuk FCM v1.', [
                'openssl_error' => openssl_error_string(),
            ]);
            return null;
        }

        $signature = '';
        $signed = openssl_sign($signingInput, $signature, $privateKeyResource, OPENSSL_ALGO_SHA256);

        // Free the key resource
        openssl_free_key($privateKeyResource);

        if (!$signed) {
            Log::error('Gagal menandatangani JWT service account untuk FCM v1.', [
                'openssl_error' => openssl_error_string(),
            ]);
            return null;
        }

        $segments[] = $this->base64UrlEncode($signature);

        return implode('.', $segments);
    }

    protected function base64UrlEncode(string $input): string
    {
        return rtrim(strtr(base64_encode($input), '+/', '-_'), '=');
    }

    protected function normalizeData(array $data): array
    {
        $normalized = [];

        foreach ($data as $key => $value) {
            if (is_scalar($value)) {
                $normalized[(string) $key] = (string) $value;
            } else {
                $normalized[(string) $key] = json_encode($value);
            }
        }

        return $normalized;
    }
}
