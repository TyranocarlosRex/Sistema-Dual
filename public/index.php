<?php

use Illuminate\Foundation\Application;
use Illuminate\Http\Request;
/*Aquí se define el punto de entrada de la aplicación Laravel. 
Se carga el autoloader de Composer, se verifica si la aplicación está en modo 
de mantenimiento y luego se inicia la aplicación Laravel para manejar la solicitud entrante.*/
define('LARAVEL_START', microtime(true));

// Determine if the application is in maintenance mode...
if (file_exists($maintenance = __DIR__.'/../storage/framework/maintenance.php')) {
    require $maintenance;
}

// Register the Composer autoloader...
require __DIR__.'/../vendor/autoload.php';

// Bootstrap Laravel and handle the request...
/** @var Application $app */
$app = require_once __DIR__.'/../bootstrap/app.php';

$app->handleRequest(Request::capture());
