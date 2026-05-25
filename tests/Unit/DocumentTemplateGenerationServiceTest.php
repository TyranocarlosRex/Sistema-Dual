<?php

namespace Tests\Unit;

use App\Models\DocumentTemplate;
use App\Models\Period;
use App\Models\Student;
use App\Models\StudentPeriod;
use App\Models\User;
use App\Support\DocumentTemplateGenerationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class DocumentTemplateGenerationServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_generate_replaces_student_period_placeholders_and_reports_unresolved_tokens(): void
    {
        [$admin, $period, $document, $student] = $this->makeGenerationScenario();

        $result = (new DocumentTemplateGenerationService())->generate(
            $document,
            $period,
            'student',
            $student->id
        );

        $this->assertSame('student', $result['scope']);
        $this->assertSame(1, $result['generated_count']);
        $this->assertSame($document->id, $result['document']['id']);
        $this->assertSame($period->id, $result['period']['id']);

        $generated = $result['documents'][0];
        $this->assertSame('Carlos Cordova', $generated['student']['nombre_completo']);
        $this->assertStringContainsString('Carlos Cordova', $generated['body_html']);
        $this->assertStringContainsString('Ingenieria en Sistemas Computacionales', $generated['body_html']);
        $this->assertStringContainsString('21/03/2026', $generated['body_html']);
        $this->assertStringContainsString('{sin_resolver}', $generated['body_html']);
        $this->assertSame(['sin_resolver'], $generated['unresolved_placeholders']);
        $this->assertSame('carta-dual-22330406.html', $generated['filename']);
        $this->assertSame('carta-dual-22330406.pdf', $generated['pdf_filename']);

        $this->assertSame($admin->id, $document->created_by);
    }

    public function test_options_filters_students_by_search_and_career(): void
    {
        [, $period] = $this->makeGenerationScenario();
        $this->makeStudentWithAssignment($period, [
            'Nombre' => 'Ana',
            'Apellidos' => 'Industrial',
            'No_control' => 22339999,
            'Carrera' => 'Ingenieria Industrial',
        ]);

        $result = (new DocumentTemplateGenerationService())->options(
            $period,
            'Carlos',
            'Ingenieria en Sistemas Computacionales',
            10
        );

        $this->assertSame($period->id, $result['period']['id']);
        $this->assertSame(1, $result['students_total']);
        $this->assertSame('Carlos Cordova', $result['students'][0]['nombre_completo']);
        $this->assertContains('Ingenieria en Sistemas Computacionales', $result['careers']);
        $this->assertContains('Ingenieria Industrial', $result['careers']);
    }

    public function test_generate_rejects_career_scope_without_career(): void
    {
        [, $period, $document] = $this->makeGenerationScenario();

        $this->expectException(ValidationException::class);

        (new DocumentTemplateGenerationService())->generate($document, $period, 'career', null, null);
    }

    public function test_generate_rejects_unknown_student_for_period(): void
    {
        [, $period, $document] = $this->makeGenerationScenario();

        $this->expectException(ValidationException::class);

        (new DocumentTemplateGenerationService())->generate($document, $period, 'student', 999999);
    }

    public function test_generate_rejects_career_scope_without_matching_students(): void
    {
        [, $period, $document] = $this->makeGenerationScenario();

        $this->expectException(ValidationException::class);

        (new DocumentTemplateGenerationService())->generate(
            $document,
            $period,
            'career',
            null,
            'Ingenieria Aeronautica'
        );
    }

    public function test_generate_escapes_replaced_values_in_html(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $period = Period::query()->create([
            'anio' => 2026,
            'numero' => 4,
            'codigo' => '2026-4',
            'estatus' => Period::ESTATUS_ACTIVO,
        ]);
        $student = $this->makeStudentWithAssignment($period, [
            'Nombre' => 'Carlos <script>',
            'Apellidos' => 'Cordova',
            'No_control' => 22330499,
            'Carrera' => 'Ingenieria Industrial',
        ]);
        $document = DocumentTemplate::query()->create([
            'titulo' => 'Escape',
            'body_html' => '<p>{alumno_nombre}</p>',
            'plain_text' => '{alumno_nombre}',
            'placeholders' => ['alumno_nombre'],
            'created_by' => $admin->id,
        ]);

        $result = (new DocumentTemplateGenerationService())->generate(
            $document,
            $period,
            'student',
            $student->id
        );

        $this->assertStringContainsString('Carlos &lt;script&gt;', $result['documents'][0]['body_html']);
        $this->assertStringNotContainsString('Carlos <script>', $result['documents'][0]['body_html']);
        $this->assertStringContainsString('Carlos <script>', $result['documents'][0]['plain_text']);
    }

    private function makeGenerationScenario(): array
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $period = Period::query()->create([
            'anio' => 2026,
            'numero' => 1,
            'codigo' => '2026-1',
            'estatus' => Period::ESTATUS_ACTIVO,
            'fecha_inicio' => '2026-03-21',
            'fecha_fin' => '2026-09-30',
        ]);

        $student = $this->makeStudentWithAssignment($period, [
            'Nombre' => 'Carlos',
            'Apellidos' => 'Cordova',
            'No_control' => 22330406,
            'Carrera' => 'Ingenieria en Sistemas Computacionales',
        ]);

        $document = DocumentTemplate::query()->create([
            'titulo' => 'Carta Dual',
            'descripcion' => 'Plantilla base',
            'header_html' => '<div>Periodo {periodo_codigo}</div>',
            'body_html' => '<p>{alumno_nombre_completo}</p><p>{alumno_carrera}</p><p>{asignacion_fecha_alta}</p><p>{sin_resolver}</p>',
            'footer_html' => '<div>{alumno_no_control}</div>',
            'plain_text' => '{alumno_nombre_completo} {alumno_carrera} {asignacion_fecha_alta} {sin_resolver}',
            'placeholders' => [
                'alumno_nombre_completo',
                'alumno_carrera',
                'asignacion_fecha_alta',
                'periodo_codigo',
                'sin_resolver',
            ],
            'created_by' => $admin->id,
            'updated_by' => $admin->id,
        ]);

        return [$admin, $period, $document, $student];
    }

    private function makeStudentWithAssignment(Period $period, array $overrides): Student
    {
        $user = User::factory()->create([
            'role' => 'student',
            'name' => trim(($overrides['Nombre'] ?? 'Alumno') . ' ' . ($overrides['Apellidos'] ?? 'Prueba')),
        ]);

        $student = Student::query()->forceCreate([
            'user_id' => $user->id,
            'Nombre' => $overrides['Nombre'] ?? 'Alumno',
            'Apellidos' => $overrides['Apellidos'] ?? 'Prueba',
            'No_control' => $overrides['No_control'] ?? 22334000,
            'Semestre' => 8,
            'Carrera' => $overrides['Carrera'] ?? 'Ingenieria Industrial',
            'Correo_institucional' => ($overrides['No_control'] ?? 22334000) . '@example.test',
        ]);

        StudentPeriod::query()->create([
            'student_id' => $student->id,
            'periodo_id' => $period->id,
            'Estatus' => Student::STATUS_ACTIVO,
            'Semestre' => 8,
            'Carrera' => $student->Carrera,
            'Empresa' => 'Empresa Demo',
            'Numero_convenio' => 'CONV-2026',
            'Fecha_alta' => '2026-03-21',
        ]);

        return $student;
    }
}
