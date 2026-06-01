<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\URL;
use Illuminate\Http\Request;
/*CLase: AppServiceProvider
Descripción: Este proveedor de servicios se encarga de registrar los servicios 
de autenticación personalizados y configurar
las políticas de seguridad, como forzar el uso de HTTPS y limitar las solicitudes a la API.
*/
class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(\App\Contracts\Auth\PasswordVerifier::class, \App\Services\Auth\LaravelPasswordVerifier::class);
        $this->app->bind(\App\Contracts\Auth\TokenIssuer::class, \App\Services\Auth\SanctumTokenIssuer::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $appUrl = config('app.url');

        if (!$this->app->environment('local') && $appUrl && str_starts_with($appUrl, 'https://')) {
            URL::forceScheme('https');
        }

        RateLimiter::for('api', function (Request $request) {
            return [
                Limit::perMinute(60)->by($request->user()?->id ?: $request->ip()),
            ];
        });
    }
}
