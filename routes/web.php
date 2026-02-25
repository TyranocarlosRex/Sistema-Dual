<?php
/*En este archivo se definen las rutas web para la aplicación Laravel.
 Se utiliza el método `Route::view` para definir rutas que devuelven vistas específicas.
 La ruta `{any}` captura cualquier ruta que no coincida con las rutas definidas anteriormente y muestra la vista `LoginStudent`.
 Además, se define una ruta específica para el inicio de sesión del coordinador que muestra la vista `LoginCoordinator`. */
use Illuminate\Support\Facades\Route;

Route::view('{any}', 'LoginStudent')->where('any', '.*');

Route::view('/LoginCoordinator', 'LoginCoordinator')->name('coordinator.login');

