<?php

namespace App\Support;

use DOMDocument;
use DOMNode;
use DOMXPath;
use Illuminate\Http\UploadedFile;
use RuntimeException;
use ZipArchive;

class DocumentImportService
{
    private const DOCX_NS_W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
    private const DOCX_NS_R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';

    public function import(UploadedFile $file): array
    {
        $extension = strtolower($file->getClientOriginalExtension());

        $payload = match ($extension) {
            'txt' => $this->importTxt($file),
            'html', 'htm' => $this->importHtml($file),
            'docx' => $this->importDocx($file),
            'pdf' => $this->importPdf($file),
            default => throw new RuntimeException('Formato no soportado. Usa TXT, HTML, DOCX o PDF.'),
        };

        $text = $payload['text'] ?? '';
        $html = $payload['html'] ?? $this->buildPlainPreviewHtml($text);

        return [
            'filename' => $file->getClientOriginalName(),
            'extension' => $extension,
            'text' => $text,
            'html' => $html,
            'header_html' => $payload['header_html'] ?? '',
            'body_html' => $payload['body_html'] ?? $html,
            'footer_html' => $payload['footer_html'] ?? '',
            'characters' => mb_strlen($text),
            'lines' => $this->countLines($text),
        ];
    }

    private function importTxt(UploadedFile $file): array
    {
        $contents = $file->get();

        if ($contents === false) {
            throw new RuntimeException('No se pudo leer el archivo TXT.');
        }

        $text = $this->normalizeText($contents);

        return [
            'text' => $text,
            'html' => $this->buildPlainPreviewHtml($text),
            'body_html' => $this->buildPlainPreviewHtml($text),
        ];
    }

    private function importHtml(UploadedFile $file): array
    {
        $contents = $file->get();

        if ($contents === false) {
            throw new RuntimeException('No se pudo leer el archivo HTML.');
        }

        $document = new DOMDocument('1.0', 'UTF-8');
        libxml_use_internal_errors(true);
        $html = mb_convert_encoding($contents, 'HTML-ENTITIES', 'UTF-8, Windows-1252, ISO-8859-1');
        $document->loadHTML($html, LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD);
        libxml_clear_errors();

        $root = $document->getElementsByTagName('body')->item(0) ?? $document->documentElement;
        $blocks = $root ? $this->renderHtmlNodes($root->childNodes) : [];
        $text = $this->normalizeText(implode("\n\n", array_filter($blocks)));

        if ($text === '') {
            $text = $this->normalizeText((string) $document->textContent);
        }

        if ($text === '') {
            throw new RuntimeException('No se encontro contenido util dentro del HTML.');
        }

        return [
            'text' => $text,
            'html' => $this->buildPlainPreviewHtml($text),
            'body_html' => $this->buildPlainPreviewHtml($text),
        ];
    }

    private function importDocx(UploadedFile $file): array
    {
        $realPath = $file->getRealPath();

        if ($realPath === false) {
            throw new RuntimeException('No se pudo acceder al archivo DOCX.');
        }

        $zip = new ZipArchive();

        if ($zip->open($realPath) !== true) {
            throw new RuntimeException('No se pudo abrir el archivo DOCX.');
        }

        try {
            $xml = $this->getZipEntryContents($zip, 'word/document.xml');

            if ($xml === null) {
                throw new RuntimeException('El archivo DOCX no contiene texto importable.');
            }

            $document = $this->loadXmlDocument($xml);
            $xpath = $this->makeDocxXPath($document);
            $relationships = $this->loadDocxRelationships($zip, 'word/document.xml');

            $header = $this->resolveBestDocxSectionPart($zip, $xpath, $relationships, 'header');
            $footer = $this->resolveBestDocxSectionPart($zip, $xpath, $relationships, 'footer');

            $bodyNodes = $xpath->query('/w:document/w:body/*[not(self::w:sectPr)]');
            $bodyBlocks = $bodyNodes ? $this->renderDocxNodesText($bodyNodes, $xpath) : [];
            $bodyHtmlBlocks = $bodyNodes ? $this->renderDocxNodesHtml($bodyNodes, $xpath, $zip, $relationships, 'word/document.xml', 'body') : [];

            $text = $this->normalizeText(implode("\n\n", array_filter([
                $header['text'],
                implode("\n\n", $bodyBlocks),
                $footer['text'],
            ])));

            if ($text === '') {
                throw new RuntimeException('No se encontro texto util dentro del DOCX.');
            }

            $sections = [];

            if ($header['html'] !== '') {
                $sections[] = '<div class="docx-section docx-section--header">' . $header['html'] . '</div>';
            }

            if ($bodyHtmlBlocks !== []) {
                $sections[] = '<div class="docx-section docx-section--body">' . implode('', $bodyHtmlBlocks) . '</div>';
            }

            if ($footer['html'] !== '') {
                $sections[] = '<div class="docx-section docx-section--footer">' . $footer['html'] . '</div>';
            }

            return [
                'text' => $text,
                'html' => '<div class="docx-preview">' . implode('', $sections) . '</div>',
                'header_html' => $header['html'],
                'body_html' => implode('', $bodyHtmlBlocks),
                'footer_html' => $footer['html'],
            ];
        } finally {
            $zip->close();
        }
    }

    private function importPdf(UploadedFile $file): array
    {
        $contents = $file->get();

        if ($contents === false) {
            throw new RuntimeException('No se pudo leer el archivo PDF.');
        }

        preg_match_all('/<<(.*?)>>\s*stream\r?\n(.*?)\r?\nendstream/s', $contents, $matches, PREG_SET_ORDER);

        $chunks = [];

        foreach ($matches as $match) {
            $dictionary = $match[1] ?? '';
            $stream = $match[2] ?? '';
            $decoded = $this->decodePdfStream($dictionary, $stream);

            if ($decoded === '') {
                continue;
            }

            $text = $this->extractPdfText($decoded);

            if ($text !== '') {
                $chunks[] = $text;
            }
        }

        $result = $this->normalizeText(implode("\n\n", $chunks));

        if ($result === '') {
            throw new RuntimeException('No se pudo extraer texto del PDF. Si es un PDF escaneado o basado en imagen, necesitara OCR.');
        }

        return [
            'text' => $result,
            'html' => $this->buildPlainPreviewHtml($result),
            'body_html' => $this->buildPlainPreviewHtml($result),
        ];
    }

    private function renderHtmlNodes(iterable $nodes, int $listDepth = 0): array
    {
        $blocks = [];

        foreach ($nodes as $node) {
            foreach ($this->renderHtmlNode($node, $listDepth) as $block) {
                if (trim($block) !== '') {
                    $blocks[] = $block;
                }
            }
        }

        return $blocks;
    }

    private function renderHtmlNode(DOMNode $node, int $listDepth = 0): array
    {
        if ($node->nodeType === XML_TEXT_NODE) {
            $text = $this->normalizeText($node->nodeValue ?? '');
            return $text !== '' ? [$text] : [];
        }

        if ($node->nodeType !== XML_ELEMENT_NODE) {
            return [];
        }

        $name = strtolower($node->nodeName);

        if (in_array($name, ['script', 'style', 'noscript', 'head'], true)) {
            return [];
        }

        if ($this->isHtmlContainerTag($name)) {
            return $this->renderHtmlNodes($node->childNodes, $listDepth);
        }

        return match ($name) {
            'ul' => $this->renderHtmlListText($node, false, $listDepth),
            'ol' => $this->renderHtmlListText($node, true, $listDepth),
            'table' => array_filter([$this->renderHtmlTableText($node)]),
            'pre' => array_filter([$this->normalizeText($node->textContent)]),
            'blockquote' => array_filter([$this->prefixBlockLines($this->normalizeText($this->collectHtmlInlineText($node)), '> ')]),
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p' => array_filter([$this->normalizeText($this->collectHtmlInlineText($node))]),
            default => array_filter([$this->normalizeText($this->collectHtmlInlineText($node))]),
        };
    }

    private function renderHtmlListText(DOMNode $list, bool $ordered, int $listDepth): array
    {
        $items = [];
        $index = 1;

        foreach ($list->childNodes as $child) {
            if ($child->nodeType !== XML_ELEMENT_NODE || strtolower($child->nodeName) !== 'li') {
                continue;
            }

            $itemBlocks = $this->renderHtmlNodes($child->childNodes, $listDepth + 1);
            $itemText = trim(implode("\n", $itemBlocks));

            if ($itemText === '') {
                $itemText = $this->normalizeText($this->collectHtmlInlineText($child));
            }

            if ($itemText === '') {
                continue;
            }

            $prefix = str_repeat('  ', $listDepth) . ($ordered ? ($index++) . '. ' : '- ');
            $items[] = $this->prefixBlockLines($itemText, $prefix);
        }

        return $items;
    }

    private function renderHtmlTableText(DOMNode $table): string
    {
        $rows = [];

        foreach ($table->getElementsByTagName('tr') as $row) {
            $cells = [];

            foreach ($row->childNodes as $cell) {
                if ($cell->nodeType !== XML_ELEMENT_NODE) {
                    continue;
                }

                $name = strtolower($cell->nodeName);
                if (!in_array($name, ['th', 'td'], true)) {
                    continue;
                }

                $cellText = $this->normalizeText($this->collectHtmlInlineText($cell));
                $cells[] = $cellText !== '' ? str_replace("\n", ' / ', $cellText) : '-';
            }

            if ($cells !== []) {
                $rows[] = implode(' | ', $cells);
            }
        }

        return implode("\n", $rows);
    }

    private function collectHtmlInlineText(DOMNode $node): string
    {
        if ($node->nodeType === XML_TEXT_NODE) {
            return $node->nodeValue ?? '';
        }

        if ($node->nodeType !== XML_ELEMENT_NODE) {
            return '';
        }

        $name = strtolower($node->nodeName);

        if (in_array($name, ['script', 'style', 'noscript'], true)) {
            return '';
        }

        if ($name === 'br') {
            return "\n";
        }

        $text = '';
        foreach ($node->childNodes as $child) {
            $text .= $this->collectHtmlInlineText($child);
        }

        return $text;
    }

    private function isHtmlContainerTag(string $tag): bool
    {
        return in_array($tag, [
            'html', 'body', 'main', 'section', 'article', 'header', 'footer',
            'div', 'aside', 'nav', 'figure', 'figcaption', 'details', 'summary',
        ], true);
    }

    private function renderDocxPart(ZipArchive $zip, string $partPath, string $section): array
    {
        $xml = $this->getZipEntryContents($zip, $partPath);

        if ($xml === null) {
            return ['text' => '', 'html' => ''];
        }

        $document = $this->loadXmlDocument($xml);
        $xpath = $this->makeDocxXPath($document);
        $relationships = $this->loadDocxRelationships($zip, $partPath);
        $root = $document->documentElement;

        if (!$root) {
            return ['text' => '', 'html' => ''];
        }

        $textBlocks = $this->renderDocxNodesText($root->childNodes, $xpath);
        $htmlBlocks = $this->renderDocxNodesHtml($root->childNodes, $xpath, $zip, $relationships, $partPath, $section);

        return [
            'text' => $this->normalizeText(implode("\n\n", $textBlocks)),
            'html' => implode('', $htmlBlocks),
        ];
    }

    private function renderDocxNodesText(iterable $nodes, DOMXPath $xpath): array
    {
        $blocks = [];

        foreach ($nodes as $node) {
            if ($node->nodeType !== XML_ELEMENT_NODE) {
                continue;
            }

            if ($node->localName === 'p') {
                $paragraph = $this->renderDocxParagraphText($node, $xpath);
                if ($paragraph !== '') {
                    $blocks[] = $paragraph;
                }
                continue;
            }

            if ($node->localName === 'tbl') {
                $table = $this->renderDocxTableText($node, $xpath);
                if ($table !== '') {
                    $blocks[] = $table;
                }
            }
        }

        return $blocks;
    }

    private function renderDocxNodesHtml(
        iterable $nodes,
        DOMXPath $xpath,
        ZipArchive $zip,
        array $relationships,
        string $partPath,
        string $section
    ): array {
        $blocks = [];

        foreach ($nodes as $node) {
            if ($node->nodeType !== XML_ELEMENT_NODE) {
                continue;
            }

            if ($node->localName === 'p') {
                $paragraph = $this->renderDocxParagraphHtml($node, $xpath, $zip, $relationships, $partPath, $section);
                if ($paragraph !== '') {
                    $blocks[] = $paragraph;
                }
                continue;
            }

            if ($node->localName === 'tbl') {
                $table = $this->renderDocxTableHtml($node, $xpath, $zip, $relationships, $partPath, $section);
                if ($table !== '') {
                    $blocks[] = $table;
                }
            }
        }

        return $blocks;
    }

    private function renderDocxParagraphText(
        DOMNode $paragraph,
        DOMXPath $xpath,
        bool $forTableCell = false,
        bool $includeTextBoxes = true
    ): string {
        $parts = [];

        foreach ($paragraph->childNodes as $child) {
            if ($child->nodeType === XML_ELEMENT_NODE && $child->localName === 'pPr') {
                continue;
            }

            $part = $this->collectDocxInlineText($child);
            if ($part !== '') {
                $parts[] = $part;
            }
        }

        $text = $this->normalizeText(implode('', $parts));

        if ($includeTextBoxes) {
            $textboxParts = $this->extractDocxTextBoxText($paragraph, $xpath, $forTableCell);

            if ($textboxParts !== []) {
                $merged = array_filter([$text, implode("\n", $textboxParts)]);
                $text = $this->normalizeText(implode("\n", $merged));
            }
        }

        if ($text === '' && $this->paragraphHasVisualRule($xpath, $paragraph)) {
            $text = str_repeat('_', 34);
        }

        if ($text === '') {
            return '';
        }

        if (!$forTableCell && $this->isDocxListParagraph($xpath, $paragraph)) {
            return $this->prefixBlockLines($text, '- ');
        }

        return $text;
    }

    private function renderDocxParagraphHtml(
        DOMNode $paragraph,
        DOMXPath $xpath,
        ZipArchive $zip,
        array $relationships,
        string $partPath,
        string $section,
        bool $forTableCell = false,
        bool $includeTextBoxes = true
    ): string {
        $parts = [];

        foreach ($paragraph->childNodes as $child) {
            if ($child->nodeType === XML_ELEMENT_NODE && $child->localName === 'pPr') {
                continue;
            }

            $part = $this->renderDocxInlineHtml($child, $xpath, $zip, $relationships, $partPath, $section);
            if ($part !== '') {
                $parts[] = $part;
            }
        }

        $contentParts = [];
        $inlineHtml = implode('', $parts);
        $isList = !$forTableCell && $this->isDocxListParagraph($xpath, $paragraph);

        if ($inlineHtml !== '') {
            $prefix = $isList ? '<span class="docx-list-marker">&bull; </span>' : '';
            $contentParts[] = '<div class="docx-paragraph__text">' . $prefix . $inlineHtml . '</div>';
        }

        if ($includeTextBoxes) {
            foreach ($this->renderDocxTextBoxHtml($paragraph, $xpath, $zip, $relationships, $partPath, $section) as $textbox) {
                $contentParts[] = '<div class="docx-textbox">' . $textbox . '</div>';
            }
        }

        if ($this->paragraphHasBorderRule($xpath, $paragraph)) {
            $contentParts[] = '<div class="docx-rule" contenteditable="false"></div>';
        }

        if ($contentParts === []) {
            return '';
        }

        $classes = ['docx-paragraph', 'is-' . $this->resolveDocxParagraphAlignment($xpath, $paragraph)];

        if ($isList) {
            $classes[] = 'is-list';
        }

        return '<div class="' . implode(' ', $classes) . '">' . implode('', $contentParts) . '</div>';
    }

    private function renderDocxTableText(DOMNode $table, DOMXPath $xpath): string
    {
        $rows = [];

        foreach ($xpath->query('./w:tr', $table) as $row) {
            $cells = [];

            foreach ($xpath->query('./w:tc', $row) as $cell) {
                $cellText = $this->renderDocxCellText($cell, $xpath);
                $cells[] = $cellText !== '' ? $cellText : '-';
            }

            if ($cells !== []) {
                $rows[] = implode(' | ', $cells);
            }
        }

        return implode("\n", $rows);
    }

    private function renderDocxTableHtml(
        DOMNode $table,
        DOMXPath $xpath,
        ZipArchive $zip,
        array $relationships,
        string $partPath,
        string $section
    ): string {
        $rows = [];

        foreach ($xpath->query('./w:tr', $table) as $row) {
            $cells = [];

            foreach ($xpath->query('./w:tc', $row) as $cell) {
                $paragraphs = [];

                foreach ($xpath->query('./w:p', $cell) as $paragraph) {
                    $html = $this->renderDocxParagraphHtml($paragraph, $xpath, $zip, $relationships, $partPath, $section, true);
                    if ($html !== '') {
                        $paragraphs[] = $html;
                    }
                }

                $cells[] = '<td>' . ($paragraphs !== [] ? implode('', $paragraphs) : '<div class="docx-empty">-</div>') . '</td>';
            }

            if ($cells !== []) {
                $rows[] = '<tr>' . implode('', $cells) . '</tr>';
            }
        }

        if ($rows === []) {
            return '';
        }

        return '<table class="docx-table"><tbody>' . implode('', $rows) . '</tbody></table>';
    }

    private function renderDocxCellText(DOMNode $cell, DOMXPath $xpath): string
    {
        $parts = [];

        foreach ($xpath->query('./w:p', $cell) as $paragraph) {
            $text = $this->renderDocxParagraphText($paragraph, $xpath, true);
            if ($text !== '') {
                $parts[] = str_replace("\n", ' / ', $text);
            }
        }

        return implode(' / ', $parts);
    }

    private function collectDocxInlineText(DOMNode $node): string
    {
        if ($node->nodeType === XML_TEXT_NODE) {
            return $node->nodeValue ?? '';
        }

        if ($node->nodeType !== XML_ELEMENT_NODE) {
            return '';
        }

        return match ($node->localName) {
            't', 'instrText', 'delText' => $node->textContent,
            'tab' => "\t",
            'br', 'cr' => "\n",
            'drawing', 'pict', 'object' => '',
            default => $this->shouldTraverseDocxInlineNode($node->localName)
                ? $this->collectDocxChildrenText($node)
                : '',
        };
    }

    private function collectDocxChildrenText(DOMNode $node): string
    {
        $text = '';

        foreach ($node->childNodes as $child) {
            $text .= $this->collectDocxInlineText($child);
        }

        return $text;
    }

    private function shouldTraverseDocxInlineNode(string $localName): bool
    {
        return in_array($localName, [
            'r', 'hyperlink', 'smartTag', 'fldSimple', 'ins', 'sdt', 'sdtContent',
            'proofErr', 'bookmarkStart', 'bookmarkEnd', 'AlternateContent', 'Choice', 'Fallback',
            'p', 'ruby', 'rt',
        ], true);
    }

    private function extractDocxTextBoxText(DOMNode $context, DOMXPath $xpath, bool $forTableCell = false): array
    {
        $blocks = [];
        $seen = [];

        foreach ($xpath->query('.//w:txbxContent/w:p', $context) as $paragraph) {
            $text = $this->renderDocxParagraphText($paragraph, $xpath, $forTableCell, false);

            if ($text === '') {
                continue;
            }

            $key = md5($text);
            if (isset($seen[$key])) {
                continue;
            }

            $seen[$key] = true;
            $blocks[] = $text;
        }

        foreach ($xpath->query('.//v:textbox[not(.//w:txbxContent)]', $context) as $textbox) {
            $text = $this->normalizeText($textbox->textContent ?? '');

            if ($text === '') {
                continue;
            }

            $key = md5($text);
            if (isset($seen[$key])) {
                continue;
            }

            $seen[$key] = true;
            $blocks[] = $text;
        }

        return $blocks;
    }

    private function renderDocxTextBoxHtml(
        DOMNode $context,
        DOMXPath $xpath,
        ZipArchive $zip,
        array $relationships,
        string $partPath,
        string $section
    ): array {
        $blocks = [];
        $seen = [];

        foreach ($xpath->query('.//w:txbxContent', $context) as $textbox) {
            $paragraphs = [];

            foreach ($xpath->query('./w:p', $textbox) as $paragraph) {
                $html = $this->renderDocxParagraphHtml($paragraph, $xpath, $zip, $relationships, $partPath, $section, false, false);
                if ($html !== '') {
                    $paragraphs[] = $html;
                }
            }

            $html = implode('', $paragraphs);

            if ($html === '') {
                continue;
            }

            $key = md5($html);
            if (isset($seen[$key])) {
                continue;
            }

            $seen[$key] = true;
            $blocks[] = $html;
        }

        foreach ($xpath->query('.//v:textbox[not(.//w:txbxContent)]', $context) as $textbox) {
            $text = $this->normalizeText($textbox->textContent ?? '');

            if ($text === '') {
                continue;
            }

            $html = '<div class="docx-paragraph is-left"><div class="docx-paragraph__text">' . $this->escapePreviewText($text) . '</div></div>';
            $key = md5($html);

            if (isset($seen[$key])) {
                continue;
            }

            $seen[$key] = true;
            $blocks[] = $html;
        }

        return $blocks;
    }

    private function renderDocxInlineHtml(
        DOMNode $node,
        DOMXPath $xpath,
        ZipArchive $zip,
        array $relationships,
        string $partPath,
        string $section
    ): string {
        if ($node->nodeType !== XML_ELEMENT_NODE) {
            return '';
        }

        return match ($node->localName) {
            't', 'instrText', 'delText' => $this->escapePreviewText($node->textContent),
            'tab' => '    ',
            'br', 'cr' => '<br>',
            'drawing', 'pict' => $this->renderDocxMediaHtml($node, $xpath, $zip, $relationships, $partPath, $section),
            'r' => $this->renderDocxRunHtml($node, $xpath, $zip, $relationships, $partPath, $section),
            default => $this->shouldTraverseDocxInlineNode($node->localName)
                ? $this->renderDocxChildrenHtml($node, $xpath, $zip, $relationships, $partPath, $section)
                : '',
        };
    }

    private function renderDocxChildrenHtml(
        DOMNode $node,
        DOMXPath $xpath,
        ZipArchive $zip,
        array $relationships,
        string $partPath,
        string $section
    ): string {
        $html = '';

        foreach ($node->childNodes as $child) {
            $html .= $this->renderDocxInlineHtml($child, $xpath, $zip, $relationships, $partPath, $section);
        }

        return $html;
    }

    private function renderDocxRunHtml(
        DOMNode $run,
        DOMXPath $xpath,
        ZipArchive $zip,
        array $relationships,
        string $partPath,
        string $section
    ): string {
        $html = '';

        foreach ($run->childNodes as $child) {
            if ($child->nodeType === XML_ELEMENT_NODE && $child->localName === 'rPr') {
                continue;
            }

            $html .= $this->renderDocxInlineHtml($child, $xpath, $zip, $relationships, $partPath, $section);
        }

        if ($html === '') {
            return '';
        }

        $style = $this->buildDocxRunStyle($xpath, $run);
        $attribute = $style !== '' ? ' style="' . $style . '"' : '';

        return '<span class="docx-run"' . $attribute . '>' . $html . '</span>';
    }

    private function buildDocxRunStyle(DOMXPath $xpath, DOMNode $run): string
    {
        $style = [];

        if ($xpath->query('./w:rPr/w:b', $run)->length > 0) {
            $style[] = 'font-weight:700';
        }

        if ($xpath->query('./w:rPr/w:i', $run)->length > 0) {
            $style[] = 'font-style:italic';
        }

        if ($xpath->query('./w:rPr/w:u', $run)->length > 0) {
            $style[] = 'text-decoration:underline';
        }

        if ($xpath->query('./w:rPr/w:caps', $run)->length > 0) {
            $style[] = 'text-transform:uppercase';
        }

        $colorNode = $xpath->query('./w:rPr/w:color/@w:val', $run)->item(0);
        $color = trim((string) $colorNode?->nodeValue);

        if ($color !== '' && preg_match('/^[0-9A-Fa-f]{6}$/', $color) === 1 && strtolower($color) !== 'auto') {
            $style[] = 'color:#' . strtolower($color);
        }

        $sizeNode = $xpath->query('./w:rPr/w:sz/@w:val', $run)->item(0);
        $size = $sizeNode?->nodeValue;

        if (is_numeric($size)) {
            $style[] = 'font-size:' . (((float) $size) / 2) . 'pt';
        }

        return implode(';', $style);
    }

    private function renderDocxMediaHtml(
        DOMNode $node,
        DOMXPath $xpath,
        ZipArchive $zip,
        array $relationships,
        string $partPath,
        string $section
    ): string {
        $ids = [];

        foreach ($xpath->query('.//*[@r:embed]', $node) as $mediaNode) {
            $id = trim((string) $mediaNode->getAttributeNS(self::DOCX_NS_R, 'embed'));
            if ($id !== '') {
                $ids[$id] = true;
            }
        }

        foreach ($xpath->query('.//v:imagedata[@r:id]', $node) as $mediaNode) {
            $id = trim((string) $mediaNode->getAttributeNS(self::DOCX_NS_R, 'id'));
            if ($id !== '') {
                $ids[$id] = true;
            }
        }

        $wrapperClass = $section === 'body' ? 'docx-media docx-media--inline' : 'docx-media docx-media--banner';
        $imageClass = $section === 'body' ? 'docx-image docx-image--inline' : 'docx-image docx-image--banner';

        if ($ids === []) {
            return $this->containsDocxLineShape($xpath, $node)
                ? '<span class="' . $wrapperClass . '"><span class="docx-rule" contenteditable="false"></span></span>'
                : '';
        }

        $images = [];

        foreach (array_keys($ids) as $id) {
            $src = $this->resolveDocxMediaDataUri($zip, $relationships, $id);

            if ($src === null) {
                continue;
            }

            $images[] = '<img class="' . $imageClass . '" src="' . $src . '" alt="" contenteditable="false" draggable="false">';
        }

        if ($images === []) {
            return $this->containsDocxLineShape($xpath, $node)
                ? '<span class="' . $wrapperClass . '"><span class="docx-rule" contenteditable="false"></span></span>'
                : '';
        }

        return '<span class="' . $wrapperClass . '">' . implode('', $images) . '</span>';
    }

    private function resolveDocxParagraphAlignment(DOMXPath $xpath, DOMNode $paragraph): string
    {
        $value = strtolower(trim((string) $xpath->query('./w:pPr/w:jc/@w:val', $paragraph)->item(0)?->nodeValue));

        return match ($value) {
            'right', 'end' => 'right',
            'center' => 'center',
            'both', 'distribute', 'thai-distribute' => 'justify',
            default => 'left',
        };
    }

    private function paragraphHasBorderRule(DOMXPath $xpath, DOMNode $paragraph): bool
    {
        return $xpath->query('./w:pPr/w:pBdr/*[@w:val and not(@w:val="nil") and not(@w:val="none")]', $paragraph)->length > 0;
    }

    private function containsDocxLineShape(DOMXPath $xpath, DOMNode $context): bool
    {
        if ($xpath->query('.//v:line', $context)->length > 0) {
            return true;
        }

        return $xpath->query('.//wps:spPr/a:ln[not(a:noFill)]', $context)->length > 0
            && $xpath->query('.//*[@r:embed] | .//v:imagedata[@r:id]', $context)->length === 0;
    }

    private function paragraphHasVisualRule(DOMXPath $xpath, DOMNode $paragraph): bool
    {
        return $this->paragraphHasBorderRule($xpath, $paragraph)
            || $this->containsDocxLineShape($xpath, $paragraph);
    }

    private function isDocxListParagraph(DOMXPath $xpath, DOMNode $paragraph): bool
    {
        return $xpath->query('./w:pPr/w:numPr', $paragraph)->length > 0;
    }

    private function loadXmlDocument(string $xml): DOMDocument
    {
        $document = new DOMDocument();
        libxml_use_internal_errors(true);
        $document->loadXML($xml);
        libxml_clear_errors();

        return $document;
    }

    private function makeDocxXPath(DOMDocument $document): DOMXPath
    {
        $xpath = new DOMXPath($document);
        $xpath->registerNamespace('w', self::DOCX_NS_W);
        $xpath->registerNamespace('r', self::DOCX_NS_R);
        $xpath->registerNamespace('v', 'urn:schemas-microsoft-com:vml');
        $xpath->registerNamespace('mc', 'http://schemas.openxmlformats.org/markup-compatibility/2006');
        $xpath->registerNamespace('wp', 'http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing');
        $xpath->registerNamespace('a', 'http://schemas.openxmlformats.org/drawingml/2006/main');
        $xpath->registerNamespace('pic', 'http://schemas.openxmlformats.org/drawingml/2006/picture');
        $xpath->registerNamespace('wps', 'http://schemas.microsoft.com/office/word/2010/wordprocessingShape');

        return $xpath;
    }

    private function resolveBestDocxSectionPart(
        ZipArchive $zip,
        DOMXPath $xpath,
        array $relationships,
        string $type
    ): array {
        $sectionProperties = $this->resolveDocxSectionProperties($xpath);

        if (!$sectionProperties) {
            return ['text' => '', 'html' => '', 'path' => null, 'score' => -1];
        }

        $best = ['text' => '', 'html' => '', 'path' => null, 'score' => -1];
        $seen = [];

        foreach (['first', 'default', 'even'] as $variant) {
            $attribute = $xpath->query('./w:' . $type . 'Reference[@w:type="' . $variant . '"]/@r:id', $sectionProperties)->item(0);
            $relationshipId = trim((string) $attribute?->nodeValue);

            if ($relationshipId === '' || !isset($relationships[$relationshipId])) {
                continue;
            }

            $partPath = $relationships[$relationshipId];

            if (isset($seen[$partPath])) {
                continue;
            }

            $seen[$partPath] = true;
            $part = $this->renderDocxPart($zip, $partPath, $type);
            $score = $this->scoreDocxSectionPart($part);

            if ($score > $best['score']) {
                $best = $part + ['path' => $partPath, 'score' => $score];
            }
        }

        return $best;
    }

    private function scoreDocxSectionPart(array $part): int
    {
        $textScore = mb_strlen(trim((string) ($part['text'] ?? '')));
        $imageScore = substr_count((string) ($part['html'] ?? ''), '<img') * 80;
        $ruleScore = substr_count((string) ($part['html'] ?? ''), 'docx-rule') * 12;

        return $textScore + $imageScore + $ruleScore;
    }

    private function resolveDocxSectionProperties(DOMXPath $xpath): ?DOMNode
    {
        return $xpath->query('/w:document/w:body/w:sectPr')->item(0)
            ?? $xpath->query('(//w:sectPr)[last()]')->item(0);
    }

    private function loadDocxRelationships(ZipArchive $zip, string $partPath): array
    {
        $relationshipsPath = $this->docxRelationshipsPath($partPath);
        $xml = $this->getZipEntryContents($zip, $relationshipsPath);

        if ($xml === null) {
            return [];
        }

        $document = $this->loadXmlDocument($xml);
        $xpath = new DOMXPath($document);
        $xpath->registerNamespace('rel', 'http://schemas.openxmlformats.org/package/2006/relationships');

        $relationships = [];

        foreach ($xpath->query('/rel:Relationships/rel:Relationship') as $relationship) {
            $id = trim((string) $relationship->attributes?->getNamedItem('Id')?->nodeValue);
            $target = trim((string) $relationship->attributes?->getNamedItem('Target')?->nodeValue);
            $mode = strtolower(trim((string) $relationship->attributes?->getNamedItem('TargetMode')?->nodeValue));

            if ($id === '' || $target === '' || $mode === 'external') {
                continue;
            }

            $relationships[$id] = $this->resolveDocxTargetPath($partPath, $target);
        }

        return $relationships;
    }

    private function docxRelationshipsPath(string $partPath): string
    {
        $directory = trim(dirname($partPath), '.');
        $filename = basename($partPath);

        return ($directory !== '' ? $directory . '/' : '') . '_rels/' . $filename . '.rels';
    }

    private function resolveDocxTargetPath(string $partPath, string $target): string
    {
        $target = str_replace('\\', '/', $target);

        if (str_starts_with($target, '/')) {
            return ltrim($target, '/');
        }

        $directory = trim(dirname($partPath), '.');
        $combined = ($directory !== '' ? $directory . '/' : '') . $target;

        return $this->normalizeDocxPath($combined);
    }

    private function normalizeDocxPath(string $path): string
    {
        $segments = [];

        foreach (explode('/', $path) as $segment) {
            if ($segment === '' || $segment === '.') {
                continue;
            }

            if ($segment === '..') {
                array_pop($segments);
                continue;
            }

            $segments[] = $segment;
        }

        return implode('/', $segments);
    }

    private function getZipEntryContents(ZipArchive $zip, string $path): ?string
    {
        $contents = $zip->getFromName($path);

        return $contents === false ? null : $contents;
    }

    private function resolveDocxMediaDataUri(ZipArchive $zip, array $relationships, string $relationshipId): ?string
    {
        $path = $relationships[$relationshipId] ?? null;

        if (!$path) {
            return null;
        }

        $binary = $this->getZipEntryContents($zip, $path);

        if ($binary === null) {
            return null;
        }

        return 'data:' . $this->guessMimeType($path) . ';base64,' . base64_encode($binary);
    }

    private function guessMimeType(string $path): string
    {
        return match (strtolower(pathinfo($path, PATHINFO_EXTENSION))) {
            'jpg', 'jpeg' => 'image/jpeg',
            'gif' => 'image/gif',
            'bmp' => 'image/bmp',
            'svg' => 'image/svg+xml',
            'webp' => 'image/webp',
            default => 'image/png',
        };
    }

    private function buildPlainPreviewHtml(string $text): string
    {
        return '<pre class="imported-pre">' . $this->escapePreviewText($text) . '</pre>';
    }

    private function escapePreviewText(string $text): string
    {
        return htmlspecialchars($text, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    }

    private function decodePdfStream(string $dictionary, string $stream): string
    {
        $data = $stream;

        if (str_contains($dictionary, '/FlateDecode')) {
            $decoded = @zlib_decode($data);

            if ($decoded === false) {
                return '';
            }

            $data = $decoded;
        }

        if (str_contains($dictionary, '/ASCIIHexDecode')) {
            $data = $this->decodeAsciiHex($data);
        }

        return $data;
    }

    private function extractPdfText(string $contents): string
    {
        preg_match_all('/BT(.*?)ET/s', $contents, $blocks, PREG_SET_ORDER);

        $result = [];

        foreach ($blocks as $blockMatch) {
            $block = $blockMatch[1] ?? '';

            preg_match_all('/\[(.*?)\]\s*TJ|(\((?:\\\\|\\\(|\\\)|\\.|[^\\\)])*\)|<[0-9A-Fa-f\s]+>)\s*(Tj|\'|")/s', $block, $matches, PREG_SET_ORDER);

            foreach ($matches as $match) {
                if (($match[1] ?? '') !== '') {
                    $text = $this->decodePdfArray($match[1]);
                    if ($text !== '') {
                        $result[] = $text;
                    }
                    continue;
                }

                $token = $match[2] ?? '';
                $operator = $match[3] ?? 'Tj';
                $text = $this->decodePdfToken($token);

                if ($text !== '') {
                    $result[] = $text;
                }

                if ($operator === "'" || $operator === '"') {
                    $result[] = "\n";
                }
            }
        }

        return trim(implode('', $result));
    }

    private function decodePdfArray(string $value): string
    {
        preg_match_all('/\((?:\\\\|\\\(|\\\)|\\.|[^\\\)])*\)|<[0-9A-Fa-f\s]+>/', $value, $matches);

        $parts = array_map(fn (string $token) => $this->decodePdfToken($token), $matches[0] ?? []);

        return implode('', array_filter($parts, fn (string $part) => $part !== ''));
    }

    private function decodePdfToken(string $token): string
    {
        $token = trim($token);

        if ($token === '') {
            return '';
        }

        if (str_starts_with($token, '(') && str_ends_with($token, ')')) {
            return $this->decodePdfLiteralString(substr($token, 1, -1));
        }

        if (str_starts_with($token, '<') && str_ends_with($token, '>')) {
            return $this->decodePdfHexString(substr($token, 1, -1));
        }

        return '';
    }

    private function decodePdfLiteralString(string $value): string
    {
        $result = '';
        $length = strlen($value);

        for ($index = 0; $index < $length; $index++) {
            $char = $value[$index];

            if ($char !== '\\') {
                $result .= $char;
                continue;
            }

            $index++;

            if ($index >= $length) {
                break;
            }

            $escaped = $value[$index];

            $result .= match ($escaped) {
                'n' => "\n",
                'r' => "\r",
                't' => "\t",
                'b' => "\x08",
                'f' => "\f",
                '\\' => '\\',
                '(' => '(',
                ')' => ')',
                default => ctype_digit($escaped)
                    ? $this->decodePdfOctal($value, $index)
                    : $escaped,
            };
        }

        return $this->decodePdfEncoding($result);
    }

    private function decodePdfOctal(string $value, int &$index): string
    {
        $octal = $value[$index];
        $max = min($index + 2, strlen($value) - 1);

        while ($index + 1 <= $max && ctype_digit($value[$index + 1])) {
            $index++;
            $octal .= $value[$index];
        }

        return chr(octdec($octal));
    }

    private function decodePdfHexString(string $value): string
    {
        $hex = preg_replace('/\s+/u', '', $value) ?? $value;

        if ($hex === '') {
            return '';
        }

        if (strlen($hex) % 2 !== 0) {
            $hex .= '0';
        }

        $binary = hex2bin($hex);

        if ($binary === false) {
            return '';
        }

        return $this->decodePdfEncoding($binary);
    }

    private function decodePdfEncoding(string $value): string
    {
        if (str_starts_with($value, "\xFE\xFF") || str_starts_with($value, "\xFF\xFE")) {
            return mb_convert_encoding($value, 'UTF-8', 'UTF-16');
        }

        return $value;
    }

    private function decodeAsciiHex(string $value): string
    {
        $hex = preg_replace('/\s+/u', '', str_replace('>', '', $value)) ?? $value;

        if ($hex === '') {
            return '';
        }

        if (strlen($hex) % 2 !== 0) {
            $hex .= '0';
        }

        $decoded = hex2bin($hex);

        return $decoded === false ? '' : $decoded;
    }

    private function prefixBlockLines(string $text, string $prefix): string
    {
        $lines = preg_split('/\n/u', $text) ?: [$text];
        $indent = str_repeat(' ', strlen($prefix));

        foreach ($lines as $index => $line) {
            $lines[$index] = ($index === 0 ? $prefix : $indent) . $line;
        }

        return implode("\n", $lines);
    }

    private function normalizeText(string $text): string
    {
        $text = mb_convert_encoding($text, 'UTF-8', 'UTF-8, Windows-1252, ISO-8859-1, ASCII');
        $text = str_replace(["\r\n", "\r"], "\n", $text);
        $text = html_entity_decode($text, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $text = str_replace(["\xC2\xA0", "\u{00A0}"], ' ', $text);
        $text = str_replace("\t", '    ', $text);

        $lines = preg_split('/\n/u', $text) ?: [$text];
        $lines = array_map(static fn (string $line) => rtrim($line, " \t"), $lines);
        $text = implode("\n", $lines);
        $text = preg_replace("/\n{4,}/u", "\n\n\n", $text) ?? $text;

        return trim($text);
    }

    private function countLines(string $text): int
    {
        return $text === '' ? 0 : substr_count($text, "\n") + 1;
    }
}
