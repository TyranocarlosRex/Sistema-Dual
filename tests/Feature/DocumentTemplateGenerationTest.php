<?php

namespace Tests\Feature;

use App\Models\DocumentTemplate;
use App\Models\Evidence;
use App\Models\Period;
use App\Models\Report;
use App\Models\Student;
use App\Models\StudentPeriod;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class DocumentTemplateGenerationTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_get_generation_options_for_a_period(): void
    {
        [$admin, $period] = $this->seedGenerationScenario();

        Sanctum::actingAs($admin, ['admin']);

        $response = $this->getJson("/api/document-generations/options?periodo_id={$period->id}&search=CARLOS");

        $response
            ->assertOk()
            ->assertJsonPath('period.id', $period->id)
            ->assertJsonPath('students_total', 1)
            ->assertJsonPath('students.0.nombre_completo', 'Carlos Cordova')
            ->assertJsonPath('students.0.carrera', 'Ingenieria en Sistemas Computacionales')
            ->assertJsonFragment(['Ingenieria en Sistemas Computacionales']);
    }

    public function test_admin_can_generate_template_for_single_student_and_by_career(): void
    {
        [$admin, $period, $document, $carlos] = $this->seedGenerationScenario();

        Sanctum::actingAs($admin, ['admin']);

        $singleResponse = $this->postJson("/api/documents/{$document->id}/generate", [
            'scope' => 'student',
            'student_id' => $carlos->id,
            'periodo_id' => $period->id,
        ]);

        $singleResponse
            ->assertOk()
            ->assertJsonPath('generated_count', 1)
            ->assertJsonPath('documents.0.student.nombre_completo', 'Carlos Cordova')
            ->assertJsonPath('documents.0.student.no_control', '22330406');

        $this->assertStringContainsString('Carlos Cordova', (string) $singleResponse->json('documents.0.body_html'));
        $this->assertStringContainsString('Ingenieria en Sistemas Computacionales', (string) $singleResponse->json('documents.0.body_html'));
        $this->assertStringContainsString('21/03/2026', (string) $singleResponse->json('documents.0.body_html'));

        $careerResponse = $this->postJson("/api/documents/{$document->id}/generate", [
            'scope' => 'career',
            'career' => 'Ingenieria en Sistemas Computacionales',
            'periodo_id' => $period->id,
        ]);

        $careerResponse
            ->assertOk()
            ->assertJsonPath('generated_count', 1)
            ->assertJsonPath('documents.0.student.nombre_completo', 'Carlos Cordova');

        $allResponse = $this->postJson("/api/documents/{$document->id}/generate", [
            'scope' => 'all',
            'periodo_id' => $period->id,
        ]);

        $allResponse
            ->assertOk()
            ->assertJsonPath('generated_count', 2);

        $pdfResponse = $this->post("/api/documents/{$document->id}/download-pdf", [
            'student_id' => $carlos->id,
            'periodo_id' => $period->id,
        ]);

        $pdfResponse->assertOk();
        $this->assertStringStartsWith('application/pdf', (string) $pdfResponse->headers->get('content-type'));
        $this->assertStringStartsWith('%PDF', (string) $pdfResponse->getContent());
    }

    public function test_pdf_with_images_preserves_letterhead_when_gd_is_available(): void
    {
        [$admin, $period, $document, $carlos] = $this->seedGenerationScenario();

        $document->update([
            'header_html' => '<div class="docx-paragraph"><img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=" alt="Membrete"></div>',
        ]);

        Sanctum::actingAs($admin, ['admin']);

        $response = $this->post("/api/documents/{$document->id}/download-pdf", [
            'student_id' => $carlos->id,
            'periodo_id' => $period->id,
        ]);

        if (!extension_loaded('gd')) {
            $response
                ->assertStatus(422)
                ->assertJsonPath('message', 'El servidor necesita la extension GD de PHP para generar PDFs con membrete. Activa GD y vuelve a intentar.');

            return;
        }

        $response->assertOk();
        $this->assertStringStartsWith('application/pdf', (string) $response->headers->get('content-type'));
        $this->assertStringStartsWith('%PDF', (string) $response->getContent());
    }

    public function test_admin_can_attach_generated_document_to_report_for_student(): void
    {
        Storage::fake('public');

        [$admin, $period, $document, $carlos] = $this->seedGenerationScenario();
        $evidence = Evidence::query()->create([
            'titulo' => 'Documentos personalizados',
            'descripcion' => 'Formatos generados por alumno',
            'tipo' => 'inscripcion',
            'is_active' => true,
            'created_by' => $admin->id,
        ]);
        $report = Report::query()->create([
            'evidence_id' => $evidence->id,
            'periodo_id' => $period->id,
            'titulo' => 'Carta generada',
            'descripcion' => 'Descarga tu carta generada y subela firmada.',
            'has_attachment' => false,
            'created_by' => $admin->id,
        ]);

        Sanctum::actingAs($admin, ['admin']);

        $response = $this->postJson("/api/documents/{$document->id}/attach-to-report", [
            'report_id' => $report->id,
            'periodo_id' => $period->id,
            'scope' => 'student',
            'student_id' => $carlos->id,
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('attached_count', 1)
            ->assertJsonPath('attachments.0.student_id', $carlos->id)
            ->assertJsonPath('attachments.0.report_id', $report->id)
            ->assertJsonPath('attachments.0.original_name', 'carta-de-presentacion-22330406.pdf');

        $attachmentId = (int) $response->json('attachments.0.id');

        $this->assertDatabaseHas('report_generated_attachments', [
            'id' => $attachmentId,
            'report_id' => $report->id,
            'student_id' => $carlos->id,
            'document_template_id' => $document->id,
        ]);

        $studentUser = $carlos->user()->firstOrFail();
        Sanctum::actingAs($studentUser, ['student']);

        $this->getJson("/api/student/evidences?periodo_id={$period->id}")
            ->assertOk()
            ->assertJsonPath('0.reports.0.generated_attachments.0.id', $attachmentId)
            ->assertJsonPath('0.reports.0.generated_attachments.0.original_name', 'carta-de-presentacion-22330406.pdf');

        $download = $this->get("/api/student/report-generated-attachments/{$attachmentId}/download");

        $download->assertOk();
        $this->assertStringStartsWith('application/pdf', (string) $download->headers->get('content-type'));
        $download->assertHeader('x-download-filename', 'carta-de-presentacion-22330406.pdf');
    }

    private function seedGenerationScenario(): array
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $period = Period::query()->create([
            'anio' => 2026,
            'numero' => 1,
            'codigo' => '2026-1',
            'estatus' => 'activo',
            'fecha_inicio' => '2026-03-21',
            'fecha_fin' => '2026-09-30',
        ]);

        $carlosUser = User::factory()->create([
            'role' => 'student',
            'name' => 'Carlos Cordova',
            'email' => 'carlos@example.test',
        ]);

        $carlos = Student::query()->forceCreate([
            'user_id' => $carlosUser->id,
            'Nombre' => 'Carlos',
            'Apellidos' => 'Cordova',
            'No_control' => 22330406,
            'Semestre' => 8,
            'Direccion' => 'Hermosillo',
            'Telefono' => '6620000000',
            'Correo_institucional' => '22330406@itson.edu.mx',
            'Carrera' => 'Ingenieria en Sistemas Computacionales',
        ]);

        StudentPeriod::query()->create([
            'student_id' => $carlos->id,
            'periodo_id' => $period->id,
            'Estatus' => 'Activo',
            'Semestre' => 8,
            'Carrera' => 'Ingenieria en Sistemas Computacionales',
            'Empresa' => 'GTyV',
            'Numero_convenio' => '364/2025',
            'Fecha_alta' => '2026-03-21',
        ]);

        $anaUser = User::factory()->create([
            'role' => 'student',
            'name' => 'Ana Lopez',
            'email' => 'ana@example.test',
        ]);

        $ana = Student::query()->forceCreate([
            'user_id' => $anaUser->id,
            'Nombre' => 'Ana',
            'Apellidos' => 'Lopez',
            'No_control' => 22339999,
            'Semestre' => 7,
            'Direccion' => 'Obregon',
            'Telefono' => '6440000000',
            'Correo_institucional' => '22339999@itson.edu.mx',
            'Carrera' => 'Ingenieria Industrial',
        ]);

        StudentPeriod::query()->create([
            'student_id' => $ana->id,
            'periodo_id' => $period->id,
            'Estatus' => 'Activo',
            'Semestre' => 7,
            'Carrera' => 'Ingenieria Industrial',
            'Empresa' => 'Empresa Demo',
            'Numero_convenio' => 'IND-01',
            'Fecha_alta' => '2026-03-25',
        ]);

        $document = DocumentTemplate::query()->create([
            'titulo' => 'Carta de presentacion',
            'descripcion' => 'Plantilla base',
            'header_html' => '<div class="docx-paragraph">OFICIO</div>',
            'body_html' => '<div class="docx-paragraph">Alumno: {alumno_nombre_completo}</div><div class="docx-paragraph">Carrera: {alumno_carrera}</div><div class="docx-paragraph">Inicio: {asignacion_fecha_alta}</div>',
            'footer_html' => '<div class="docx-paragraph">Periodo {periodo_codigo}</div>',
            'plain_text' => 'Alumno: {alumno_nombre_completo} Carrera: {alumno_carrera} Inicio: {asignacion_fecha_alta}',
            'placeholders' => ['alumno_nombre_completo', 'alumno_carrera', 'asignacion_fecha_alta', 'periodo_codigo'],
            'created_by' => $admin->id,
            'updated_by' => $admin->id,
        ]);

        return [$admin, $period, $document, $carlos, $ana];
    }
}
