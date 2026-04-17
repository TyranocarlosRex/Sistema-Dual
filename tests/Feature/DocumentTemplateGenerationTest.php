<?php

namespace Tests\Feature;

use App\Models\DocumentTemplate;
use App\Models\Period;
use App\Models\Student;
use App\Models\StudentPeriod;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
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
