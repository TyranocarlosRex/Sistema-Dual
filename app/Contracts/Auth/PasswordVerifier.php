/*Este código define la interface llamada PasswordVerifier, verificador de contraseña.*/
<?php
namespace App\Contracts\Auth;
interface PasswordVerifier { public function verify(string $plain, string $hashed): bool; }