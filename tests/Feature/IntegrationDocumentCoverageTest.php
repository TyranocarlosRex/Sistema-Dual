<?php

namespace Tests\Feature;

use App\Models\Period;
use App\Models\Student;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\Feature\Concerns\BuildsAcademicScenarios;
use Tests\TestCase;

class IntegrationDocumentCoverageTest extends TestCase
{
    use BuildsAcademicScenarios;
    use RefreshDatabase;

    public function test_student_can_download_available_report_base_attachment(): void
    {
        $admin = $this->makeAdmin([
            'email' => 'base-download-admin@example.test',
        ]);
        [$studentUser, $student] = $this->makeStudent('Ingenieria Industrial', [
            'email' => 'base-download-student@example.test',
        ], [
            'No_control' => 22335001,
        ]);
        $period = $this->makePeriod(2026, 1, Period::ESTATUS_ACTIVO);
        $this->assignStudent($student, $period, [
            'Estatus' => Student::STATUS_ACTIVO,
        ]);
        $evidence = $this->makeEvidence($admin, 'programa');
        $attachmentPath = 'reports/formato-base-integracion.pdf';
        Storage::disk('public')->put($attachmentPath, '%PDF-1.4 base attachment');
        $report = $this->makeReport($evidence, $period, $admin, [
            'titulo' => 'Formato base',
            'has_attachment' => true,
            'attachment_path' => $attachmentPath,
        ]);

        Sanctum::actingAs($studentUser, ['student']);

        $response = $this->get("/api/student/reports/{$report->id}/attachment");

        $response->assertOk();
        $this->assertStringStartsWith(
            'attachment',
            (string) $response->headers->get('content-disposition')
        );
        $response->assertHeader('x-download-filename', 'formato-base-integracion.pdf');

        Storage::disk('public')->delete($attachmentPath);
    }

    public function test_coordinator_can_review_submission_from_same_career(): void
    {
        $career = 'Ingenieria Industrial';
        $admin = $this->makeAdmin([
            'email' => 'coord-review-admin@example.test',
        ]);
        $coordinator = $this->makeCoordinator($career, [
            'email' => 'coord-review@example.test',
        ]);
        [, $student] = $this->makeStudent($career, [
            'email' => 'coord-review-student@example.test',
        ], [
            'No_control' => 22335002,
        ]);
        $period = $this->makePeriod(2026, 2, Period::ESTATUS_ACTIVO);
        $this->assignStudent($student, $period, [
            'Carrera' => $career,
        ]);
        $evidence = $this->makeEvidence($admin, 'inscripcion');
        $report = $this->makeReport($evidence, $period, $admin);
        $submission = $this->makeSubmission($report, $student, [
            'status' => 'enviado',
            'feedback' => null,
            'calificacion' => null,
        ]);

        Sanctum::actingAs($coordinator, ['coordinator']);

        $this->patchJson("/api/coordinator/report-submissions/{$submission->id}", [
            'status' => 'rechazado',
            'feedback' => 'Corregir el documento enviado.',
            'calificacion' => 70,
        ])
            ->assertOk()
            ->assertJsonPath('status', 'rechazado')
            ->assertJsonPath('feedback', 'Corregir el documento enviado.')
            ->assertJsonPath('calificacion', 70)
            ->assertJsonPath('student.No_control', 22335002);

        $this->assertDatabaseHas('submissions', [
            'id' => $submission->id,
            'status' => 'rechazado',
            'feedback' => 'Corregir el documento enviado.',
            'calificacion' => 70,
        ]);
    }

    public function test_admin_can_download_submitted_file(): void
    {
        Storage::fake('public');

        $admin = $this->makeAdmin([
            'email' => 'admin-download-submission@example.test',
        ]);
        [, $student] = $this->makeStudent('Ingenieria Industrial', [
            'email' => 'admin-download-student@example.test',
        ], [
            'No_control' => 22335003,
        ]);
        $period = $this->makePeriod(2026, 3, Period::ESTATUS_ACTIVO);
        $this->assignStudent($student, $period);
        $evidence = $this->makeEvidence($admin, 'inscripcion');
        $report = $this->makeReport($evidence, $period, $admin);
        Storage::disk('public')->put('submissions/admin-review.pdf', '%PDF-1.4 reviewed');
        $submission = $this->makeSubmission($report, $student, [
            'file_path' => 'submissions/admin-review.pdf',
            'original_name' => 'admin-review.pdf',
        ]);

        Sanctum::actingAs($admin, ['admin']);

        $response = $this->get("/api/admin/report-submissions/{$submission->id}/download");

        $response->assertOk();
        $this->assertStringStartsWith(
            'attachment',
            (string) $response->headers->get('content-disposition')
        );
        $response->assertHeader('x-download-filename', 'admin-review.pdf');
    }

    public function test_coordinator_can_publish_advertisement(): void
    {
        Storage::fake('public');

        $coordinator = $this->makeCoordinator('Ingenieria Industrial', [
            'email' => 'announcement-coordinator@example.test',
        ]);

        Sanctum::actingAs($coordinator, ['coordinator']);

        $response = $this->post('/api/advertisements', [
            'titulo' => 'Aviso de coordinacion',
            'mensaje' => 'Revisar fechas de entrega.',
            'target_role' => 'student',
            'target_carrera' => 'Ingenieria Industrial',
            'attachment' => UploadedFile::fake()->create('aviso-coordinador.pdf', 4),
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('titulo', 'Aviso de coordinacion')
            ->assertJsonPath('target_role', 'student')
            ->assertJsonPath('target_carrera', 'Ingenieria Industrial')
            ->assertJsonPath('created_by', $coordinator->id);

        $this->assertDatabaseHas('advertisements', [
            'titulo' => 'Aviso de coordinacion',
            'target_role' => 'student',
            'target_carrera' => 'Ingenieria Industrial',
            'created_by' => $coordinator->id,
        ]);
        Storage::disk('public')->assertExists((string) $response->json('attachment_path'));
    }

    public function test_admin_document_import_rejects_invalid_file_type(): void
    {
        $admin = $this->makeAdmin([
            'email' => 'invalid-import-admin@example.test',
        ]);

        Sanctum::actingAs($admin, ['admin']);

        $this->postJson('/api/document-imports', [
            'file' => UploadedFile::fake()->create('plantilla.exe', 1),
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['file']);
    }

    public function test_admin_document_import_rejects_oversized_file(): void
    {
        $admin = $this->makeAdmin([
            'email' => 'oversized-import-admin@example.test',
        ]);

        Sanctum::actingAs($admin, ['admin']);

        $this->postJson('/api/document-imports', [
            'file' => UploadedFile::fake()->create('plantilla.txt', 8000),
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['file']);
    }

    public function test_api_validation_errors_return_clear_json_response(): void
    {
        $admin = $this->makeAdmin([
            'email' => 'validation-error-admin@example.test',
        ]);

        Sanctum::actingAs($admin, ['admin']);

        $this->postJson('/api/evidences', [
            'titulo' => '',
            'tipo' => 'tipo-invalido',
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['titulo', 'tipo']);
    }
}
