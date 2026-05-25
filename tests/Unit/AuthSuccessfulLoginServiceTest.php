<?php

namespace Tests\Unit;

use App\Contracts\Auth\PasswordVerifier;
use App\Contracts\Auth\TokenIssuer;
use App\Models\Admin;
use App\Models\Coordinator;
use App\Models\Period;
use App\Models\Student;
use App\Models\User;
use App\Services\Auth\AdminLogin;
use App\Services\Auth\CoordinatorLogin;
use App\Services\Auth\LoginResponseFactory;
use App\Services\Auth\StudentLogin;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthSuccessfulLoginServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_login_returns_token_abilities_and_admin_profile(): void
    {
        $user = User::factory()->create([
            'name' => 'Administrador Base',
            'email' => 'admin-success@example.test',
            'password' => 'secret123',
            'role' => 'admin',
        ]);

        $admin = Admin::query()->create([
            'user_id' => $user->id,
            'nombre' => 'Ada',
            'apellidos' => 'Lovelace',
        ]);

        $passwords = $this->passwordsThatAccept('secret123', $user->password);
        $tokens = $this->tokensThatIssue($user, ['admin'], 'admin', 'admin-token');

        $response = (new AdminLogin($passwords, $tokens, new LoginResponseFactory()))->login([
            'email' => ' ADMIN-SUCCESS@EXAMPLE.TEST ',
            'password' => 'secret123',
        ]);

        $this->assertSame('admin-token', $response['access_token']);
        $this->assertSame('admin-token', $response['token']);
        $this->assertSame('Bearer', $response['token_type']);
        $this->assertSame(['admin'], $response['abilities']);
        $this->assertSame($user->id, $response['user']['id']);
        $this->assertSame($admin->id, $response['admin']['id']);
        $this->assertSame('Ada Lovelace', $response['admin']['name']);
    }

    public function test_coordinator_login_returns_token_abilities_and_coordinator_profile(): void
    {
        $user = User::factory()->create([
            'name' => 'Coordinador Base',
            'email' => 'coordinator-success@example.test',
            'password' => 'secret123',
            'role' => 'coordinator',
        ]);

        $coordinator = Coordinator::query()->create([
            'user_id' => $user->id,
            'Nombre' => 'Grace',
            'Apellidos' => 'Hopper',
            'Carrera' => 'Ingenieria en Sistemas Computacionales',
        ]);

        $passwords = $this->passwordsThatAccept('secret123', $user->password);
        $tokens = $this->tokensThatIssue($user, ['coordinator'], 'coordinator', 'coordinator-token');

        $response = (new CoordinatorLogin($passwords, $tokens, new LoginResponseFactory()))->login([
            'email' => 'coordinator-success@example.test',
            'password' => 'secret123',
        ]);

        $this->assertSame('coordinator-token', $response['access_token']);
        $this->assertSame(['coordinator'], $response['abilities']);
        $this->assertSame($coordinator->id, $response['coordinator']->id);
        $this->assertSame('Ingenieria en Sistemas Computacionales', $response['coordinator']->Carrera);
    }

    public function test_student_login_returns_token_and_period_assignment_data(): void
    {
        $period = Period::query()->create([
            'anio' => 2026,
            'numero' => 1,
            'codigo' => '2026-1',
            'estatus' => Period::ESTATUS_ACTIVO,
            'fecha_inicio' => '2026-01-15',
            'fecha_fin' => '2026-06-30',
        ]);

        $user = User::factory()->create([
            'name' => 'Alumno Prueba',
            'email' => 'student-success@example.test',
            'password' => 'secret123',
            'role' => 'student',
        ]);

        $student = Student::query()->forceCreate([
            'user_id' => $user->id,
            'Nombre' => 'Alumno',
            'Apellidos' => 'Prueba',
            'No_control' => 22334010,
            'Semestre' => 8,
            'Carrera' => 'Ingenieria Industrial',
            'Correo_institucional' => '22334010@example.test',
        ]);

        $passwords = $this->passwordsThatAccept('secret123', $user->password);
        $tokens = $this->tokensThatIssue($user, ['student'], 'student', 'student-token');

        $response = (new StudentLogin($passwords, $tokens, new LoginResponseFactory()))->login([
            'no_control' => (string) $student->No_control,
            'password' => 'secret123',
        ]);

        $this->assertSame('student-token', $response['access_token']);
        $this->assertSame(['student'], $response['abilities']);
        $this->assertSame((string) $student->No_control, $response['student']['No_control']);
        $this->assertSame('Ingenieria Industrial', $response['student']['Carrera']);
        $this->assertSame(Student::STATUS_INACTIVO, $response['student']['Estatus']);
        $this->assertSame($period->id, $response['student']['period']['id']);
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

    private function tokensThatIssue(User $user, array $abilities, string $name, string $token): TokenIssuer
    {
        $tokens = $this->createMock(TokenIssuer::class);
        $tokens->expects($this->once())
            ->method('issue')
            ->with(
                $this->callback(fn (User $candidate): bool => $candidate->is($user)),
                $abilities,
                $name
            )
            ->willReturn($token);

        return $tokens;
    }
}
