<?php

namespace Tests\Feature;

use App\Support\DocumentImportService;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;
use ZipArchive;

class DocumentImportServiceTest extends TestCase
{
    public function test_html_import_preserves_lists_and_tables(): void
    {
        $service = app(DocumentImportService::class);
        $file = $this->makeUploadedFile('estructura.html', <<<'HTML'
<!DOCTYPE html>
<html>
<body>
    <h1>Reporte semanal</h1>
    <ol>
        <li>Primer punto</li>
        <li>Segundo punto</li>
    </ol>
    <table>
        <tr><th>Campo</th><th>Valor</th></tr>
        <tr><td>Empresa</td><td>ACME</td></tr>
    </table>
</body>
</html>
HTML);

        $result = $service->import($file);

        $this->assertStringContainsString('Reporte semanal', $result['text']);
        $this->assertStringContainsString('1. Primer punto', $result['text']);
        $this->assertStringContainsString('2. Segundo punto', $result['text']);
        $this->assertStringContainsString('Campo | Valor', $result['text']);
        $this->assertStringContainsString('Empresa | ACME', $result['text']);
        $this->assertStringContainsString('imported-pre', $result['html']);
    }

    public function test_docx_import_preserves_tables_and_list_items(): void
    {
        $service = app(DocumentImportService::class);
        $documentXml = <<<'XML'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:r><w:t>Oficio de prueba</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:numPr><w:ilvl w:val="0" /><w:numId w:val="1" /></w:numPr></w:pPr>
      <w:r><w:t>Documento anexo</w:t></w:r>
    </w:p>
    <w:tbl>
      <w:tr>
        <w:tc><w:p><w:r><w:t>Nombre</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>Valor</w:t></w:r></w:p></w:tc>
      </w:tr>
      <w:tr>
        <w:tc><w:p><w:r><w:t>Convenio</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>CV-2026-001</w:t></w:r></w:p></w:tc>
      </w:tr>
    </w:tbl>
  </w:body>
</w:document>
XML;
        $file = $this->makeDocxUploadedFile('estructura.docx', $documentXml);

        $result = $service->import($file);

        $this->assertStringContainsString('Oficio de prueba', $result['text']);
        $this->assertStringContainsString('- Documento anexo', $result['text']);
        $this->assertStringContainsString('Nombre | Valor', $result['text']);
        $this->assertStringContainsString('Convenio | CV-2026-001', $result['text']);
        $this->assertStringContainsString('docx-preview', $result['html']);
    }

    public function test_docx_import_ignores_drawing_coordinates_and_keeps_textbox_content(): void
    {
        $service = app(DocumentImportService::class);
        $documentXml = <<<'XML'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document
    xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
    xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"
    xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
    xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape">
  <w:body>
    <w:p>
      <w:r>
        <mc:AlternateContent>
          <mc:Choice Requires="wps">
            <w:drawing>
              <wp:anchor>
                <wp:positionH>
                  <wp:posOffset>3868647</wp:posOffset>
                </wp:positionH>
                <wps:wsp>
                  <wps:txbx>
                    <w:txbxContent>
                      <w:p>
                        <w:r><w:t>Encabezado institucional</w:t></w:r>
                      </w:p>
                    </w:txbxContent>
                  </wps:txbx>
                </wps:wsp>
              </wp:anchor>
            </w:drawing>
          </mc:Choice>
        </mc:AlternateContent>
      </w:r>
    </w:p>
  </w:body>
</w:document>
XML;
        $file = $this->makeDocxUploadedFile('textbox.docx', $documentXml);

        $result = $service->import($file);

        $this->assertStringContainsString('Encabezado institucional', $result['text']);
        $this->assertStringNotContainsString('3868647', $result['text']);
        $this->assertStringContainsString('Encabezado institucional', $result['html']);
    }

    public function test_docx_import_reads_vml_textbox_text_without_txbxcontent(): void
    {
        $service = app(DocumentImportService::class);
        $documentXml = <<<'XML'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:v="urn:schemas-microsoft-com:vml">
  <w:body>
    <w:p>
      <w:r>
        <w:pict>
          <v:shape>
            <v:textbox>
              <div>Texto final del sello institucional</div>
            </v:textbox>
          </v:shape>
        </w:pict>
      </w:r>
    </w:p>
  </w:body>
</w:document>
XML;
        $file = $this->makeDocxUploadedFile('textbox-vml.docx', $documentXml);

        $result = $service->import($file);

        $this->assertStringContainsString('Texto final del sello institucional', $result['text']);
        $this->assertStringContainsString('Texto final del sello institucional', $result['html']);
    }

    public function test_docx_import_prefers_footer_variant_with_real_content(): void
    {
        $service = app(DocumentImportService::class);
        $entries = [
            'word/document.xml' => <<<'XML'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>
    <w:p><w:r><w:t>Cuerpo principal</w:t></w:r></w:p>
    <w:sectPr>
      <w:footerReference w:type="first" r:id="rId1"/>
      <w:footerReference w:type="default" r:id="rId2"/>
    </w:sectPr>
  </w:body>
</w:document>
XML,
            'word/footer1.xml' => <<<'XML'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:p><w:r><w:t>Firma institucional al final</w:t></w:r></w:p>
</w:ftr>
XML,
            'word/footer2.xml' => <<<'XML'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:p/>
</w:ftr>
XML,
            'word/_rels/document.xml.rels' => <<<'XML'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer2.xml"/>
</Relationships>
XML,
        ];
        $file = $this->makeDocxUploadedFileFromEntries('footer-variants.docx', $entries);

        $result = $service->import($file);

        $this->assertStringContainsString('Firma institucional al final', $result['text']);
        $this->assertStringContainsString('Firma institucional al final', $result['footer_html']);
    }

    public function test_docx_import_renders_visual_rule_shapes_at_document_end(): void
    {
        $service = app(DocumentImportService::class);
        $documentXml = <<<'XML'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:v="urn:schemas-microsoft-com:vml">
  <w:body>
    <w:p>
      <w:r>
        <w:pict>
          <v:line from="0,0" to="150pt,0" />
        </w:pict>
      </w:r>
    </w:p>
  </w:body>
</w:document>
XML;
        $file = $this->makeDocxUploadedFile('linea-final.docx', $documentXml);

        $result = $service->import($file);

        $this->assertStringContainsString('__________________________________', $result['text']);
        $this->assertStringContainsString('docx-rule', $result['html']);
    }

    public function test_txt_import_does_not_collapse_alignment_spaces(): void
    {
        $service = app(DocumentImportService::class);
        $file = $this->makeUploadedFile('tabla.txt', "Columna A    Columna B\nDato 1       Dato 2\n");

        $result = $service->import($file);

        $this->assertStringContainsString('Columna A    Columna B', $result['text']);
        $this->assertStringContainsString('Dato 1       Dato 2', $result['text']);
        $this->assertStringContainsString('imported-pre', $result['html']);
    }

    private function makeUploadedFile(string $name, string $contents): UploadedFile
    {
        $path = tempnam(sys_get_temp_dir(), 'imp');
        file_put_contents($path, $contents);

        return new UploadedFile($path, $name, null, null, true);
    }

    private function makeDocxUploadedFile(string $name, string $documentXml): UploadedFile
    {
        return $this->makeDocxUploadedFileFromEntries($name, [
            'word/document.xml' => $documentXml,
        ]);
    }

    private function makeDocxUploadedFileFromEntries(string $name, array $entries): UploadedFile
    {
        $path = tempnam(sys_get_temp_dir(), 'docx');
        $docxPath = $path . '.docx';
        @unlink($path);

        $zip = new ZipArchive();
        $zip->open($docxPath, ZipArchive::CREATE | ZipArchive::OVERWRITE);

        foreach ($entries as $entryName => $contents) {
            $directory = dirname($entryName);

            if ($directory !== '.' && $directory !== '') {
                $segments = explode('/', str_replace('\\', '/', $directory));
                $current = '';

                foreach ($segments as $segment) {
                    $current = $current === '' ? $segment : $current . '/' . $segment;
                    @$zip->addEmptyDir($current);
                }
            }

            $zip->addFromString($entryName, $contents);
        }

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
