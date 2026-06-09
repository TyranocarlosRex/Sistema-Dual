<?php

namespace Tests\Unit;

use App\Models\Evidence;
use App\Models\Period;
use App\Models\Report;
use App\Models\Student;
use App\Models\StudentPeriod;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReportVisibilityTest extends TestCase
{
    use RefreshDatabase;

    public function test_inscription_reports_are_visible_to_any_period_assignment(): void
    {
        [$admin, $student, $period] = $this->makeBaseScenario();
        $assignment = $this->assignStudent($student, $period, Student::STATUS_INACTIVO);
        $evidence = $this->makeEvidence($admin, 'inscripcion');
        $report = $this->makeReport($admin, $evidence, $period);

        $this->assertTrue($report->isVisibleToStudentAssignment($assignment));
    }

    public function test_program_reports_are_visible_only_to_active_assignments(): void
    {
        [$admin, $student, $period] = $this->makeBaseScenario();
        $activeAssignment = $this->assignStudent($student, $period, Student::STATUS_ACTIVO);
        $programEvidence = $this->makeEvidence($admin, 'programa');
        $programReport = $this->makeReport($admin, $programEvidence, $period);

        $this->assertTrue($programReport->isVisibleToStudentAssignment($activeAssignment));

        $inactiveAssignment = new StudentPeriod([
            'Estatus' => Student::STATUS_INACTIVO,
            'Carrera' => 'Ingenieria Industrial',
            'Semestre' => 8,
        ]);

        $this->assertFalse($programReport->isVisibleToStudentAssignment($inactiveAssignment));
        $this->assertFalse($programReport->isVisibleToStudentAssignment(null));
    }

    private function makeBaseScenario(): array
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $studentUser = User::factory()->create(['role' => 'student']);
        $student = Student::query()->forceCreate([
            'user_id' => $studentUser->id,
            'Nombre' => 'Alumno',
            'Apellidos' => 'Visible',
            'No_control' => 22334013,
            'Semestre' => 8,
            'Carrera' => 'Ingenieria Industrial',
            'Correo_institucional' => '22334013@example.test',
        ]);
        $period = Period::query()->create([
            'anio' => 2026,
            'numero' => 1,
            'codigo' => '2026-1',
            'estatus' => Period::ESTATUS_ACTIVO,
        ]);

        return [$admin, $student, $period];
    }

    private function assignStudent(Student $student, Period $period, string $status): StudentPeriod
    {
        return StudentPeriod::query()->create([
            'student_id' => $student->id,
            'periodo_id' => $period->id,
            'Estatus' => $status,
            'Semestre' => 8,
            'Carrera' => 'Ingenieria Industrial',
        ]);
    }

    private function makeEvidence(User $admin, string $type): Evidence
    {
        return Evidence::query()->create([
            'titulo' => 'Evidencia ' . $type,
            'descripcion' => 'Descripcion',
            'fecha_limite' => '2026-06-01',
            'tipo' => $type,
            'is_active' => true,
            'created_by' => $admin->id,
        ]);
    }

    private function makeReport(User $admin, Evidence $evidence, Period $period): Report
    {
        return Report::query()->create([
            'evidence_id' => $evidence->id,
            'periodo_id' => $period->id,
            'titulo' => 'Reporte visible',
            'descripcion' => 'Descripcion',
            'created_by' => $admin->id,
        ]);
    }
}
