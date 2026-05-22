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

class StudentSubmissionFlowTest extends TestCase
{
    use BuildsAcademicScenarios;
    use RefreshDatabase;

    public function test_student_profile_evidence_submission_and_staff_review_workflow(): void
    {
        Storage::fake('public');

        $career = 'Ingenieria Industrial';
        $admin = $this->makeAdmin([
            'email' => 'workflow-admin@example.test',
        ]);
        $coordinator = $this->makeCoordinator($career, [
            'email' => 'workflow-coord@example.test',
        ]);
        [$studentUser, $student] = $this->makeStudent($career, [
            'email' => 'workflow-student@example.test',
        ], [
            'No_control' => 22332001,
            'Nombre' => 'Lina',
            'Apellidos' => 'Soto',
        ]);
        $period = $this->makePeriod(2026, 1, Period::ESTATUS_ACTIVO);
        $this->assignStudent($student, $period, [
            'Estatus' => Student::STATUS_ACTIVO,
            'Empresa' => 'Nova',
            'Numero_convenio' => 'NV-01',
        ]);

        $inscripcion = $this->makeEvidence($admin, 'inscripcion', [
            'titulo' => 'Ingreso',
        ]);
        $programa = $this->makeEvidence($admin, 'programa', [
            'titulo' => 'Programa',
        ]);
        $ingresoReport = $this->makeReport($inscripcion, $period, $admin, [
            'titulo' => 'Ficha inicial',
        ]);
        $programaReport = $this->makeReport($programa, $period, $admin, [
            'titulo' => 'Plan de actividades',
        ]);

        Sanctum::actingAs($studentUser, ['student']);

        $this->getJson("/api/student/me?periodo_id={$period->id}")
            ->assertOk()
            ->assertJsonPath('student.Nombre', 'Lina')
            ->assertJsonPath('student.Estatus', Student::STATUS_ACTIVO)
            ->assertJsonPath('period.codigo', '2026-1');

        $this->patchJson("/api/student/me?periodo_id={$period->id}", [
            'telefono' => '6621112233',
            'direccion' => 'Avenida Central',
        ])
            ->assertOk()
            ->assertJsonPath('message', 'Perfil actualizado correctamente.')
            ->assertJsonPath('student.Telefono', '6621112233')
            ->assertJsonPath('student.Direccion', 'Avenida Central');

        $this->getJson("/api/student/evidences?periodo_id={$period->id}")
            ->assertOk()
            ->assertJsonCount(2)
            ->assertJsonPath('0.tipo', 'inscripcion')
            ->assertJsonPath('1.tipo', 'programa');

        $this->getJson("/api/student/reports?periodo_id={$period->id}")
            ->assertOk()
            ->assertJsonCount(2);

        $firstSubmit = $this->post("/api/student/reports/{$programaReport->id}/submit", [
            'file' => UploadedFile::fake()->create('plan-v1.pdf', 8),
        ]);

        $firstSubmit
            ->assertCreated()
            ->assertJsonPath('status', 'enviado')
            ->assertJsonPath('original_name', 'plan-v1.pdf');

        $firstPath = (string) $firstSubmit->json('file_path');
        Storage::disk('public')->assertExists($firstPath);

        $secondSubmit = $this->post("/api/student/reports/{$programaReport->id}/submit", [
            'file' => UploadedFile::fake()->create('plan-final.pdf', 8),
        ]);

        $secondSubmit
            ->assertCreated()
            ->assertJsonPath('original_name', 'plan-final.pdf');

        Storage::disk('public')->assertMissing($firstPath);
        Storage::disk('public')->assertExists((string) $secondSubmit->json('file_path'));

        $this->assertDatabaseCount('submissions', 1);
        $submissionId = (int) $this->getJson("/api/student/reports?periodo_id={$period->id}")
            ->json('1.submissions.0.id', 0);

        Sanctum::actingAs($admin, ['admin']);

        $this->getJson("/api/admin/report-submissions?periodo_id={$period->id}&status=enviado")
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.original_name', 'plan-final.pdf');

        $submissionId = $submissionId ?: (int) $this->getJson("/api/admin/report-submissions?periodo_id={$period->id}")
            ->json('0.id');

        $this->patchJson("/api/admin/report-submissions/{$submissionId}", [
            'status' => 'aceptado',
            'feedback' => 'Correcto',
            'calificacion' => 95,
        ])
            ->assertOk()
            ->assertJsonPath('status', 'aceptado')
            ->assertJsonPath('feedback', 'Correcto')
            ->assertJsonPath('calificacion', 95);

        $this->getJson("/api/students/{$student->id}/details?periodo_id={$period->id}")
            ->assertOk()
            ->assertJsonPath('student.Nombre', 'Lina')
            ->assertJsonCount(2, 'documents.spaces')
            ->assertJsonCount(1, 'documents.sent')
            ->assertJsonCount(1, 'documents.missing')
            ->assertJsonPath('documents.sent.0.status', 'aceptado')
            ->assertJsonPath('documents.missing.0.id', $ingresoReport->id);

        Sanctum::actingAs($coordinator, ['coordinator']);

        $this->getJson("/api/coordinator/report-submissions?periodo_id={$period->id}")
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.student.Nombre', 'Lina');
    }

    public function test_coordinator_cannot_access_submission_from_another_career(): void
    {
        Storage::fake('public');

        $admin = $this->makeAdmin([
            'email' => 'forbidden-admin@example.test',
        ]);
        $coordinator = $this->makeCoordinator('Ingenieria Mecanica', [
            'email' => 'forbidden-coord@example.test',
        ]);
        [, $student] = $this->makeStudent('Ingenieria Industrial', [
            'email' => 'forbidden-student@example.test',
        ], [
            'No_control' => 22332002,
        ]);
        $period = $this->makePeriod(2026, 2, Period::ESTATUS_ACTIVO);
        $this->assignStudent($student, $period, [
            'Carrera' => 'Ingenieria Industrial',
        ]);
        $evidence = $this->makeEvidence($admin, 'inscripcion');
        $report = $this->makeReport($evidence, $period, $admin);
        Storage::disk('public')->put('submissions/forbidden.pdf', '%PDF-1.4');
        $submission = $this->makeSubmission($report, $student, [
            'file_path' => 'submissions/forbidden.pdf',
            'original_name' => 'forbidden.pdf',
        ]);

        Sanctum::actingAs($coordinator, ['coordinator']);

        $this->getJson("/api/coordinator/report-submissions/{$submission->id}/preview")
            ->assertStatus(403)
            ->assertJsonPath('message', 'No puedes acceder a entregas de otra carrera.');
    }

    public function test_student_cannot_submit_or_download_reports_unavailable_for_period_status(): void
    {
        Storage::fake('public');

        $admin = $this->makeAdmin([
            'email' => 'eligibility-admin@example.test',
        ]);
        [$studentUser, $student] = $this->makeStudent('Ingenieria Industrial', [
            'email' => 'eligibility-student@example.test',
        ], [
            'No_control' => 22332003,
        ]);
        $period = $this->makePeriod(2026, 1, Period::ESTATUS_ACTIVO);
        $entryEvidence = $this->makeEvidence($admin, 'inscripcion');
        $entryReport = $this->makeReport($entryEvidence, $period, $admin, [
            'has_attachment' => true,
            'attachment_path' => 'reports/ficha-base.pdf',
        ]);
        Storage::disk('public')->put('reports/ficha-base.pdf', '%PDF-1.4 entry');

        Sanctum::actingAs($studentUser, ['student']);

        $this->post("/api/student/reports/{$entryReport->id}/submit", [
            'file' => UploadedFile::fake()->create('ficha.pdf', 8),
        ])
            ->assertStatus(403)
            ->assertJsonPath('message', 'No perteneces al periodo de esta entrega.');

        $this->getJson("/api/student/reports/{$entryReport->id}/attachment")
            ->assertStatus(403)
            ->assertJsonPath('message', 'No perteneces al periodo de este reporte.');

        $this->assertDatabaseMissing('students_period', [
            'student_id' => $student->id,
            'periodo_id' => $period->id,
        ]);

        $this->assignStudent($student, $period, [
            'Estatus' => Student::STATUS_INACTIVO,
            'Empresa' => null,
            'Numero_convenio' => null,
        ]);

        $programEvidence = $this->makeEvidence($admin, 'programa');
        $programReport = $this->makeReport($programEvidence, $period, $admin, [
            'has_attachment' => true,
            'attachment_path' => 'reports/programa-base.pdf',
        ]);
        Storage::disk('public')->put('reports/programa-base.pdf', '%PDF-1.4 program');

        $this->post("/api/student/reports/{$programReport->id}/submit", [
            'file' => UploadedFile::fake()->create('programa.pdf', 8),
        ])
            ->assertStatus(403)
            ->assertJsonPath('message', 'No puedes entregar este reporte con tu estatus actual.');

        $this->getJson("/api/student/reports/{$programReport->id}/attachment")
            ->assertStatus(403)
            ->assertJsonPath('message', 'No puedes acceder a este reporte con tu estatus actual.');

        $this->assertDatabaseCount('submissions', 0);
    }
}
