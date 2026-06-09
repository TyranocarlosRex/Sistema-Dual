<?php

namespace Tests\Feature;

use App\Models\Evidence;
use App\Models\Period;
use App\Models\Report;
use App\Models\Student;
use App\Models\StudentPeriod;
use App\Models\Submission;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SecurityAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_access_protected_students_endpoint(): void
    {
        $this->getJson('/api/students')->assertStatus(401);
    }

    public function test_student_token_cannot_access_admin_evidences_endpoint(): void
    {
        $user = User::factory()->create(['role' => 'student']);

        Sanctum::actingAs($user, ['student']);

        $this->getJson('/api/evidences')->assertStatus(403);
    }

    public function test_student_role_cannot_access_staff_indexes_even_with_privileged_ability(): void
    {
        $user = User::factory()->create(['role' => 'student']);

        Sanctum::actingAs($user, ['admin', 'coordinator']);

        $this->getJson('/api/students')->assertStatus(403);
        $this->getJson('/api/coordinators')->assertStatus(403);
    }

    public function test_coordinator_token_cannot_call_admin_me(): void
    {
        $user = User::factory()->create(['role' => 'coordinator']);

        Sanctum::actingAs($user, ['coordinator']);

        $this->getJson('/api/admin/me')->assertStatus(403);
    }

    public function test_token_without_student_profile_cannot_submit_report(): void
    {
        Storage::fake('public');

        $admin = User::factory()->create(['role' => 'admin']);
        $evidence = Evidence::create([
            'titulo'      => 'Entrega de documentos',
            'descripcion' => 'Prueba',
            'tipo'        => 'inscripcion',
            'created_by'  => $admin->id,
        ]);
        $report = Report::create([
            'evidence_id' => $evidence->id,
            'titulo'      => 'Ficha',
            'descripcion' => 'Sube tu ficha',
            'created_by'  => $admin->id,
            'has_attachment' => false,
        ]);

        $user = User::factory()->create(['role' => 'student']);
        Sanctum::actingAs($user, ['student']);

        $response = $this->postJson("/api/student/reports/{$report->id}/submit", [
            'file' => UploadedFile::fake()->create('ficha.pdf', 10),
        ]);

        $response->assertStatus(403)->assertJsonFragment([
            'message' => 'No tienes perfil de estudiante.',
        ]);
        $this->assertSame(0, Submission::count());
        $this->assertEmpty(Storage::disk('public')->allFiles());
    }

    public function test_student_below_seventh_semester_cannot_use_existing_token(): void
    {
        $user = User::factory()->create(['role' => 'student']);
        $student = Student::query()->forceCreate([
            'user_id' => $user->id,
            'Nombre' => 'Alumno',
            'Apellidos' => 'Sexto',
            'No_control' => 22330005,
            'Semestre' => 8,
            'Carrera' => 'Ingenieria Industrial',
            'Correo_institucional' => '22330005@example.test',
        ]);
        $period = Period::query()->create([
            'anio' => 2026,
            'numero' => 1,
            'codigo' => '2026-1',
            'estatus' => Period::ESTATUS_ACTIVO,
            'fecha_inicio' => '2026-01-15',
            'fecha_fin' => '2026-06-30',
        ]);

        StudentPeriod::query()->create([
            'student_id' => $student->id,
            'periodo_id' => $period->id,
            'Estatus' => Student::STATUS_ACTIVO,
            'Semestre' => 6,
            'Carrera' => 'Ingenieria Industrial',
            'Fecha_alta' => '2026-01-15',
        ]);

        Sanctum::actingAs($user, ['student']);

        $this->getJson('/api/student/me')
            ->assertStatus(403)
            ->assertJsonPath('message', 'Solo estudiantes de septimo semestre en adelante pueden acceder.');

        $this->getJson('/api/advertisements')
            ->assertStatus(403)
            ->assertJsonPath('message', 'Solo estudiantes de septimo semestre en adelante pueden acceder.');
    }

    public function test_role_mismatch_token_is_blocked_from_publishing_advertisement(): void
    {
        $user = User::factory()->create(['role' => 'student']);

        Sanctum::actingAs($user, ['admin']);

        $response = $this->postJson('/api/advertisements', [
            'titulo'      => 'Aviso de prueba',
            'mensaje'     => 'Contenido',
            'target_role' => 'student',
        ]);

        $response->assertStatus(403);
    }
}
