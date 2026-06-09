<?php

namespace Tests\Feature;

use App\Models\Advertisement;
use App\Models\Period;
use App\Models\Student;
use App\Models\StudentPeriod;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\Feature\Concerns\BuildsAcademicScenarios;
use Tests\TestCase;

class AuthAndListingFlowTest extends TestCase
{
    use BuildsAcademicScenarios;
    use RefreshDatabase;

    public function test_real_login_flows_issue_tokens_and_profile_endpoints_return_data(): void
    {
        $career = 'Ingenieria Industrial';
        $admin = $this->makeAdmin([
            'email' => 'admin-login@example.test',
        ]);
        $coordinator = $this->makeCoordinator($career, [
            'email' => 'coord-login@example.test',
        ]);
        [$studentUser, $student] = $this->makeStudent($career, [
            'email' => 'student-login@example.test',
        ], [
            'No_control' => 22330001,
        ]);
        $period = $this->makePeriod(2026, 1, Period::ESTATUS_ACTIVO);
        $this->assignStudent($student, $period, [
            'Estatus' => Student::STATUS_ACTIVO,
            'Empresa' => 'ACME',
            'Numero_convenio' => 'AC-01',
        ]);
        $evidence = $this->makeEvidence($admin, 'inscripcion');
        $report = $this->makeReport($evidence, $period, $admin);
        $this->makeSubmission($report, $student);

        $this->postJson('/api/auth/login/admin', [
            'email' => 'ADMIN-LOGIN@EXAMPLE.TEST',
            'password' => 'secret123',
        ])
            ->assertOk()
            ->assertJsonPath('abilities.0', 'admin')
            ->assertJsonPath('admin.first_name', 'Ada');

        $this->postJson('/api/auth/login/coordinator', [
            'email' => 'coord-login@example.test',
            'password' => 'secret123',
        ])
            ->assertOk()
            ->assertJsonPath('abilities.0', 'coordinator')
            ->assertJsonPath('coordinator.Carrera', $career);

        $this->postJson('/api/auth/login/student', [
            'no_control' => '22330001',
            'password' => 'secret123',
        ])
            ->assertOk()
            ->assertJsonPath('abilities.0', 'student')
            ->assertJsonPath('student.period.codigo', '2026-1');

        $assignment = StudentPeriod::query()
            ->where('student_id', $student->id)
            ->where('periodo_id', $period->id)
            ->firstOrFail();

        $this->assertSame('login', $assignment->Origen_login);
        $this->assertNotNull($assignment->Primer_login_at);
        $this->assertNotNull($assignment->Ultimo_login_at);

        Sanctum::actingAs($admin, ['admin']);
        $this->getJson('/api/admin/me')
            ->assertOk()
            ->assertJsonPath('admin.name', 'Ada Admin');

        Sanctum::actingAs($coordinator, ['coordinator']);
        $this->getJson("/api/coordinator/me?periodo_id={$period->id}")
            ->assertOk()
            ->assertJsonPath('period.codigo', '2026-1')
            ->assertJsonPath('stats.students', 1)
            ->assertJsonPath('stats.activeProcesses', 1)
            ->assertJsonPath('stats.pendingDocuments', 1);

        $this->assertSame($studentUser->id, $student->user_id);
    }

    public function test_invalid_login_returns_json_error_from_service(): void
    {
        $this->makeAdmin([
            'email' => 'wrong-password@example.test',
        ]);

        $this->postJson('/api/auth/login/admin', [
            'email' => 'wrong-password@example.test',
            'password' => 'bad-secret',
        ])
            ->assertStatus(401)
            ->assertJsonPath('message', 'Credenciales invalidas');
    }

    public function test_student_login_endpoint_rejects_students_below_seventh_semester(): void
    {
        [, $student] = $this->makeStudent('Ingenieria Industrial', [
            'email' => 'sixth-semester@example.test',
        ], [
            'No_control' => 22330004,
            'Semestre' => 8,
        ]);
        $period = $this->makePeriod(2026, 3, Period::ESTATUS_ACTIVO);
        $this->assignStudent($student, $period, [
            'Semestre' => 6,
        ]);

        $this->postJson('/api/auth/login/student', [
            'no_control' => '22330004',
            'password' => 'secret123',
        ])
            ->assertStatus(403)
            ->assertJsonPath('message', 'Solo estudiantes de septimo semestre en adelante pueden acceder.');

        $assignment = StudentPeriod::query()
            ->where('student_id', $student->id)
            ->where('periodo_id', $period->id)
            ->firstOrFail();

        $this->assertNull($assignment->Primer_login_at);
        $this->assertNull($assignment->Ultimo_login_at);
        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_authenticated_indexes_filter_students_coordinators_and_advertisements(): void
    {
        Storage::fake('public');

        $career = 'Ingenieria Industrial';
        $admin = $this->makeAdmin([
            'email' => 'index-admin@example.test',
        ]);
        $coordinator = $this->makeCoordinator($career, [
            'email' => 'industrial.coord@example.test',
        ]);
        [$studentUser, $student] = $this->makeStudent($career, [
            'email' => 'alma@example.test',
        ], [
            'Nombre' => 'Alma',
            'Apellidos' => 'Robles',
            'No_control' => 22330002,
        ]);
        [, $otherStudent] = $this->makeStudent('Ingenieria Mecanica', [
            'email' => 'other@example.test',
        ], [
            'Nombre' => 'Bruno',
            'No_control' => 22330003,
        ]);

        $period = $this->makePeriod(2026, 2, Period::ESTATUS_ACTIVO);
        $this->assignStudent($student, $period, [
            'Estatus' => Student::STATUS_ACTIVO,
            'Empresa' => 'ACME',
            'Numero_convenio' => 'AC-02',
        ]);
        $this->assignStudent($otherStudent, $period, [
            'Carrera' => 'Ingenieria Mecanica',
        ]);

        $inscripcion = $this->makeEvidence($admin, 'inscripcion');
        $programa = $this->makeEvidence($admin, 'programa');
        $inscripcionReport = $this->makeReport($inscripcion, $period, $admin);
        $this->makeReport($programa, $period, $admin);
        $this->makeSubmission($inscripcionReport, $student);

        Sanctum::actingAs($admin, ['admin']);

        $this->getJson("/api/students?periodo_id={$period->id}&carrera=Industrial&nombre=Alma&per_page=5")
            ->assertOk()
            ->assertJsonPath('data.0.Nombre', 'Alma')
            ->assertJsonPath('data.0.Carrera', $career)
            ->assertJsonPath('data.0.submitted_reports_count', 1)
            ->assertJsonPath('data.0.assigned_reports_count', 2)
            ->assertJsonPath('data.0.progress_percent', 50);

        $this->patchJson("/api/students/{$student->id}/estatus", [
            'periodo_id' => $period->id,
            'estatus' => Student::STATUS_BAJA,
            'motivo_baja' => 'Cambio de programa',
        ])
            ->assertOk()
            ->assertJsonPath('data.estatus', Student::STATUS_BAJA)
            ->assertJsonPath('data.Motivo_baja', 'Cambio de programa');

        $this->getJson('/api/coordinators?correo=industrial.coord@example.test&carrera=Industrial')
            ->assertOk()
            ->assertJsonPath('data.0.Correo', 'industrial.coord@example.test')
            ->assertJsonPath('data.0.Carrera', $career);

        $this->post('/api/advertisements', [
            'titulo' => 'Convocatoria vigente',
            'mensaje' => 'Revisar documentos',
            'target_role' => 'student',
            'attachment' => UploadedFile::fake()->create('aviso.pdf', 4),
        ])
            ->assertCreated()
            ->assertJsonPath('titulo', 'Convocatoria vigente');

        Advertisement::query()->create([
            'titulo' => 'Aviso futuro',
            'mensaje' => 'Todavia no visible',
            'target_role' => 'student',
            'visible_from' => now()->addDay(),
            'created_by' => $admin->id,
        ]);
        Advertisement::query()->create([
            'titulo' => 'Aviso de Industrial',
            'mensaje' => 'Solo para la carrera correcta',
            'target_role' => 'student',
            'target_carrera' => $career,
            'created_by' => $admin->id,
        ]);
        Advertisement::query()->create([
            'titulo' => 'Aviso de Mecanica',
            'mensaje' => 'No debe salir a otra carrera',
            'target_role' => 'student',
            'target_carrera' => 'Ingenieria Mecanica',
            'created_by' => $admin->id,
        ]);

        Sanctum::actingAs($studentUser, ['student']);
        $this->getJson('/api/advertisements')
            ->assertOk()
            ->assertJsonFragment(['titulo' => 'Convocatoria vigente'])
            ->assertJsonFragment(['titulo' => 'Aviso de Industrial'])
            ->assertJsonMissing(['titulo' => 'Aviso futuro'])
            ->assertJsonMissing(['titulo' => 'Aviso de Mecanica']);

        Sanctum::actingAs($coordinator, ['coordinator']);
        $this->getJson("/api/students?periodo_id={$period->id}&per_page=5")
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.Nombre', 'Alma');
    }
}
