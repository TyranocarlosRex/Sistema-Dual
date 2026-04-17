<?php
namespace App\Services\Auth;

use App\Contracts\Auth\LoginService;
use App\Contracts\Auth\PasswordVerifier;
use App\Contracts\Auth\TokenIssuer;
use App\Models\User;
use App\Services\Auth\Concerns\JsonFails;
use App\Services\Auth\LoginResponseFactory;
/*Clase: AdminLogin
Descripción: Esta clase implementa el servicio de inicio de sesión para administradores.
Utiliza el trait JsonFails para manejar errores de autenticación y devuelve una respuesta 
personalizada con los detalles del administrador y el token de autenticación. 
Se encarga de verificar las credenciales del usuario, emitir un token con las habilidades 
adecuadas y formatear la respuesta de inicio de sesión. 
*/
class AdminLogin implements LoginService
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
            ->with('admin')
            ->first();

        if (!$user) {
            $this->fail('Credenciales invalidas', 401);
        }

        if (!$this->passwords->verify($plain, (string)$user->password)) {
            $this->fail('Credenciales invalidas', 401);
        }

        $admin = $user->admin;
        if (!$admin) {
            $this->fail('Administrador no encontrado', 404);
        }

        $abilities = ['admin'];
        $token     = $this->tokens->issue($user, $abilities, 'admin');

        return $this->responses->make($user, $abilities, $token, [
            'admin' => [
                'id'          => (int)$admin->id,
                'user_id'     => (int)$admin->user_id,
                'name'        => trim((string)($admin->nombre ?? '')) !== ''
                    ? trim($admin->nombre . ' ' . ($admin->apellidos ?? ''))
                    : (string)$user->name,
                'first_name'  => $admin->nombre ?? null,
                'last_name'   => $admin->apellidos ?? null,
            ],
        ]);
    }
}
