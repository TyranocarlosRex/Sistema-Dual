<?php

namespace Tests\Unit;

use App\Contracts\Auth\PasswordVerifier;
use App\Contracts\Auth\TokenIssuer;
use App\Models\Period;
use App\Models\Student;
use App\Models\StudentPeriod;
use App\Models\User;
use App\Services\Auth\AdminLogin;
use App\Services\Auth\CoordinatorLogin;
use App\Services\Auth\LoginResponseFactory;
use App\Services\Auth\StudentLogin;
use Closure;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Exceptions\HttpResponseException;
use Tests\TestCase;

class AuthLoginServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_services_reject_missing_credentials(): void
    {
        $this->assertJsonFailure(
            fn () => $this->adminLogin()->login([]),
            422,
            'Faltan credenciales'
        );
        $this->assertJsonFailure(
            fn () => $this->coordinatorLogin()->login([]),
            422,
            'Faltan credenciales'
        );
        $this->assertJsonFailure(
            fn () => $this->studentLogin()->login([]),
            422,
            'Parametros faltantes: no_control y password son requeridos.'
        );
    }

    public function test_admin_login_rejects_unknown_users_and_users_without_admin_profile(): void
    {
        $passwords = $this->createMock(PasswordVerifier::class);
        $passwords->expects($this->never())->method('verify');
        $tokens = $this->tokensThatShouldNotIssue();

        $this->assertJsonFailure(
            fn () => $this->adminLogin($passwords, $tokens)->login([
                'email' => 'missing-admin@example.test',
                'password' => 'secret123',
            ]),
            401,
            'Credenciales invalidas'
        );

        $user = User::factory()->create([
            'email' => 'profileless-admin@example.test',
            'password' => 'secret123',
            'role' => 'admin',
        ]);
        $passwords = $this->passwordsThatAccept('secret123', $user->password);
        $tokens = $this->tokensThatShouldNotIssue();

        $this->assertJsonFailure(
            fn () => $this->adminLogin($passwords, $tokens)->login([
                'email' => 'profileless-admin@example.test',
                'password' => 'secret123',
            ]),
            404,
            'Administrador no encontrado'
        );
    }

    public function test_coordinator_login_rejects_unknown_invalid_and_profileless_users(): void
    {
        $passwords = $this->createMock(PasswordVerifier::class);
        $passwords->expects($this->never())->method('verify');
        $tokens = $this->tokensThatShouldNotIssue();

        $this->assertJsonFailure(
            fn () => $this->coordinatorLogin($passwords, $tokens)->login([
                'email' => 'missing-coordinator@example.test',
                'password' => 'secret123',
            ]),
            401,
            'Credenciales invalidas'
        );

        $user = User::factory()->create([
            'email' => 'wrong-coordinator@example.test',
            'password' => 'secret123',
            'role' => 'coordinator',
        ]);
        $passwords = $this->passwordsThatReject('bad-secret', $user->password);
        $tokens = $this->tokensThatShouldNotIssue();

        $this->assertJsonFailure(
            fn () => $this->coordinatorLogin($passwords, $tokens)->login([
                'email' => 'wrong-coordinator@example.test',
                'password' => 'bad-secret',
            ]),
            401,
            'Credenciales invalidas'
        );

        $passwords = $this->passwordsThatAccept('secret123', $user->password);
        $tokens = $this->tokensThatShouldNotIssue();

        $this->assertJsonFailure(
            fn () => $this->coordinatorLogin($passwords, $tokens)->login([
                'email' => 'wrong-coordinator@example.test',
                'password' => 'secret123',
            ]),
            404,
            'Coordinador no encontrado'
        );
    }

    public function test_student_login_rejects_unknown_control_numbers_and_invalid_passwords(): void
    {
        $tokens = $this->tokensThatShouldNotIssue();

        $this->assertJsonFailure(
            fn () => $this->studentLogin(tokens: $tokens)->login([
                'no_control' => '22334999',
                'password' => 'secret123',
            ]),
            404,
            'Estudiante no encontrado'
        );

        [$user, $student] = $this->makeStudent(22334003);
        $passwords = $this->passwordsThatReject('bad-secret', $user->password);
        $tokens = $this->tokensThatShouldNotIssue();

        $this->assertJsonFailure(
            fn () => $this->studentLogin($passwords, $tokens)->login([
                'no_control' => (string) $student->No_control,
                'password' => 'bad-secret',
            ]),
            401,
            'Credenciales invalidas'
        );
    }

    public function test_student_login_rejects_students_below_seventh_semester(): void
    {
        $period = Period::query()->create([
            'anio' => 2026,
            'numero' => 1,
            'codigo' => '2026-1',
            'estatus' => Period::ESTATUS_ACTIVO,
            'fecha_inicio' => '2026-01-15',
            'fecha_fin' => '2026-06-30',
        ]);

        [$user, $student] = $this->makeStudent(22334004);

        StudentPeriod::query()->create([
            'student_id' => $student->id,
            'periodo_id' => $period->id,
            'Estatus' => Student::STATUS_ACTIVO,
            'Semestre' => 6,
            'Carrera' => 'Ingenieria Industrial',
            'Fecha_alta' => '2026-01-15',
        ]);

        $passwords = $this->passwordsThatAccept('secret123', $user->password);
        $tokens = $this->tokensThatShouldNotIssue();

        $this->assertJsonFailure(
            fn () => $this->studentLogin($passwords, $tokens)->login([
                'no_control' => (string) $student->No_control,
                'password' => 'secret123',
            ]),
            403,
            'Solo estudiantes de septimo semestre en adelante pueden acceder.'
        );
    }

    private function adminLogin(
        ?PasswordVerifier $passwords = null,
        ?TokenIssuer $tokens = null
    ): AdminLogin {
        return new AdminLogin(
            $passwords ?? $this->createStub(PasswordVerifier::class),
            $tokens ?? $this->createStub(TokenIssuer::class),
            new LoginResponseFactory()
        );
    }

    private function coordinatorLogin(
        ?PasswordVerifier $passwords = null,
        ?TokenIssuer $tokens = null
    ): CoordinatorLogin {
        return new CoordinatorLogin(
            $passwords ?? $this->createStub(PasswordVerifier::class),
            $tokens ?? $this->createStub(TokenIssuer::class),
            new LoginResponseFactory()
        );
    }

    private function studentLogin(
        ?PasswordVerifier $passwords = null,
        ?TokenIssuer $tokens = null
    ): StudentLogin {
        return new StudentLogin(
            $passwords ?? $this->createStub(PasswordVerifier::class),
            $tokens ?? $this->createStub(TokenIssuer::class),
            new LoginResponseFactory()
        );
    }

    private function passwordsThatAccept(string $plain, string $hashed): PasswordVerifier
    {
        $passwords = $this->createMock(PasswordVerifier::class);
        $passwords->expects($this->once())
            ->method('verify')
            ->with($plain, $hashed)
            ->willReturn(true);

        return $passwords;
    }

    private function passwordsThatReject(string $plain, string $hashed): PasswordVerifier
    {
        $passwords = $this->createMock(PasswordVerifier::class);
        $passwords->expects($this->once())
            ->method('verify')
            ->with($plain, $hashed)
            ->willReturn(false);

        return $passwords;
    }

    private function tokensThatShouldNotIssue(): TokenIssuer
    {
        $tokens = $this->createMock(TokenIssuer::class);
        $tokens->expects($this->never())->method('issue');

        return $tokens;
    }

    private function makeStudent(int $noControl): array
    {
        $user = User::factory()->create([
            'email' => "student-{$noControl}@example.test",
            'password' => 'secret123',
            'role' => 'student',
        ]);

        $student = Student::query()->forceCreate([
            'user_id' => $user->id,
            'Nombre' => 'Alumno',
            'Apellidos' => 'Prueba',
            'No_control' => $noControl,
            'Semestre' => 8,
            'Carrera' => 'Ingenieria Industrial',
            'Correo_institucional' => "{$noControl}@example.test",
        ]);

        return [$user, $student];
    }

    private function assertJsonFailure(Closure $callback, int $status, string $message): void
    {
        try {
            $callback();
            $this->fail('Expected login to throw an HTTP response exception.');
        } catch (HttpResponseException $exception) {
            $response = $exception->getResponse();

            $this->assertSame($status, $response->getStatusCode());
            $this->assertSame(['message' => $message], json_decode($response->getContent(), true));
        }
    }
}
