<?php

namespace Tests\Feature;

use App\Models\DocumentTemplate;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class DocumentTemplateApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_document_and_html_is_sanitized(): void
    {
        $user = User::factory()->create(['role' => 'admin']);

        Sanctum::actingAs($user, ['admin']);

        $response = $this->postJson('/api/documents', [
            'titulo' => 'Carta base',
            'descripcion' => 'Documento de prueba',
            'header_html' => '<div class="docx-section"><img src="data:image/png;base64,QUJD" alt="logo" onclick="alert(1)"></div>',
            'body_html' => '<div class="docx-paragraph" onclick="alert(1)"><script>alert(1)</script>Hola {alumno_nombre_completo}</div>',
            'footer_html' => '<div class="docx-paragraph"><span style="font-weight:700">Firma</span></div>',
            'source_filename' => 'carta.docx',
            'source_extension' => 'docx',
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('titulo', 'Carta base')
            ->assertJsonPath('source_extension', 'docx')
            ->assertJsonPath('placeholders.0', 'alumno_nombre_completo');

        $document = DocumentTemplate::query()->firstOrFail();

        $this->assertSame($user->id, $document->created_by);
        $this->assertStringNotContainsString('<script', $document->body_html);
        $this->assertStringNotContainsString('onclick=', $document->body_html);
        $this->assertStringNotContainsString('javascript:', $document->header_html);
        $this->assertSame(['alumno_nombre_completo'], $document->placeholders);
        $this->assertStringContainsString('Hola', $document->plain_text ?? '');
    }

    public function test_admin_can_update_and_delete_document(): void
    {
        $user = User::factory()->create(['role' => 'admin']);
        $document = DocumentTemplate::query()->create([
            'titulo' => 'Formato inicial',
            'descripcion' => 'Base',
            'header_html' => '<div>Encabezado</div>',
            'body_html' => '<div>Cuerpo</div>',
            'footer_html' => '<div>Pie</div>',
            'plain_text' => 'Encabezado Cuerpo Pie',
            'placeholders' => [],
            'created_by' => $user->id,
            'updated_by' => $user->id,
        ]);

        Sanctum::actingAs($user, ['admin']);

        $this->putJson("/api/documents/{$document->id}", [
            'titulo' => 'Formato actualizado',
            'descripcion' => 'Nueva descripcion',
            'header_html' => '<div>Encabezado</div>',
            'body_html' => '<div>Nuevo cuerpo {fecha_actual}</div>',
            'footer_html' => '<div>Pie</div>',
            'source_filename' => 'actualizado.html',
            'source_extension' => 'html',
        ])
            ->assertOk()
            ->assertJsonPath('titulo', 'Formato actualizado')
            ->assertJsonPath('source_extension', 'html')
            ->assertJsonPath('placeholders.0', 'fecha_actual');

        $document->refresh();

        $this->assertSame('Formato actualizado', $document->titulo);
        $this->assertSame(['fecha_actual'], $document->placeholders);
        $this->assertSame($user->id, $document->updated_by);

        $this->deleteJson("/api/documents/{$document->id}")
            ->assertOk()
            ->assertJsonFragment([
                'message' => 'Documento eliminado correctamente.',
            ]);

        $this->assertDatabaseMissing('document_templates', [
            'id' => $document->id,
        ]);
    }
}
