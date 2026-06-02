<?php

namespace App\Services\Auth;

use App\Contracts\Auth\TokenIssuer;
use App\Models\User;

class SanctumTokenIssuer implements TokenIssuer
{
    public function __construct(
        private CandidateTracker $tracker,
    ) {}

    public function issue(User $user, array $abilities, ?string $name = 'api'): string
    {
        $this->tracker->track($user);

        return $user->createToken($name, $abilities)->plainTextToken;
    }
}
