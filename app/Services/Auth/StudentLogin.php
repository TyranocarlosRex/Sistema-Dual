<?php

namespace App\Services\Auth;

use App\Contracts\Auth\LoginService;
use App\Contracts\Auth\PasswordVerifier;
use App\Contracts\Auth\TokenIssuer;
use App\Models\Period;
use App\Models\Student;
use App\Services\Auth\Concerns\JsonFails;
use App\Services\Auth\LoginResponseFactory;
use Illuminate\Database\Eloquent\ModelNotFoundException;

final class StudentLogin implements LoginService
{
    use JsonFails;

    public function __construct(
        private readonly PasswordVerifier $passwords,
        private readonly TokenIssuer $tokens,
        private readonly LoginResponseFactory $responses,
    ) {
    }

    public function login(array $credentials): array
    {
        $noControl = trim((string)($credentials['no_control'] ?? ''));
        $plain = (string)($credentials['password'] ?? '');

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

        $periodoActivo = Period::current();

        if (!$student->hasMinimumAccessSemester($periodoActivo?->id)) {
            $this->fail('Solo estudiantes de septimo semestre en adelante pueden acceder.', 403);
        }

        $registroPeriodo = $student->ensureEnrollmentForPeriod($periodoActivo?->id);

        $abilities = ['student'];
        $token = $this->tokens->issue($user, $abilities, 'student');

        return $this->responses->make($user, $abilities, $token, [
            'student' => [
                'id' => (int)$student->id,
                'Nombre' => (string)($student->Nombre ?? ''),
                'Apellidos' => (string)($student->Apellidos ?? ''),
                'No_control' => (string)($student->No_control ?? $student->no_control ?? ''),
                'Carrera' => $registroPeriodo?->Carrera ?? $student->Carrera ?? $student->career ?? null,
                'Semestre' => $registroPeriodo?->Semestre,
                'Estatus' => $registroPeriodo?->Estatus,
                'Empresa' => $registroPeriodo?->Empresa,
                'Numero_convenio' => $registroPeriodo?->Numero_convenio,
                'Correo_institucional' => $student->Correo_institucional ?: $user->email,
                'Direccion' => $student->Direccion,
                'Telefono' => $student->Telefono,
                'no_control' => (string)($student->No_control ?? $student->no_control ?? ''),
                'career' => $registroPeriodo?->Carrera ?? $student->Carrera ?? $student->career ?? null,
                'semester' => $registroPeriodo?->Semestre,
                'status' => $registroPeriodo?->Estatus,
                'company' => $registroPeriodo?->Empresa,
                'agreement_number' => $registroPeriodo?->Numero_convenio,
                'period' => $periodoActivo ? [
                    'id' => $periodoActivo->id,
                    'codigo' => $periodoActivo->codigo,
                    'estatus' => $periodoActivo->estatus,
                ] : null,
            ],
        ]);
    }
}
