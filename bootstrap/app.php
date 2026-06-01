<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

use App\Http\Middleware\AddContentLengthForHtml;
use Illuminate\Routing\Middleware\SubstituteBindings;
use Illuminate\Routing\Middleware\ThrottleRequests;

use Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful;
use Laravel\Sanctum\Http\Middleware\CheckAbilities;
use Laravel\Sanctum\Http\Middleware\CheckForAnyAbility;
/* * Bootstrap de la aplicación.
 *
 * Aquí se configura la aplicación, incluyendo rutas, middleware y excepciones.
 * Se utiliza el nuevo sistema de configuración fluida introducido en Laravel 10.2.
 */
$app = Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'bindings'  => SubstituteBindings::class,
            'throttle'  => ThrottleRequests::class,

            // Sanctum SPA/stateful
            'sanctum'   => EnsureFrontendRequestsAreStateful::class,

            // Sanctum abilities (AQUÍ lo importante)
            'abilities' => CheckAbilities::class,
            'ability'   => CheckForAnyAbility::class,
        ]);

        $middleware->group('api', [
            'sanctum',
            'throttle:api',
            'bindings',
        ]);

        $middleware->web(append: [
            AddContentLengthForHtml::class,
        ]);

        $middleware->trustProxies(at: '*');
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })
    ->create();

$app->singleton(
    \Illuminate\Contracts\Console\Kernel::class,
    \App\Console\Kernel::class,
);

return $app;
