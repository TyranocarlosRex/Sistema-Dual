<?php

namespace Tests\Unit;

use App\Support\DocumentTemplateContentService;
use PHPUnit\Framework\TestCase;

class RequirementDocumentTemplateContentTest extends TestCase
{
    public function test_rf_36_template_content_is_sanitized_and_placeholders_are_detected(): void
    {
        $payload = (new DocumentTemplateContentService())->preparePayload([
            'titulo' => ' Carta de aceptacion ',
            'descripcion' => '   ',
            'header_html' => '<script>alert(1)</script><p onclick="alert(1)">Hola {alumno_nombre}</p>',
            'body_html' => '<div style="color:red; background-image:url(javascript:alert(1))">Periodo {periodo_codigo}</div>',
            'footer_html' => '<iframe src="https://example.test"></iframe><p>Fin</p>',
            'source_filename' => ' plantilla.docx ',
            'source_extension' => '.DOCX',
        ]);

        $html = $payload['header_html'] . $payload['body_html'] . $payload['footer_html'];

        $this->assertSame('Carta de aceptacion', $payload['titulo']);
        $this->assertNull($payload['descripcion']);
        $this->assertSame('plantilla.docx', $payload['source_filename']);
        $this->assertSame('docx', $payload['source_extension']);
        $this->assertSame(['alumno_nombre', 'periodo_codigo'], $payload['placeholders']);
        $this->assertStringContainsString('Hola {alumno_nombre}', $payload['plain_text']);
        $this->assertStringContainsString('Periodo {periodo_codigo}', $payload['plain_text']);
        $this->assertStringNotContainsString('script', $html);
        $this->assertStringNotContainsString('onclick', $html);
        $this->assertStringNotContainsString('iframe', $html);
        $this->assertStringNotContainsString('javascript', $html);
    }

    public function test_rf_36_template_content_counts_lines_after_normalizing_line_endings(): void
    {
        $service = new DocumentTemplateContentService();

        $this->assertSame(0, $service->countLines('   '));
        $this->assertSame(3, $service->countLines("Linea 1\r\nLinea 2\nLinea 3"));
    }
}
