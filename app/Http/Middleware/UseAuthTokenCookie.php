<?php

namespace App\Http\Middleware;

use App\Support\AuthSessionCookie;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class UseAuthTokenCookie
{
    public function handle(Request $request, Closure $next): Response
    {
        $bearerToken = $request->bearerToken();
        $cookieToken = $request->cookies->get(AuthSessionCookie::COOKIE_NAME);

        if ($cookieToken && (! $bearerToken || $bearerToken === AuthSessionCookie::TOKEN_MARKER)) {
            $request->headers->set('Authorization', 'Bearer '.$cookieToken);
        }

        return $next($request);
    }
}
