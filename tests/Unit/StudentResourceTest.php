<?php

namespace Tests\Unit;

use App\Http\Resources\StudentResource;
use App\Models\Period;
use App\Models\Student;
use App\Models\StudentPeriod;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StudentResourceTest extends TestCase
{
    use RefreshDatabase;

    public function test_student_resource_uses_period_assignment_data_when_loaded(): void
    {
        $user = User::factory()->create([
            'email' => 'resource-student@example.test',
            'role' => 'student',
        ]);

        $student = Student::query()->forceCreate([
            'user_id' => $user->id,
            'Nombre' => 'Alma',
            'Apellidos' => 'Recurso',
            'No_control' => 22334012,
            'Semestre' => 6,
            'Carrera' => 'Ingenieria Industrial',
            'Correo_institucional' => '22334012@example.test',
        ]);

        $period = Period::query()->create([
            'anio' => 2026,
            'numero' => 1,
            'codigo' => '2026-1',
            'estatus' => Period::ESTATUS_ACTIVO,
        ]);

        StudentPeriod::query()->create([
            'student_id' => $student->id,
            'periodo_id' => $period->id,
            'Estatus' => Student::STATUS_ACTIVO,
            'Semestre' => 8,
            'Carrera' => 'Ingenieria en Sistemas Computacionales',
            'Empresa' => 'Empresa Demo',
            'Numero_convenio' => 'CONV-2026',
            'Motivo_baja' => null,
        ]);

        $student->submitted_reports_count = 2;
        $student->assigned_reports_count = 5;
        $student->progress_percent = 40;
        $student->load(['user', 'periodAssignments.period']);

        $payload = (new StudentResource($student))->toArray(request());

        $this->assertSame($student->id, $payload['id']);
        $this->assertSame('Alma', $payload['Nombre']);
        $this->assertSame('resource-student@example.test', $payload['Correo']);
        $this->assertSame('Ingenieria en Sistemas Computacionales', $payload['Carrera']);
        $this->assertSame(8, $payload['Semestre']);
        $this->assertSame('Empresa Demo', $payload['Empresa']);
        $this->assertSame('CONV-2026', $payload['Numero_convenio']);
        $this->assertSame(Student::STATUS_ACTIVO, $payload['estatus']);
        $this->assertSame($period->id, $payload['period']['id']);
        $this->assertSame('2026-1', $payload['period']['codigo']);
        $this->assertSame(2, $payload['submitted_reports_count']);
        $this->assertSame(5, $payload['assigned_reports_count']);
        $this->assertSame(40, $payload['progress_percent']);
    }
}
