<?php

namespace Tests\Feature;

use App\Models\Evidence;
use App\Models\Report;
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
