<?php

namespace Tests\Unit;

use App\Support\DocumentImportService;
use Illuminate\Http\UploadedFile;
use RuntimeException;
use Tests\TestCase;
use ZipArchive;

class DocumentImportServiceTest extends TestCase
{
    public function test_txt_import_returns_text_preview_and_metadata(): void
    {
        $service = new DocumentImportService();
        $file = $this->makeUploadedFile('reporte.txt', "Linea uno\r\nLinea dos\n");

        $result = $service->import($file);

        $this->assertSame('reporte.txt', $result['filename']);
        $this->assertSame('txt', $result['extension']);
        $this->assertSame("Linea uno\nLinea dos", $result['text']);
        $this->assertSame(2, $result['lines']);
        $this->assertSame(mb_strlen("Linea uno\nLinea dos"), $result['characters']);
        $this->assertStringContainsString('imported-pre', $result['html']);
    }

    public function test_html_import_extracts_visible_text_and_ignores_scripts(): void
    {
        $service = new DocumentImportService();
        $file = $this->makeUploadedFile('plantilla.html', <<<'HTML'
<html>
<head><script>alert("no")</script></head>
<body>
    <h1>Reporte semanal</h1>
    <p>Contenido visible</p>
    <script>Texto oculto</script>
</body>
</html>
HTML);

        $result = $service->import($file);

        $this->assertSame('html', $result['extension']);
        $this->assertStringContainsString('Reporte semanal', $result['text']);
        $this->assertStringContainsString('Contenido visible', $result['text']);
        $this->assertStringNotContainsString('Texto oculto', $result['text']);
    }

    public function test_import_rejects_unsupported_extensions(): void
    {
        $service = new DocumentImportService();
        $file = $this->makeUploadedFile('archivo.exe', 'contenido');

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Formato no soportado');

        $service->import($file);
    }

    public function test_html_import_rejects_empty_content(): void
    {
        $service = new DocumentImportService();
        $file = $this->makeUploadedFile('vacio.html', '<html><body></body></html>');

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('No se encontro contenido util dentro del HTML.');

        $service->import($file);
    }

    public function test_docx_import_extracts_basic_document_text(): void
    {
        $service = new DocumentImportService();
        $file = $this->makeDocxUploadedFile('documento.docx', <<<'XML'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p><w:r><w:t>Carta de presentacion</w:t></w:r></w:p>
  </w:body>
</w:document>
XML);

        $result = $service->import($file);

        $this->assertSame('docx', $result['extension']);
        $this->assertStringContainsString('Carta de presentacion', $result['text']);
        $this->assertStringContainsString('docx-preview', $result['html']);
    }

    public function test_pdf_import_extracts_basic_text_stream(): void
    {
        $service = new DocumentImportService();
        $pdf = "%PDF-1.4\n1 0 obj\n<< /Length 32 >>\nstream\nBT\n(Reporte PDF) Tj\nET\nendstream\nendobj\n%%EOF";
        $file = $this->makeUploadedFile('reporte.pdf', $pdf);

        $result = $service->import($file);

        $this->assertSame('pdf', $result['extension']);
        $this->assertStringContainsString('Reporte PDF', $result['text']);
    }

    private function makeUploadedFile(string $name, string $contents): UploadedFile
    {
        $path = tempnam(sys_get_temp_dir(), 'unit-import');
        file_put_contents($path, $contents);

        return new UploadedFile($path, $name, null, null, true);
    }

    private function makeDocxUploadedFile(string $name, string $documentXml): UploadedFile
    {
        $path = tempnam(sys_get_temp_dir(), 'unit-docx');
        $docxPath = $path . '.docx';
        @unlink($path);

        $zip = new ZipArchive();
        $zip->open($docxPath, ZipArchive::CREATE | ZipArchive::OVERWRITE);
        $zip->addEmptyDir('word');
        $zip->addFromString('word/document.xml', $documentXml);
        $zip->close();

        return new UploadedFile(
            $docxPath,
            $name,
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            null,
            true
        );
    }
}
