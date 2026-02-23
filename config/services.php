<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'fcm' => [
        'service_account_path' => env('FCM_SERVICE_ACCOUNT_PATH') 
            ? (str_starts_with(env('FCM_SERVICE_ACCOUNT_PATH'), '/') || preg_match('/^[A-Z]:/i', env('FCM_SERVICE_ACCOUNT_PATH'))
                ? env('FCM_SERVICE_ACCOUNT_PATH')
                : base_path(env('FCM_SERVICE_ACCOUNT_PATH')))
            : null,
        'project_id' => env('FCM_PROJECT_ID'),
        'client_email' => env('FCM_CLIENT_EMAIL'),
        'private_key' => env('FCM_PRIVATE_KEY'),
        'token_uri' => env('FCM_TOKEN_URI', 'https://oauth2.googleapis.com/token'),
        'server_key' => env('FCM_SERVER_KEY'),
        'send_url' => env('FCM_SEND_URL', 'https://fcm.googleapis.com/fcm/send'),
    ],

];
