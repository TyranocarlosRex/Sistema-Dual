<?php

namespace App\Services\Auth;

use App\Contracts\Auth\TokenIssuer;
use App\Models\User;

class SanctumTokenIssuer implements TokenIssuer
{
    public function __construct(
        private CandidateTracker $tracker, // inyección automática de Laravel
    ) {}

    public function issue(User $user, array $abilities, ?string $name = 'api'): string
    {
        // 1) registra/actualiza en candidate
        $this->tracker->track($user);

        // 2) emite el token Sanctum
        return $user->createToken($name, $abilities)->plainTextToken;
    }
}