<?php

namespace Tests\Unit;

use App\Models\Period;
use App\Models\Student;
use App\Models\StudentPeriod;
use App\Models\User;
use App\Services\Auth\CandidateTracker;
use App\Services\Auth\LaravelPasswordVerifier;
use App\Services\Auth\LoginResponseFactory;
use App\Services\Auth\SanctumTokenIssuer;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\PersonalAccessToken;
use Tests\TestCase;

class AuthSupportServicesTest extends TestCase
{
    use RefreshDatabase;

    public function test_laravel_password_verifier_accepts_only_matching_hashes(): void
    {
        $verifier = new LaravelPasswordVerifier();
        $hash = Hash::make('secret123');

        $this->assertTrue($verifier->verify('secret123', $hash));
        $this->assertFalse($verifier->verify('wrong-secret', $hash));
    }

    public function test_login_response_factory_returns_standard_payload(): void
    {
        $user = new User([
            'name' => 'Usuario Demo',
            'email' => 'demo@example.test',
        ]);
        $user->id = 99;

        $response = (new LoginResponseFactory())->make($user, ['admin'], 'token-123', [
            'admin' => ['id' => 5],
        ]);

        $this->assertSame('token-123', $response['access_token']);
        $this->assertSame('token-123', $response['token']);
        $this->assertSame('Bearer', $response['token_type']);
        $this->assertSame(['admin'], $response['abilities']);
        $this->assertSame(99, $response['user']['id']);
        $this->assertSame('Usuario Demo', $response['user']['name']);
        $this->assertSame('demo@example.test', $response['user']['email']);
        $this->assertSame(['id' => 5], $response['admin']);
    }

    public function test_sanctum_token_issuer_creates_token_and_tracks_student_login(): void
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
            'name' => 'Alumno Token',
            'email' => 'token-student@example.test',
            'role' => 'student',
        ]);

        $student = Student::query()->forceCreate([
            'user_id' => $user->id,
            'Nombre' => 'Alumno',
            'Apellidos' => 'Token',
            'No_control' => 22334011,
            'Semestre' => 8,
            'Carrera' => 'Ingenieria Industrial',
            'Correo_institucional' => '22334011@example.test',
        ]);

        $token = (new SanctumTokenIssuer(new CandidateTracker()))->issue($user, ['student'], 'student');

        $this->assertNotSame('', $token);

        $storedToken = PersonalAccessToken::query()->first();
        $this->assertNotNull($storedToken);
        $this->assertSame('student', $storedToken->name);
        $this->assertSame(['student'], $storedToken->abilities);

        $assignment = StudentPeriod::query()
            ->where('student_id', $student->id)
            ->where('periodo_id', $period->id)
            ->first();

        $this->assertNotNull($assignment);
        $this->assertNotNull($assignment->Primer_login_at);
        $this->assertNotNull($assignment->Ultimo_login_at);
        $this->assertSame('login', $assignment->Origen_login);
        $this->assertSame('Ingenieria Industrial', $assignment->Carrera);
        $this->assertSame(8, $assignment->Semestre);
    }

    public function test_candidate_tracker_ignores_non_student_users(): void
    {
        Period::query()->create([
            'anio' => 2026,
            'numero' => 1,
            'codigo' => '2026-1',
            'estatus' => Period::ESTATUS_ACTIVO,
        ]);
        $user = User::factory()->create(['role' => 'admin']);

        (new CandidateTracker())->track($user);

        $this->assertSame(0, StudentPeriod::query()->count());
    }

    public function test_candidate_tracker_ignores_student_role_without_student_profile(): void
    {
        Period::query()->create([
            'anio' => 2026,
            'numero' => 1,
            'codigo' => '2026-1',
            'estatus' => Period::ESTATUS_ACTIVO,
        ]);
        $user = User::factory()->create(['role' => 'student']);

        (new CandidateTracker())->track($user);

        $this->assertSame(0, StudentPeriod::query()->count());
    }

    public function test_candidate_tracker_ignores_students_when_there_is_no_active_period(): void
    {
        $user = User::factory()->create(['role' => 'student']);
        Student::query()->forceCreate([
            'user_id' => $user->id,
            'Nombre' => 'Alumno',
            'Apellidos' => 'Sin Periodo',
            'No_control' => 22334021,
            'Semestre' => 8,
            'Carrera' => 'Ingenieria Industrial',
            'Correo_institucional' => '22334021@example.test',
        ]);

        (new CandidateTracker())->track($user);

        $this->assertSame(0, StudentPeriod::query()->count());
    }
}
