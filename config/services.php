<?php
/*Este archivo es parte de la configuración de servicios de terceros en una aplicación Laravel.
Aquí se definen las credenciales para servicios de terceros como Mailgun, Postmark, AWS, Slack, 
entre otros. Esta configuración proporciona un lugar centralizado para almacenar esta información, 
lo que facilita a los paquetes y a la aplicación en general acceder a las credenciales necesarias 
para interactuar con estos servicios de manera segura y eficiente. Es esencial para que la 
aplicación pueda integrarse correctamente con servicios externos y utilizar sus funcionalidades 
según sea necesario.*/
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
        'token' => env('POSTMARK_TOKEN'),
    ],

    'resend' => [
        'key' => env('RESEND_KEY'),
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

];
