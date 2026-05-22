<?php

namespace Tests\Unit;

use App\Models\Period;
use App\Models\Student;
use App\Models\StudentPeriod;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StudentEnrollmentTest extends TestCase
{
    use RefreshDatabase;

    public function test_period_helpers_create_and_find_student_enrollments(): void
    {
        $student = $this->makeStudent([
            'No_control' => 22334001,
        ]);
        $period = $this->makePeriod(2026, 1);

        $this->assertNull($student->enrollmentForPeriod(null));
        $this->assertNull($student->ensureEnrollmentForPeriod(null));

        $assignment = $student->ensureEnrollmentForPeriod($period->id);

        $this->assertNotNull($assignment);
        $this->assertSame(Student::STATUS_INACTIVO, $assignment->Estatus);
        $this->assertSame('Ingenieria Industrial', $assignment->Carrera);
        $this->assertSame(8, $assignment->Semestre);
        $this->assertSame($assignment->id, $student->enrollmentForPeriod($period->id)?->id);
        $this->assertSame(Student::STATUS_INACTIVO, $student->statusForPeriod($period->id));
        $this->assertSame($period->id, $student->periods()->first()?->id);
    }

    public function test_ensure_enrollment_backfills_blank_assignment_fields(): void
    {
        $student = $this->makeStudent([
            'No_control' => 22334002,
            'Semestre' => 7,
        ]);
        $period = $this->makePeriod(2026, 2);

        $assignment = StudentPeriod::query()->create([
            'student_id' => $student->id,
            'periodo_id' => $period->id,
            'Estatus' => Student::STATUS_ACTIVO,
            'Semestre' => null,
            'Carrera' => null,
            'Fecha_alta' => $period->fecha_inicio?->toDateString(),
        ]);

        $student->load('periodAssignments');

        $this->assertSame($assignment->id, $student->enrollmentForPeriod($period->id)?->id);

        $filled = $student->ensureEnrollmentForPeriod($period->id);

        $this->assertNotNull($filled);
        $this->assertSame('Ingenieria Industrial', $filled->fresh()?->Carrera);
        $this->assertSame(7, $filled->fresh()?->Semestre);
    }

    private function makeStudent(array $overrides = []): Student
    {
        $user = User::factory()->create([
            'role' => 'student',
        ]);

        return Student::query()->forceCreate(array_merge([
            'user_id' => $user->id,
            'Nombre' => 'Alma',
            'Apellidos' => 'Prueba',
            'No_control' => 22334000,
            'Semestre' => 8,
            'Carrera' => 'Ingenieria Industrial',
            'Correo_institucional' => 'student-enrollment@example.test',
        ], $overrides));
    }

    private function makePeriod(int $year, int $number): Period
    {
        return Period::query()->create([
            'anio' => $year,
            'numero' => $number,
            'codigo' => "{$year}-{$number}",
            'estatus' => Period::ESTATUS_ACTIVO,
            'fecha_inicio' => "{$year}-01-15",
            'fecha_fin' => "{$year}-06-30",
        ]);
    }
}
