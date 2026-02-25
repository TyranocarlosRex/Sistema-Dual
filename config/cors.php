<?php
/*Este archivo es parte de la configuración de CORS (Cross-Origin Resource Sharing) 
en una aplicación Laravel. CORS es un mecanismo que permite a los recursos de una página 
web ser solicitados desde otro dominio fuera del dominio desde el cual se sirvió el recurso. 
Esta configuración define qué rutas, métodos, orígenes y encabezados están permitidos para 
las solicitudes CORS.*/
return [

    'paths' => ['api/*', 'sanctum/csrf-cookie', 'login', 'logout', 'user'],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
    ],

    'allowed_origins_patterns' => [],

    'allowed_headers' => [
        'Content-Type',
        'X-Requested-With',
        'Accept',
        'Authorization',
        'X-XSRF-TOKEN',
    ],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,
];