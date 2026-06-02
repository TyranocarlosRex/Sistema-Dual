<?php

namespace App\Support;

use Symfony\Component\HttpFoundation\Cookie;

final class AuthSessionCookie
{
    public const COOKIE_NAME = 'sistema_dual_token';

    public const TOKEN_MARKER = 'cookie-session';

    public static function make(string $token): Cookie
    {
        return cookie(
            self::COOKIE_NAME,
            $token,
            (int) config('session.lifetime', 120),
            '/',
            config('session.domain'),
            (bool) config('session.secure', false),
            true,
            false,
            config('session.same_site', 'lax')
        );
    }

    public static function forget(): Cookie
    {
        return cookie()->forget(self::COOKIE_NAME);
    }
}
