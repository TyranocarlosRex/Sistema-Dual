<?php

namespace Tests\Feature;

use App\Models\Period;
use App\Models\Report;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\Feature\Concerns\BuildsAcademicScenarios;
use Tests\TestCase;

class EvidenceReportImportFlowTest extends TestCase
{
    use BuildsAcademicScenarios;
    use RefreshDatabase;

    public function test_admin_can_manage_evidences_reports_attachments_and_imports(): void
    {
        Storage::fake('public');

        $admin = $this->makeAdmin([
            'email' => 'content-admin@example.test',
        ]);
        $period = $this->makePeriod(2026, 1, Period::ESTATUS_ACTIVO);

        Sanctum::actingAs($admin, ['admin']);

        $evidenceResponse = $this->postJson('/api/evidences', [
            'titulo' => 'Expediente inicial',
            'descripcion' => 'Documentos de ingreso',
            'fecha_limite' => '2026-05-10',
            'tipo' => 'inscripcion',
        ]);

        $evidenceResponse
            ->assertCreated()
            ->assertJsonPath('titulo', 'Expediente inicial')
            ->assertJsonPath('fecha_limite', '2026-05-10')
            ->assertJsonPath('created_by', $admin->id);

        $evidenceId = $evidenceResponse->json('id');

        $this->putJson("/api/evidences/{$evidenceId}", [
            'titulo' => 'Expediente actualizado',
            'descripcion' => 'Documentos obligatorios',
            'fecha_limite' => '2026-05-15',
            'tipo' => 'programa',
        ])
            ->assertOk()
            ->assertJsonPath('titulo', 'Expediente actualizado')
            ->assertJsonPath('fecha_limite', '2026-05-15')
            ->assertJsonPath('tipo', 'programa');

        $this->getJson("/api/evidences/{$evidenceId}")
            ->assertOk()
            ->assertJsonPath('id', $evidenceId)
            ->assertJsonPath('reports', []);

        $reportResponse = $this->post('/api/reports', [
            'evidence_id' => $evidenceId,
            'period_id' => $period->id,
            'titulo' => 'Formato de convenio',
            'descripcion' => 'Subir convenio firmado',
            'attachment' => UploadedFile::fake()->create('convenio.pdf', 12),
        ]);

        $reportResponse
            ->assertCreated()
            ->assertJsonPath('titulo', 'Formato de convenio')
            ->assertJsonPath('has_attachment', true)
            ->assertJsonPath('period.codigo', '2026-1');

        $report = Report::query()->firstOrFail();
        Storage::disk('public')->assertExists($report->attachment_path);

        $this->getJson("/api/evidences?with_reports=1&only_with_reports=1&periodo_id={$period->id}")
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.reports.0.id', $report->id);

        $this->getJson("/api/reports?evidence_id={$evidenceId}&periodo_id={$period->id}")
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.evidence.id', $evidenceId);

        $this->putJson("/api/reports/{$report->id}", [
            'evidence_id' => $evidenceId,
            'periodo_id' => $period->id,
            'titulo' => 'Formato sin adjunto',
            'descripcion' => 'Ya no requiere archivo base',
            'remove_attachment' => true,
        ])
            ->assertOk()
            ->assertJsonPath('titulo', 'Formato sin adjunto')
            ->assertJsonPath('has_attachment', false)
            ->assertJsonPath('attachment_path', null);

        Storage::disk('public')->assertMissing($report->attachment_path);

        $this->getJson("/api/reports/{$report->id}/attachment")
            ->assertNotFound()
            ->assertJsonPath('message', 'Este reporte no tiene archivo adjunto.');

        $this->deleteJson("/api/reports/{$report->id}")
            ->assertOk()
            ->assertJsonPath('message', 'Reporte eliminado');

        $this->deleteJson("/api/evidences/{$evidenceId}")
            ->assertOk()
            ->assertJsonPath('message', 'Espacio eliminado');

        $this->post('/api/document-imports', [
            'file' => UploadedFile::fake()->createWithContent(
                'plantilla.html',
                '<h1>Plantilla oficial</h1><p>Alumno: {alumno_nombre_completo}</p>'
            ),
        ])
            ->assertOk()
            ->assertJsonFragment(['extension' => 'html'])
            ->assertJsonFragment(['filename' => 'plantilla.html']);
    }

    public function test_closed_period_reports_block_report_and_evidence_deletion(): void
    {
        $admin = $this->makeAdmin([
            'email' => 'closed-content-admin@example.test',
        ]);
        $closedPeriod = $this->makePeriod(2026, 2, Period::ESTATUS_CERRADO);
        $evidence = $this->makeEvidence($admin, 'inscripcion');
        $report = $this->makeReport($evidence, $closedPeriod, $admin);

        Sanctum::actingAs($admin, ['admin']);

        $this->deleteJson("/api/reports/{$report->id}")
            ->assertStatus(422)
            ->assertJsonPath('message', 'No puedes eliminar reportes de un periodo cerrado.');

        $this->deleteJson("/api/evidences/{$evidence->id}")
            ->assertStatus(422)
            ->assertJsonPath('message', 'No puedes eliminar evidencias con reportes en periodos cerrados.');
    }
}
