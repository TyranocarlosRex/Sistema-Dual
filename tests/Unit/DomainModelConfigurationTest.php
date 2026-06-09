<?php

namespace Tests\Unit;

use App\Models\Advertisement;
use App\Models\Coordinator;
use App\Models\DocumentTemplate;
use App\Models\Evidence;
use App\Models\Period;
use App\Models\Report;
use App\Models\Student;
use App\Models\Submission;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DomainModelConfigurationTest extends TestCase
{
    use RefreshDatabase;

    public function test_coordinator_careers_include_program_catalog_used_by_filters(): void
    {
        $this->assertContains('Ingenieria Industrial', Coordinator::CAREERS);
        $this->assertContains('Ingenieria en Sistemas Computacionales', Coordinator::CAREERS);
        $this->assertContains('Ingenieria Aeronautica', Coordinator::CAREERS);
        $this->assertCount(11, Coordinator::CAREERS);
    }

    public function test_evidence_report_submission_relationships_resolve_expected_records(): void
    {
        [$admin, $student, $period] = $this->makeBaseScenario();

        $evidence = Evidence::query()->create([
            'titulo' => 'Inscripcion',
            'descripcion' => 'Documentos iniciales',
            'fecha_limite' => '2026-05-30',
            'tipo' => 'inscripcion',
            'created_by' => $admin->id,
        ]);
        $report = Report::query()->create([
            'evidence_id' => $evidence->id,
            'periodo_id' => $period->id,
            'titulo' => 'Carta de presentacion',
            'descripcion' => 'Subir carta',
            'has_attachment' => true,
            'attachment_path' => 'reports/carta.pdf',
            'created_by' => $admin->id,
        ]);
        $submission = Submission::query()->create([
            'report_id' => $report->id,
            'evidence_id' => $evidence->id,
            'periodo_id' => $period->id,
            'student_id' => $student->id,
            'file_path' => 'submissions/carta.pdf',
            'original_name' => 'carta.pdf',
            'status' => 'aceptado',
            'feedback' => 'Correcto',
            'calificacion' => 95.50,
        ]);

        $this->assertSame($admin->id, $evidence->creador->id);
        $this->assertSame($report->id, $evidence->reports()->first()?->id);
        $this->assertSame($submission->id, $evidence->submissions()->first()?->id);
        $this->assertSame($admin->id, $report->creator->id);
        $this->assertSame($evidence->id, $report->evidence->id);
        $this->assertSame($period->id, $report->period->id);
        $this->assertSame($submission->id, $report->submissions()->first()?->id);
        $this->assertSame($report->id, $submission->report->id);
        $this->assertSame($evidence->id, $submission->evidence->id);
        $this->assertSame($period->id, $submission->period->id);
        $this->assertSame($student->id, $submission->student->id);
        $this->assertSame('aceptado', $submission->status);
        $this->assertSame('Correcto', $submission->feedback);
        $this->assertEquals(95.50, $submission->calificacion);
    }

    public function test_document_template_casts_placeholders_and_resolves_creator_relations(): void
    {
        $creator = User::factory()->create(['role' => 'admin']);
        $updater = User::factory()->create(['role' => 'admin']);

        $template = DocumentTemplate::query()->create([
            'titulo' => 'Carta modelo',
            'descripcion' => 'Plantilla',
            'header_html' => '<div>Header</div>',
            'body_html' => '<p>{alumno_nombre}</p>',
            'footer_html' => '<div>Footer</div>',
            'plain_text' => '{alumno_nombre}',
            'placeholders' => ['alumno_nombre', 'periodo_codigo'],
            'created_by' => $creator->id,
            'updated_by' => $updater->id,
        ]);

        $fresh = $template->fresh();

        $this->assertSame(['alumno_nombre', 'periodo_codigo'], $fresh->placeholders);
        $this->assertSame($creator->id, $fresh->creator->id);
        $this->assertSame($updater->id, $fresh->updater->id);
    }

    public function test_advertisement_target_career_is_persisted_for_segmented_announcements(): void
    {
        $creator = User::factory()->create(['role' => 'admin']);

        $advertisement = Advertisement::query()->create([
            'titulo' => 'Aviso por carrera',
            'mensaje' => 'Mensaje',
            'target_role' => 'student',
            'target_carrera' => 'Ingenieria Industrial',
            'visible_from' => '2026-05-25 10:00:00',
            'created_by' => $creator->id,
        ]);

        $this->assertSame('Ingenieria Industrial', $advertisement->fresh()->target_carrera);
        $this->assertSame($creator->id, $advertisement->creador->id);
    }

    private function makeBaseScenario(): array
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $studentUser = User::factory()->create(['role' => 'student']);
        $student = Student::query()->forceCreate([
            'user_id' => $studentUser->id,
            'Nombre' => 'Alumno',
            'Apellidos' => 'Modelo',
            'No_control' => 22334022,
            'Semestre' => 8,
            'Carrera' => 'Ingenieria Industrial',
            'Correo_institucional' => '22334022@example.test',
        ]);
        $period = Period::query()->create([
            'anio' => 2026,
            'numero' => 1,
            'codigo' => '2026-1',
            'estatus' => Period::ESTATUS_ACTIVO,
        ]);

        return [$admin, $student, $period];
    }
}
