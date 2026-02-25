<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
/*|Este archivo define las rutas de la consola para la aplicación Laravel.
 Se pueden registrar comandos personalizados de Artisan aquí, y cada comando 
 puede tener una descripción que se muestra cuando se ejecuta el comando `php artisan list`. 
 En este caso, se define un comando llamado `inspire` que muestra una cita inspiradora cuando 
 se ejecuta. */
Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');
