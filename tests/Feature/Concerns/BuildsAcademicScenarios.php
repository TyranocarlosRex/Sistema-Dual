<?php

namespace Tests\Feature\Concerns;

use App\Models\Admin;
use App\Models\Coordinator;
use App\Models\Evidence;
use App\Models\Period;
use App\Models\Report;
use App\Models\Student;
use App\Models\StudentPeriod;
use App\Models\Submission;
use App\Models\User;

trait BuildsAcademicScenarios
{
    protected function makeAdmin(array $userOverrides = [], array $adminOverrides = []): User
    {
        $user = User::factory()->create(array_merge([
            'name' => 'Ada Admin',
            'email' => 'admin@example.test',
            'password' => 'secret123',
            'role' => 'admin',
        ], $userOverrides));

        Admin::query()->create(array_merge([
            'user_id' => $user->id,
            'nombre' => 'Ada',
            'apellidos' => 'Admin',
        ], $adminOverrides));

        return $user->load('admin');
    }

    protected function makeCoordinator(
        string $career = 'Ingenieria Industrial',
        array $userOverrides = [],
        array $coordinatorOverrides = []
    ): User {
        $user = User::factory()->create(array_merge([
            'name' => 'Cora Coord',
            'email' => 'coordinator@example.test',
            'password' => 'secret123',
            'role' => 'coordinator',
        ], $userOverrides));

        Coordinator::query()->create(array_merge([
            'user_id' => $user->id,
            'Nombre' => 'Cora',
            'Apellidos' => 'Coord',
            'Carrera' => $career,
        ], $coordinatorOverrides));

        return $user->load('coordinator');
    }

    protected function makeStudent(
        string $career = 'Ingenieria Industrial',
        array $userOverrides = [],
        array $studentOverrides = []
    ): array {
        $noControl = $studentOverrides['No_control'] ?? random_int(22000000, 22999999);

        $user = User::factory()->create(array_merge([
            'name' => 'Alma Alumna',
            'email' => "student{$noControl}@example.test",
            'password' => 'secret123',
            'role' => 'student',
        ], $userOverrides));

        $student = Student::query()->forceCreate(array_merge([
            'user_id' => $user->id,
            'Nombre' => 'Alma',
            'Apellidos' => 'Alumna',
            'No_control' => $noControl,
            'Semestre' => 8,
            'Direccion' => 'Calle Uno',
            'Telefono' => '6620000000',
            'Correo_institucional' => "{$noControl}@itson.edu.mx",
            'Carrera' => $career,
        ], $studentOverrides));

        return [$user->load('student'), $student];
    }

    protected function makePeriod(
        int $year = 2026,
        int $number = 1,
        string $status = Period::ESTATUS_ACTIVO,
        array $overrides = []
    ): Period {
        return Period::query()->create(array_merge([
            'anio' => $year,
            'numero' => $number,
            'codigo' => "{$year}-{$number}",
            'estatus' => $status,
            'fecha_inicio' => "{$year}-01-15",
            'fecha_fin' => "{$year}-06-30",
        ], $overrides));
    }

    protected function assignStudent(Student $student, Period $period, array $overrides = []): StudentPeriod
    {
        return StudentPeriod::query()->create(array_merge([
            'student_id' => $student->id,
            'periodo_id' => $period->id,
            'Estatus' => Student::STATUS_ACTIVO,
            'Semestre' => $student->Semestre,
            'Carrera' => $student->Carrera,
            'Empresa' => 'Empresa Demo',
            'Numero_convenio' => 'CV-2026-001',
            'Fecha_alta' => $period->fecha_inicio?->toDateString() ?? now()->toDateString(),
        ], $overrides));
    }

    protected function makeEvidence(User $creator, string $type = 'inscripcion', array $overrides = []): Evidence
    {
        return Evidence::query()->create(array_merge([
            'titulo' => $type === 'inscripcion' ? 'Documentos de ingreso' : 'Programa dual',
            'descripcion' => 'Espacio de prueba',
            'tipo' => $type,
            'created_by' => $creator->id,
        ], $overrides));
    }

    protected function makeReport(Evidence $evidence, Period $period, User $creator, array $overrides = []): Report
    {
        return Report::query()->create(array_merge([
            'evidence_id' => $evidence->id,
            'periodo_id' => $period->id,
            'titulo' => 'Entrega de prueba',
            'descripcion' => 'Sube el documento solicitado',
            'fecha_limite' => $period->fecha_fin?->toDateString(),
            'has_attachment' => false,
            'attachment_path' => null,
            'created_by' => $creator->id,
        ], $overrides));
    }

    protected function makeSubmission(Report $report, Student $student, array $overrides = []): Submission
    {
        return Submission::query()->create(array_merge([
            'report_id' => $report->id,
            'evidence_id' => $report->evidence_id,
            'periodo_id' => $report->periodo_id,
            'student_id' => $student->id,
            'file_path' => 'submissions/prueba.pdf',
            'original_name' => 'prueba.pdf',
            'status' => 'enviado',
        ], $overrides));
    }
}
