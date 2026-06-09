<?php

namespace Tests\Unit;

use App\Http\Requests\GenerateDocumentTemplateRequest;
use App\Http\Requests\StoreDocumentTemplateRequest;
use App\Http\Requests\StoreReportRequest;
use App\Models\Evidence;
use App\Models\Period;
use App\Models\Student;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Validator;
use Tests\TestCase;

class FormRequestValidationBehaviorTest extends TestCase
{
    use RefreshDatabase;

    public function test_store_report_rules_accept_valid_data_and_reject_missing_required_fields(): void
    {
        [$admin, , $period, $evidence] = $this->makeValidationScenario();
        $rules = (new StoreReportRequest())->rules();

        $valid = Validator::make([
            'evidence_id' => $evidence->id,
            'periodo_id' => $period->id,
            'titulo' => 'Reporte semanal',
            'descripcion' => 'Descripcion',
        ], $rules);

        $invalid = Validator::make([
            'evidence_id' => 999999,
            'titulo' => '',
        ], $rules);

        $this->assertFalse($valid->fails());
        $this->assertTrue($invalid->fails());
        $this->assertArrayHasKey('evidence_id', $invalid->errors()->toArray());
        $this->assertArrayHasKey('titulo', $invalid->errors()->toArray());
        $this->assertArrayNotHasKey('fecha_limite', $invalid->errors()->toArray());
        $this->assertSame('admin', $admin->role);
    }

    public function test_document_template_rules_accept_valid_content_and_reject_invalid_extension(): void
    {
        $rules = (new StoreDocumentTemplateRequest())->rules();

        $valid = Validator::make([
            'titulo' => 'Carta',
            'body_html' => '<p>Contenido</p>',
            'source_extension' => 'docx',
        ], $rules);
        $invalid = Validator::make([
            'titulo' => 'Carta',
            'body_html' => '<p>Contenido</p>',
            'source_extension' => 'docx!',
        ], $rules);

        $this->assertFalse($valid->fails());
        $this->assertTrue($invalid->fails());
        $this->assertArrayHasKey('source_extension', $invalid->errors()->toArray());
    }

    public function test_generate_document_rules_enforce_scope_specific_inputs(): void
    {
        [, $student, $period] = $this->makeValidationScenario();
        $rules = (new GenerateDocumentTemplateRequest())->rules();

        $studentScope = Validator::make([
            'scope' => 'student',
            'student_id' => $student->id,
            'periodo_id' => $period->id,
        ], $rules);
        $missingStudent = Validator::make([
            'scope' => 'student',
            'periodo_id' => $period->id,
        ], $rules);
        $careerScope = Validator::make([
            'scope' => 'career',
            'career' => 'Ingenieria Industrial',
            'periodo_id' => $period->id,
        ], $rules);
        $badScope = Validator::make([
            'scope' => 'invalid',
            'periodo_id' => $period->id,
        ], $rules);

        $this->assertFalse($studentScope->fails());
        $this->assertTrue($missingStudent->fails());
        $this->assertArrayHasKey('student_id', $missingStudent->errors()->toArray());
        $this->assertFalse($careerScope->fails());
        $this->assertTrue($badScope->fails());
        $this->assertArrayHasKey('scope', $badScope->errors()->toArray());
    }

    private function makeValidationScenario(): array
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $studentUser = User::factory()->create(['role' => 'student']);
        $student = Student::query()->forceCreate([
            'user_id' => $studentUser->id,
            'Nombre' => 'Alumno',
            'Apellidos' => 'Validador',
            'No_control' => 22334023,
            'Semestre' => 8,
            'Carrera' => 'Ingenieria Industrial',
            'Correo_institucional' => '22334023@example.test',
        ]);
        $period = Period::query()->create([
            'anio' => 2026,
            'numero' => 1,
            'codigo' => '2026-1',
            'estatus' => Period::ESTATUS_ACTIVO,
        ]);
        $evidence = Evidence::query()->create([
            'titulo' => 'Evidencia',
            'descripcion' => 'Descripcion',
            'tipo' => 'inscripcion',
            'created_by' => $admin->id,
        ]);

        return [$admin, $student, $period, $evidence];
    }
}
