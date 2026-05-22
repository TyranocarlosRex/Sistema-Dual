<?php

namespace Tests\Feature;

use App\Models\Coordinator;
use App\Models\Evidence;
use App\Models\Report;
use App\Models\Student;
use App\Models\Submission;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SubmissionFileResponseTest extends TestCase
{
    use RefreshDatabase;

    public function test_coordinator_preview_streams_submission_inline(): void
    {
        Storage::fake('public');

        [$coordinatorUser, $submission] = $this->makeCoordinatorSubmission();

        Sanctum::actingAs($coordinatorUser, ['coordinator']);

        $response = $this->get("/api/coordinator/report-submissions/{$submission->id}/preview");

        $response->assertOk();
        $this->assertStringStartsWith(
            'inline',
            (string)$response->headers->get('content-disposition')
        );
        $response->assertHeader('x-download-filename', 'ficha.pdf');
    }

    public function test_coordinator_download_still_forces_attachment(): void
    {
        Storage::fake('public');

        [$coordinatorUser, $submission] = $this->makeCoordinatorSubmission();

        Sanctum::actingAs($coordinatorUser, ['coordinator']);

        $response = $this->get("/api/coordinator/report-submissions/{$submission->id}/download");

        $response->assertOk();
        $this->assertStringStartsWith(
            'attachment',
            (string)$response->headers->get('content-disposition')
        );
        $response->assertHeader('x-download-filename', 'ficha.pdf');
    }

    private function makeCoordinatorSubmission(): array
    {
        $career = 'Ingenieria Industrial';
        $admin = User::factory()->create(['role' => 'admin']);
        $coordinatorUser = User::factory()->create(['role' => 'coordinator']);
        $studentUser = User::factory()->create(['role' => 'student']);

        Coordinator::query()->create([
            'user_id' => $coordinatorUser->id,
            'Nombre' => 'Coordinador',
            'Apellidos' => 'Prueba',
            'Carrera' => $career,
        ]);

        $student = Student::query()->forceCreate([
            'user_id' => $studentUser->id,
            'Nombre' => 'Alumno',
            'Apellidos' => 'Prueba',
            'No_control' => 123456,
            'Semestre' => '8',
            'Carrera' => $career,
            'Correo_institucional' => 'alumno@example.test',
        ]);

        $evidence = Evidence::query()->create([
            'titulo' => 'Entrega de documentos',
            'descripcion' => 'Prueba',
            'tipo' => 'inscripcion',
            'created_by' => $admin->id,
        ]);

        $report = Report::query()->create([
            'evidence_id' => $evidence->id,
            'titulo' => 'Ficha',
            'descripcion' => 'Sube tu ficha',
            'created_by' => $admin->id,
            'has_attachment' => false,
        ]);

        Storage::disk('public')->put('submissions/ficha.pdf', '%PDF-1.4 test');

        $submission = Submission::query()->create([
            'report_id' => $report->id,
            'evidence_id' => $evidence->id,
            'student_id' => $student->id,
            'file_path' => 'submissions/ficha.pdf',
            'original_name' => 'ficha.pdf',
            'status' => 'enviado',
        ]);

        return [$coordinatorUser, $submission];
    }
}
