<?php

namespace Tests\Feature;

use App\Models\Period;
use App\Models\Student;
use App\Models\StudentPeriod;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Feature\Concerns\BuildsAcademicScenarios;
use Tests\TestCase;

class PeriodManagementFlowTest extends TestCase
{
    use BuildsAcademicScenarios;
    use RefreshDatabase;

    public function test_admin_can_manage_period_lifecycle_students_and_statistics(): void
    {
        $admin = $this->makeAdmin([
            'email' => 'period-admin@example.test',
        ]);
        [$studentUser, $student] = $this->makeStudent('Ingenieria Industrial', [
            'email' => 'period-student@example.test',
        ], [
            'No_control' => 22331001,
        ]);
        [, $droppedStudent] = $this->makeStudent('Ingenieria Industrial', [
            'email' => 'period-dropped@example.test',
        ], [
            'No_control' => 22331002,
            'Nombre' => 'Dalia',
        ]);

        $source = $this->makePeriod(2025, 2, Period::ESTATUS_CERRADO);
        $this->assignStudent($student, $source, [
            'Estatus' => Student::STATUS_ACTIVO,
            'Empresa' => 'ACME',
            'Numero_convenio' => 'AC-25',
        ]);
        $this->assignStudent($droppedStudent, $source, [
            'Estatus' => Student::STATUS_BAJA,
            'Motivo_baja' => 'Cambio de residencia',
            'Fecha_baja' => '2025-04-01',
        ]);

        Sanctum::actingAs($admin, ['admin']);

        $createResponse = $this->postJson('/api/periods', [
            'year' => 2026,
            'number' => 1,
            'status' => Period::ESTATUS_BORRADOR,
            'starts_at' => '2026-01-20',
            'ends_at' => '2026-06-20',
            'clone_students_from_period_id' => $source->id,
        ]);

        $createResponse
            ->assertCreated()
            ->assertJsonPath('codigo', '2026-1')
            ->assertJsonPath('estatus', Period::ESTATUS_BORRADOR);

        $period = Period::query()->where('codigo', '2026-1')->firstOrFail();
        $this->assertSame(2, StudentPeriod::query()->where('periodo_id', $period->id)->count());

        $this->putJson("/api/periods/{$period->id}", [
            'anio' => 2026,
            'numero' => 1,
            'estatus' => Period::ESTATUS_ACTIVO,
            'fecha_inicio' => '2026-01-20',
            'fecha_fin' => '2026-06-20',
        ])
            ->assertOk()
            ->assertJsonPath('estatus', Period::ESTATUS_ACTIVO);

        $this->getJson('/api/periods?with_students=1')
            ->assertOk()
            ->assertJsonFragment(['codigo' => '2026-1'])
            ->assertJsonFragment(['students_count' => 2]);

        $this->getJson("/api/periods/{$period->id}?with_students=1")
            ->assertOk()
            ->assertJsonPath('students_count', 2)
            ->assertJsonPath('active_students_count', 1)
            ->assertJsonPath('dropped_students_count', 1);

        StudentPeriod::query()
            ->where('student_id', $student->id)
            ->where('periodo_id', $period->id)
            ->firstOrFail()
            ->update([
                'Primer_login_at' => '2026-02-01 10:00:00',
                'Ultimo_login_at' => '2026-02-03 12:30:00',
                'Origen_login' => 'login',
            ]);

        $this->postJson("/api/periods/{$period->id}/students/sync", [
            'with_students' => true,
            'replace_missing' => true,
            'students' => [
                [
                    'student_id' => $student->id,
                    'estatus' => Student::STATUS_ACTIVO,
                    'semestre' => 9,
                    'carrera' => 'Ingenieria Industrial',
                    'empresa' => 'ACME Norte',
                    'numero_convenio' => 'AC-26',
                    'fecha_alta' => '2026-01-21',
                ],
            ],
        ])
            ->assertOk()
            ->assertJsonPath('students_count', 1)
            ->assertJsonPath('student_assignments.0.Empresa', 'ACME Norte');

        $this->assertDatabaseMissing('students_period', [
            'student_id' => $droppedStudent->id,
            'periodo_id' => $period->id,
        ]);

        $syncedAssignment = StudentPeriod::query()
            ->where('student_id', $student->id)
            ->where('periodo_id', $period->id)
            ->firstOrFail();
        $this->assertSame('2026-02-01 10:00:00', $syncedAssignment->Primer_login_at?->format('Y-m-d H:i:s'));
        $this->assertSame('2026-02-03 12:30:00', $syncedAssignment->Ultimo_login_at?->format('Y-m-d H:i:s'));
        $this->assertSame('login', $syncedAssignment->Origen_login);

        $evidence = $this->makeEvidence($admin, 'inscripcion');
        $report = $this->makeReport($evidence, $period, $admin);
        $this->makeSubmission($report, $student, [
            'status' => 'aceptado',
        ]);

        $this->getJson("/api/periods/{$period->id}/statistics")
            ->assertOk()
            ->assertJsonPath('period.codigo', '2026-1')
            ->assertJsonPath('summary.alumnos', 1)
            ->assertJsonPath('summary.activos', 1)
            ->assertJsonPath('summary.empresas_vinculadas', 1)
            ->assertJsonPath('summary.reportes', 1)
            ->assertJsonPath('summary.entregas', 1)
            ->assertJsonPath('submission_breakdown.1.status', 'aceptado')
            ->assertJsonPath('submission_breakdown.1.total', 1);

        $target = $this->makePeriod(2026, 2, Period::ESTATUS_BORRADOR);

        $this->postJson("/api/periods/{$target->id}/students/clone", [
            'source_period_id' => $period->id,
            'overwrite_existing' => true,
        ])
            ->assertOk()
            ->assertJsonPath('students_count', 1);

        $this->postJson("/api/periods/{$period->id}/close")
            ->assertOk()
            ->assertJsonPath('estatus', Period::ESTATUS_CERRADO);

        $this->assertNotNull(
            StudentPeriod::query()
                ->where('student_id', $student->id)
                ->where('periodo_id', $period->id)
                ->value('Fecha_cierre')
        );

        $this->putJson("/api/periods/{$period->id}", [
            'anio' => 2026,
            'numero' => 1,
        ])
            ->assertStatus(422)
            ->assertJsonPath('message', 'El periodo cerrado solo permite consulta y estadisticas.');

        $this->postJson("/api/periods/{$period->id}/activate")
            ->assertStatus(422)
            ->assertJsonPath('message', 'No puedes activar un periodo cerrado.');

        $this->postJson("/api/periods/{$target->id}/activate")
            ->assertOk()
            ->assertJsonPath('estatus', Period::ESTATUS_ACTIVO);

        $this->assertSame($studentUser->id, $student->user_id);
    }
}
