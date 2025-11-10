<?php
namespace App\Services\Auth;

use App\Contracts\Auth\LoginService;
use App\Contracts\Auth\PasswordVerifier;
use App\Contracts\Auth\TokenIssuer;
use App\Models\Student;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Database\Eloquent\ModelNotFoundException;

final class StudentLogin implements LoginService
{
    public function __construct(
        private readonly PasswordVerifier $passwords,
        private readonly TokenIssuer $tokens,
    ) {}

    /**
     * @param array{no_control?:mixed,password?:mixed} $credentials
     * @return array{
     *   token:string,
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
            // why: fail fast with clear client error
            $this->fail('Parámetros faltantes: no_control y password son requeridos.', 422);
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
            // why: data integrity issue should still be a 404 to the client
            $this->fail('Estudiante no encontrado', 404);
        }

        if (!$this->passwords->verify($plain, (string)$user->password)) {
            $this->fail('Credenciales inválidas', 422);
        }

        $abilities = ['student']; // Sanctum abilities
        $token     = $this->tokens->issue($user, $abilities, 'student');

        return [
            'token'     => $token,
            'abilities' => $abilities,
            'user'      => [
                'id'    => (int)$user->id,
                'name'  => (string)$user->name,
                'email' => (string)$user->email,
            ],
            // why: do not expose entire model; keep only what UI needs
            'student'   => [
                'id'         => (int)$student->id,
                'no_control' => (string)$student->no_control,
                'career'     => $student->career ?? null,
                'semester'   => $student->semester ?? null,
            ],
        ];
    }

    /**
     * @param non-empty-string $message
     * @return never
     */
    private function fail(string $message, int $status): never
    {
        throw new HttpResponseException(
            response()->json(['message' => $message], $status)
        );
    }
}