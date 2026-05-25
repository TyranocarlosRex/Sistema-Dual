<?php

namespace Tests\Unit;

use App\Support\DocumentImportService;
use Illuminate\Http\UploadedFile;
use RuntimeException;
use Tests\TestCase;

class RequirementDocumentImportTest extends TestCase
{
    public function test_rf_36_import_service_reads_txt_documents_and_returns_preview_metadata(): void
    {
        $file = UploadedFile::fake()->createWithContent(
            'carta-presentacion.txt',
            "Linea uno\nLinea dos"
        );

        $payload = (new DocumentImportService())->import($file);

        $this->assertSame('carta-presentacion.txt', $payload['filename']);
        $this->assertSame('txt', $payload['extension']);
        $this->assertSame("Linea uno\nLinea dos", $payload['text']);
        $this->assertSame(2, $payload['lines']);
        $this->assertStringContainsString('Linea uno', $payload['html']);
        $this->assertSame($payload['html'], $payload['body_html']);
    }

    public function test_rf_36_import_service_rejects_unsupported_document_formats(): void
    {
        $file = UploadedFile::fake()->createWithContent(
            'archivo-no-permitido.exe',
            'contenido'
        );

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Formato no soportado');

        (new DocumentImportService())->import($file);
    }
}
