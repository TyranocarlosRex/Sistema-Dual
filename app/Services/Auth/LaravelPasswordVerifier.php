<?php
namespace App\Services\Auth;
use App\Contracts\Auth\PasswordVerifier;
use Illuminate\Support\Facades\Hash;
/* * Implementación de verificación de contraseñas usando el sistema de hashing de Laravel.
 */
class LaravelPasswordVerifier implements PasswordVerifier {
    public function verify(string $plain, string $hashed): bool { return Hash::check($plain, $hashed); }
}