<?php

namespace App\Services\Auth;

use App\Contracts\Auth\LoginService;
use App\Contracts\Auth\PasswordVerifier;
use App\Contracts\Auth\TokenIssuer;
use App\Models\Student;
use App\Services\Auth\Concerns\JsonFails;
use App\Services\Auth\LoginResponseFactory;
use Illuminate\Database\Eloquent\ModelNotFoundException;
/* * Servicio de login para estudiantes.
 */
final class StudentLogin implements LoginService
{
    use JsonFails;

    public function __construct(
        private readonly PasswordVerifier $passwords,
        private readonly TokenIssuer $tokens,
        private readonly LoginResponseFactory $responses,
    ) {
    }

    /**
     * @param array{no_control?:mixed,password?:mixed} $credentials
     * @return array{
     *   access_token:string,
     *   token:string,
     *   token_type:string,
     *   abilities:array<int,string>,
     *   user:array{id:int,name:string,email:string},
     *   student:array{id:int,no_control:string,career?:string|null,semester?:int|null}
     * }
     */
    public function login(array $credentials): array
    {
        $noControl = trim((string)($credentials['no_control'] ?? ''));
        $plain     = (string)($credentials['password'] ?? '');

        if ($noControl === '' || $plain === '') {
            $this->fail('Parametros faltantes: no_control y password son requeridos.', 422);
        }

        try {
            $student = Student::query()
                ->with('user')
                ->where('no_control', $noControl)
                ->firstOrFail();
        } catch (ModelNotFoundException) {
            $this->fail('Estudiante no encontrado', 404);
        }

        $user = $student->user;
        if ($user === null) {
            $this->fail('Estudiante no encontrado', 404);
        }

        if (!$this->passwords->verify($plain, (string)$user->password)) {
            $this->fail('Credenciales invalidas', 401);
        }

        $abilities = ['student'];
        $token     = $this->tokens->issue($user, $abilities, 'student');

        return $this->responses->make($user, $abilities, $token, [
            'student' => [
                'id'         => (int)$student->id,
                'no_control' => (string)$student->no_control,
                'career'     => $student->Carrera ?? $student->career ?? null,
                'semester'   => isset($student->Semestre)
                    ? (int)$student->Semestre
                    : ($student->semester ?? null),
            ],
        ]);
    }
}
