<?php

namespace Tests\Feature;

use App\Models\DocumentTemplate;
use App\Models\Period;
use App\Models\Student;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Feature\Concerns\BuildsAcademicScenarios;
use Tests\TestCase;

class ModelRelationshipTest extends TestCase
{
    use BuildsAcademicScenarios;
    use RefreshDatabase;

    public function test_core_model_relationships_and_helpers_resolve_expected_records(): void
    {
        $admin = $this->makeAdmin([
            'email' => 'models-admin@example.test',
        ]);
        $coordinator = $this->makeCoordinator('Ingenieria Industrial', [
            'email' => 'models-coord@example.test',
        ]);
        [, $student] = $this->makeStudent('Ingenieria Industrial', [
            'email' => 'models-student@example.test',
        ], [
            'No_control' => 22333001,
        ]);
        $period = $this->makePeriod(2026, 1, Period::ESTATUS_ACTIVO);
        $assignment = $this->assignStudent($student, $period, [
            'Estatus' => Student::STATUS_ACTIVO,
        ]);
        $evidence = $this->makeEvidence($admin, 'inscripcion');
        $report = $this->makeReport($evidence, $period, $admin);
        $submission = $this->makeSubmission($report, $student);
        $template = DocumentTemplate::query()->create([
            'titulo' => 'Carta modelo',
            'descripcion' => 'Plantilla',
            'header_html' => '<div>Header</div>',
            'body_html' => '<div>Body</div>',
            'footer_html' => '<div>Footer</div>',
            'plain_text' => 'Header Body Footer',
            'placeholders' => ['alumno_nombre_completo'],
            'created_by' => $admin->id,
            'updated_by' => $admin->id,
        ]);

        $this->assertSame($admin->id, $admin->admin->user->id);
        $this->assertSame($coordinator->id, $coordinator->coordinator->user->id);
        $this->assertSame($student->id, $assignment->student->id);
        $this->assertSame($period->id, $assignment->period->id);
        $this->assertSame($period->id, Period::current()?->id);
        $this->assertSame($student->id, $period->students()->first()?->id);
        $this->assertFalse($period->isClosed());
        $this->assertContains(Period::ESTATUS_CERRADO, Period::allowedStatuses());
        $this->assertContains(Student::STATUS_BAJA, Student::allowedStatuses());
        $this->assertSame($admin->id, $evidence->creador->id);
        $this->assertSame($report->id, $evidence->reports->first()?->id);
        $this->assertSame($submission->id, $evidence->submissions->first()?->id);
        $this->assertSame($admin->id, $report->creator->id);
        $this->assertSame($evidence->id, $report->evidence->id);
        $this->assertSame($period->id, $report->period->id);
        $this->assertSame($submission->id, $report->submissions->first()?->id);
        $this->assertSame($admin->id, $template->creator->id);
        $this->assertSame($admin->id, $template->updater->id);
        $this->assertSame($coordinator->id, $coordinator->coordinator->user_id);
    }
}
