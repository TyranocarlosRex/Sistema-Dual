<?php

namespace Tests\Unit;

use App\Support\DocumentTemplateContentService;
use Tests\TestCase;

class DocumentTemplateContentServiceTest extends TestCase
{
    public function test_prepare_payload_sanitizes_html_and_extracts_placeholders(): void
    {
        $service = new DocumentTemplateContentService();

        $payload = $service->preparePayload([
            'titulo' => '  Carta de presentacion  ',
            'descripcion' => '  Plantilla base  ',
            'header_html' => '<script>alert(1)</script><p class="ok bad!" onclick="evil()">{Periodo_Codigo}</p>',
            'body_html' => '<p>{Alumno_Nombre}</p><img src="javascript:alert(1)" onerror="evil"><span style="color:red; background-image:url(http://bad)">Texto</span>',
            'footer_html' => '<iframe>contenido</iframe><strong>Final</strong>',
            'source_filename' => ' plantilla.html ',
            'source_extension' => ' .HTML ',
        ]);

        $this->assertSame('Carta de presentacion', $payload['titulo']);
        $this->assertSame('Plantilla base', $payload['descripcion']);
        $this->assertSame('plantilla.html', $payload['source_filename']);
        $this->assertSame('html', $payload['source_extension']);

        $combinedHtml = $payload['header_html'] . $payload['body_html'] . $payload['footer_html'];
        $this->assertStringNotContainsString('script', $combinedHtml);
        $this->assertStringNotContainsString('onclick', $combinedHtml);
        $this->assertStringNotContainsString('javascript:', $combinedHtml);
        $this->assertStringNotContainsString('onerror', $combinedHtml);
        $this->assertStringNotContainsString('iframe', $combinedHtml);
        $this->assertStringContainsString('color:red', $combinedHtml);
        $this->assertStringNotContainsString('url(', $combinedHtml);

        $this->assertStringContainsString('Carta de presentacion', $payload['titulo']);
        $this->assertStringContainsString('Texto', $payload['plain_text']);
        $this->assertStringContainsString('Final', $payload['plain_text']);
        $this->assertSame(['alumno_nombre', 'periodo_codigo'], $payload['placeholders']);
    }

    public function test_count_lines_normalizes_empty_and_multiline_text(): void
    {
        $service = new DocumentTemplateContentService();

        $this->assertSame(0, $service->countLines('   '));
        $this->assertSame(3, $service->countLines("Uno\r\nDos\rTres"));
    }

    public function test_prepare_payload_deduplicates_and_sorts_placeholders(): void
    {
        $service = new DocumentTemplateContentService();

        $payload = $service->preparePayload([
            'titulo' => 'Plantilla',
            'body_html' => '<p>{periodo_codigo}</p><p>{Alumno_Nombre}</p><p>{alumno_nombre}</p>',
        ]);

        $this->assertSame(['alumno_nombre', 'periodo_codigo'], $payload['placeholders']);
    }
}
