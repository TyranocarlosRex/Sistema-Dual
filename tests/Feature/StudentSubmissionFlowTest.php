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
        [, $assignedStudent] = $this->makeStudent($career, [
            'email' => 'workflow-assigned@example.test',
        ], [
            'No_control' => 22332002,
            'Nombre' => 'Marco',
            'Apellidos' => 'Vega',
        ]);
        $this->assignStudent($assignedStudent, $period, [
            'Estatus' => Student::STATUS_ACTIVO,
            'Empresa' => 'Nova',
            'Numero_convenio' => 'NV-02',
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

        Sanctum::actingAs($studentUser->fresh(), ['student']);

        $evidencesAfterLogin = $this->getJson("/api/student/evidences?periodo_id={$period->id}")
            ->assertOk();
        $programEvidencePayload = collect($evidencesAfterLogin->json())
            ->firstWhere('id', $programa->id);

        $this->assertSame(
            'plan-final.pdf',
            data_get($programEvidencePayload, 'reports.0.submissions.0.original_name')
        );

        $reportsAfterLogin = $this->getJson("/api/student/reports?periodo_id={$period->id}")
            ->assertOk();
        $programReportPayload = collect($reportsAfterLogin->json())
            ->firstWhere('id', $programaReport->id);

        $this->assertSame(
            'plan-final.pdf',
            data_get($programReportPayload, 'submissions.0.original_name')
        );

        $submissionId = (int) data_get($programReportPayload, 'submissions.0.id', 0);

        Sanctum::actingAs($admin, ['admin']);

        $this->getJson("/api/admin/report-submissions?periodo_id={$period->id}&status=enviado")
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.original_name', 'plan-final.pdf')
            ->assertJsonPath('0.report.evidence.assigned_students_count', 2);

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

        $adminEvidences = $this->getJson("/api/evidences?periodo_id={$period->id}&with_reports=1&only_with_reports=1")
            ->assertOk()
            ->assertJsonCount(2);

        $adminIngresoEvidencePayload = collect($adminEvidences->json())->firstWhere('id', $inscripcion->id);
        $this->assertSame(2, data_get($adminIngresoEvidencePayload, 'assigned_students_count'));
        $this->assertCount(1, data_get($adminIngresoEvidencePayload, 'reports', []));

        Sanctum::actingAs($coordinator, ['coordinator']);

        $this->getJson("/api/coordinator/report-submissions?periodo_id={$period->id}")
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.student.Nombre', 'Lina')
            ->assertJsonPath('0.report.evidence.assigned_students_count', 2);

        $coordinatorEvidences = $this->getJson("/api/coordinator/evidences?periodo_id={$period->id}&with_reports=1&only_with_reports=1")
            ->assertOk()
            ->assertJsonCount(2);

        $ingresoEvidencePayload = collect($coordinatorEvidences->json())->firstWhere('id', $inscripcion->id);
        $this->assertSame(2, data_get($ingresoEvidencePayload, 'assigned_students_count'));
        $this->assertCount(1, data_get($ingresoEvidencePayload, 'reports', []));
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

    public function test_staff_can_view_student_details_and_evidences_from_previous_period(): void
    {
        $career = 'Ingenieria Industrial';
        $admin = $this->makeAdmin([
            'email' => 'period-detail-admin@example.test',
        ]);
        $coordinator = $this->makeCoordinator($career, [
            'email' => 'period-detail-coord@example.test',
        ]);
        [, $student] = $this->makeStudent($career, [
            'email' => 'period-detail-student@example.test',
        ], [
            'No_control' => 22332008,
            'Nombre' => 'Paola',
            'Apellidos' => 'Rios',
        ]);

        $periodOne = $this->makePeriod(2026, 1, Period::ESTATUS_CERRADO);
        $periodTwo = $this->makePeriod(2026, 2, Period::ESTATUS_ACTIVO);

        $this->assignStudent($student, $periodOne, [
            'Estatus' => Student::STATUS_ACTIVO,
            'Empresa' => 'Empresa Primer Periodo',
            'Numero_convenio' => 'P1-001',
        ]);
        $this->assignStudent($student, $periodTwo, [
            'Estatus' => Student::STATUS_ACTIVO,
            'Empresa' => 'Empresa Segundo Periodo',
            'Numero_convenio' => 'P2-001',
        ]);

        $evidence = $this->makeEvidence($admin, 'programa', [
            'titulo' => 'Seguimiento dual',
        ]);
        $firstPeriodReport = $this->makeReport($evidence, $periodOne, $admin, [
            'titulo' => 'Reporte primer periodo',
        ]);
        $this->makeReport($evidence, $periodTwo, $admin, [
            'titulo' => 'Reporte segundo periodo',
        ]);
        $this->makeSubmission($firstPeriodReport, $student, [
            'original_name' => 'reporte-primer-periodo.pdf',
        ]);

        Sanctum::actingAs($admin, ['admin']);

        $this->getJson('/api/periods')
            ->assertOk()
            ->assertJsonPath('0.codigo', '2026-2')
            ->assertJsonPath('1.codigo', '2026-1');

        $this->getJson("/api/students/{$student->id}/details?periodo_id={$periodOne->id}")
            ->assertOk()
            ->assertJsonPath('period.codigo', '2026-1')
            ->assertJsonPath('student.Empresa', 'Empresa Primer Periodo')
            ->assertJsonPath('student.Numero_convenio', 'P1-001')
            ->assertJsonCount(1, 'documents.sent')
            ->assertJsonPath('documents.sent.0.original_name', 'reporte-primer-periodo.pdf')
            ->assertJsonCount(0, 'documents.missing');

        $this->getJson("/api/students/{$student->id}/details?periodo_id={$periodTwo->id}")
            ->assertOk()
            ->assertJsonPath('period.codigo', '2026-2')
            ->assertJsonPath('student.Empresa', 'Empresa Segundo Periodo')
            ->assertJsonPath('student.Numero_convenio', 'P2-001')
            ->assertJsonCount(0, 'documents.sent')
            ->assertJsonCount(1, 'documents.missing')
            ->assertJsonPath('documents.missing.0.titulo', 'Reporte segundo periodo');

        Sanctum::actingAs($coordinator, ['coordinator']);

        $this->getJson('/api/periods')
            ->assertOk()
            ->assertJsonPath('1.codigo', '2026-1');

        $this->getJson("/api/students/{$student->id}/details?periodo_id={$periodOne->id}")
            ->assertOk()
            ->assertJsonPath('period.codigo', '2026-1')
            ->assertJsonPath('student.Empresa', 'Empresa Primer Periodo')
            ->assertJsonCount(1, 'documents.sent')
            ->assertJsonPath('documents.sent.0.report.titulo', 'Reporte primer periodo');
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

        $hiddenEvidence = $this->makeEvidence($admin, 'inscripcion', [
            'titulo' => 'Oculta',
            'is_active' => false,
        ]);
        $hiddenReport = $this->makeReport($hiddenEvidence, $period, $admin);

        $this->getJson("/api/student/evidences?periodo_id={$period->id}")
            ->assertOk()
            ->assertJsonMissing(['titulo' => 'Oculta']);

        $this->post("/api/student/reports/{$hiddenReport->id}/submit", [
            'file' => UploadedFile::fake()->create('oculta.pdf', 8),
        ])
            ->assertStatus(403)
            ->assertJsonPath('message', 'No puedes entregar este reporte con tu estatus actual.');

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

    public function test_student_can_keep_preserved_submissions_between_periods(): void
    {
        Storage::fake('public');

        $admin = $this->makeAdmin([
            'email' => 'preserve-admin@example.test',
        ]);
        [$studentUser, $student] = $this->makeStudent('Ingenieria Industrial', [
            'email' => 'preserve-student@example.test',
        ], [
            'No_control' => 22332004,
        ]);

        $periodOne = $this->makePeriod(2026, 1, Period::ESTATUS_ACTIVO);
        $periodTwo = $this->makePeriod(2026, 2, Period::ESTATUS_ACTIVO);
        $this->assignStudent($student, $periodOne, ['Estatus' => Student::STATUS_ACTIVO]);
        $this->assignStudent($student, $periodTwo, ['Estatus' => Student::STATUS_ACTIVO]);

        $evidence = $this->makeEvidence($admin, 'programa', [
            'titulo' => 'Reporte reusable',
            'preserve_submissions_between_periods' => true,
        ]);
        $firstReport = $this->makeReport($evidence, $periodOne, $admin, [
            'titulo' => 'Plan de actividades',
        ]);
        $this->makeReport($evidence, $periodTwo, $admin, [
            'titulo' => 'Plan de actividades',
        ]);

        Sanctum::actingAs($studentUser, ['student']);

        $submissionResponse = $this->post("/api/student/reports/{$firstReport->id}/submit", [
            'file' => UploadedFile::fake()->create('plan-periodo-1.pdf', 8),
        ])->assertCreated();
        $submissionId = (int)$submissionResponse->json('id');

        $evidences = $this->getJson("/api/student/evidences?periodo_id={$periodTwo->id}")
            ->assertOk()
            ->assertJsonCount(1);

        $payload = $evidences->json('0');
        $this->assertSame('plan-periodo-1.pdf', data_get($payload, 'reports.0.submissions.0.original_name'));
        $this->assertTrue((bool)data_get($payload, 'reports.0.submissions.0.is_historical'));

        $this->getJson("/api/student/submissions/history?periodo_id={$periodTwo->id}")
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.id', $submissionId)
            ->assertJsonPath('0.original_name', 'plan-periodo-1.pdf')
            ->assertJsonPath('0.report.evidence.titulo', 'Reporte reusable')
            ->assertJsonPath('0.period.codigo', '2026-1');

        $this->get("/api/student/submissions/{$submissionId}/download")
            ->assertOk();
    }

    public function test_student_sees_preserved_evidences_in_new_period_without_current_reports(): void
    {
        Storage::fake('public');

        $admin = $this->makeAdmin([
            'email' => 'preserve-empty-period-admin@example.test',
        ]);
        [$studentUser, $student] = $this->makeStudent('Ingenieria Industrial', [
            'email' => 'preserve-empty-period-student@example.test',
        ], [
            'No_control' => 22332007,
        ]);

        $periodOne = $this->makePeriod(2026, 1, Period::ESTATUS_ACTIVO);
        $periodTwo = $this->makePeriod(2026, 2, Period::ESTATUS_ACTIVO);
        $this->assignStudent($student, $periodOne, ['Estatus' => Student::STATUS_ACTIVO]);
        $this->assignStudent($student, $periodTwo, ['Estatus' => Student::STATUS_ACTIVO]);

        $evidence = $this->makeEvidence($admin, 'programa', [
            'titulo' => 'Reportes conservados',
            'preserve_submissions_between_periods' => true,
        ]);
        $firstReport = $this->makeReport($evidence, $periodOne, $admin, [
            'titulo' => 'Reporte final',
        ]);

        Sanctum::actingAs($studentUser, ['student']);

        $this->post("/api/student/reports/{$firstReport->id}/submit", [
            'file' => UploadedFile::fake()->create('reporte-periodo-1.pdf', 8),
        ])->assertCreated();

        $evidences = $this->getJson("/api/student/evidences?periodo_id={$periodTwo->id}")
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.titulo', 'Reportes conservados')
            ->assertJsonPath('0.is_readonly_historical', true)
            ->assertJsonPath('0.reports.0.titulo', 'Reporte final')
            ->assertJsonPath('0.reports.0.is_readonly_historical', true)
            ->assertJsonPath('0.reports.0.submissions.0.original_name', 'reporte-periodo-1.pdf')
            ->assertJsonPath('0.reports.0.submissions.0.is_historical', true);

        $this->assertSame($firstReport->id, data_get($evidences->json('0.reports.0'), 'id'));
    }

    public function test_student_cannot_download_another_students_historical_submission(): void
    {
        Storage::fake('public');

        $admin = $this->makeAdmin([
            'email' => 'history-admin@example.test',
        ]);
        [$studentUser, $student] = $this->makeStudent('Ingenieria Industrial', [
            'email' => 'history-student@example.test',
        ], [
            'No_control' => 22332005,
        ]);
        [, $otherStudent] = $this->makeStudent('Ingenieria Industrial', [
            'email' => 'history-other-student@example.test',
        ], [
            'No_control' => 22332006,
        ]);

        $period = $this->makePeriod(2026, 1, Period::ESTATUS_ACTIVO);
        $this->assignStudent($student, $period, ['Estatus' => Student::STATUS_ACTIVO]);
        $this->assignStudent($otherStudent, $period, ['Estatus' => Student::STATUS_ACTIVO]);

        $evidence = $this->makeEvidence($admin, 'programa');
        $report = $this->makeReport($evidence, $period, $admin);

        Storage::disk('public')->put('submissions/otro-estudiante.pdf', '%PDF-1.4 other');
        $otherSubmission = $this->makeSubmission($report, $otherStudent, [
            'file_path' => 'submissions/otro-estudiante.pdf',
            'original_name' => 'otro-estudiante.pdf',
        ]);

        Sanctum::actingAs($studentUser, ['student']);

        $this->get("/api/student/submissions/{$otherSubmission->id}/download")
            ->assertStatus(403)
            ->assertJsonPath('message', 'No puedes acceder a entregas de otro estudiante.');
    }
}
