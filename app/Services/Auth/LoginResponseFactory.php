<?php

namespace App\Services\Auth;

use App\Models\User;
/* * Fábrica de respuestas homogéneas para los flujos de login.
 */
class LoginResponseFactory
{
    /**
     * Construye una respuesta homogénea para los flujos de login.
     *
     * @param array<string> $abilities
     * @param array<string,mixed> $extra
     * @return array<string,mixed>
     */
    public function make(User $user, array $abilities, string $token, array $extra = []): array
    {
        return array_merge([
            'access_token' => $token,
            'token'        => $token, // alias para compatibilidad
            'token_type'   => 'Bearer',
            'abilities'    => $abilities,
            'user'         => [
                'id'    => (int) $user->id,
                'name'  => (string) $user->name,
                'email' => (string) $user->email,
            ],
        ], $extra);
    }
}
