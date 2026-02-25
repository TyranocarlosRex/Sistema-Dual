<?php

namespace App\Services\Auth;

use App\Contracts\Auth\LoginService;
use App\Contracts\Auth\PasswordVerifier;
use App\Contracts\Auth\TokenIssuer;
use App\Models\User;
use App\Services\Auth\Concerns\JsonFails;
use App\Services\Auth\LoginResponseFactory;
/* * Servicio de login para coordinadores.
 */
class CoordinatorLogin implements LoginService
{
    use JsonFails;

    public function __construct(
        private PasswordVerifier $passwords,
        private TokenIssuer $tokens,
        private LoginResponseFactory $responses,
    ) {
    }

    public function login(array $credentials): array
    {
        $email = mb_strtolower(trim((string)($credentials['email'] ?? '')));
        $plain = (string)($credentials['password'] ?? '');

        if ($email === '' || $plain === '') {
            $this->fail('Faltan credenciales', 422);
        }

        $user = User::whereRaw('LOWER(email) = ?', [$email])
            ->with('coordinator')
            ->first();

        if (!$user) {
            $this->fail('Credenciales invalidas', 401);
        }

        if (!$this->passwords->verify($plain, (string)$user->password)) {
            $this->fail('Credenciales invalidas', 401);
        }

        $coordinator = $user->coordinator;
        if (!$coordinator) {
            $this->fail('Coordinador no encontrado', 404);
        }

        $abilities = ['coordinator'];
        $token = $this->tokens->issue($user, $abilities, 'coordinator');

        return $this->responses->make($user, $abilities, $token, [
            'coordinator'  => $coordinator,
        ]);
    }
}
