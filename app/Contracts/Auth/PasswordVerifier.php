<?php
namespace App\Contracts\Auth;
/*Este código define la interface llamada PasswordVerifier, verificador de contraseña.*/
interface PasswordVerifier { public function verify(string $plain, string $hashed): bool; }