<?php

namespace App\Support;

use DOMDocument;
use DOMElement;
use DOMNode;

class DocumentTemplateContentService
{
    private const ALLOWED_TAGS = [
        'blockquote', 'br', 'code', 'div', 'em', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'hr', 'img', 'li', 'ol', 'p', 'pre', 's', 'small', 'span', 'strong', 'sub',
        'sup', 'table', 'tbody', 'td', 'tfoot', 'th', 'thead', 'tr', 'u', 'ul',
    ];

    private const DROP_WITH_CONTENT = [
        'embed', 'frame', 'frameset', 'iframe', 'link', 'meta', 'object', 'script', 'style',
    ];

    private const GLOBAL_ATTRIBUTES = [
        'class', 'contenteditable', 'style',
    ];

    private const TAG_ATTRIBUTES = [
        'img' => ['alt', 'draggable', 'height', 'src', 'width'],
        'td' => ['colspan', 'rowspan'],
        'th' => ['colspan', 'rowspan'],
    ];

    public function preparePayload(array $validated): array
    {
        $headerHtml = $this->sanitizeHtml((string) ($validated['header_html'] ?? ''));
        $bodyHtml = $this->sanitizeHtml((string) ($validated['body_html'] ?? ''));
        $footerHtml = $this->sanitizeHtml((string) ($validated['footer_html'] ?? ''));
        $plainText = $this->buildPlainText([$headerHtml, $bodyHtml, $footerHtml]);

        return [
            'titulo' => trim((string) $validated['titulo']),
            'descripcion' => $this->nullableTrim($validated['descripcion'] ?? null),
            'header_html' => $headerHtml,
            'body_html' => $bodyHtml,
            'footer_html' => $footerHtml,
            'plain_text' => $plainText,
            'source_filename' => $this->nullableTrim($validated['source_filename'] ?? null),
            'source_extension' => $this->normalizeExtension($validated['source_extension'] ?? null),
            'placeholders' => $this->extractPlaceholders($headerHtml . "\n" . $bodyHtml . "\n" . $footerHtml),
        ];
    }

    public function countLines(string $text): int
    {
        $normalized = preg_replace("/\r\n?/", "\n", trim($text));

        if ($normalized === '') {
            return 0;
        }

        return substr_count($normalized, "\n") + 1;
    }

    private function sanitizeHtml(string $html): string
    {
        if (trim($html) === '') {
            return '';
        }

        $document = new DOMDocument('1.0', 'UTF-8');
        libxml_use_internal_errors(true);
        $document->loadHTML(
            '<?xml encoding="utf-8" ?><body>' . $html . '</body>',
            LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD
        );
        libxml_clear_errors();

        $body = $document->getElementsByTagName('body')->item(0);

        if (!$body instanceof DOMElement) {
            return '';
        }

        foreach ($this->childNodesToArray($body) as $child) {
            $this->sanitizeNode($child);
        }

        return $this->innerHtml($body);
    }

    private function sanitizeNode(DOMNode $node): void
    {
        if ($node->nodeType === XML_TEXT_NODE) {
            return;
        }

        if ($node->nodeType !== XML_ELEMENT_NODE) {
            $node->parentNode?->removeChild($node);
            return;
        }

        $tag = strtolower($node->nodeName);

        if (in_array($tag, self::DROP_WITH_CONTENT, true)) {
            $node->parentNode?->removeChild($node);
            return;
        }

        if (!in_array($tag, self::ALLOWED_TAGS, true)) {
            $this->unwrapNode($node);
            return;
        }

        $this->sanitizeAttributes($node, $tag);

        foreach ($this->childNodesToArray($node) as $child) {
            $this->sanitizeNode($child);
        }
    }

    private function sanitizeAttributes(DOMNode $node, string $tag): void
    {
        if (!$node instanceof DOMElement || !$node->hasAttributes()) {
            return;
        }

        $tagAttributes = self::TAG_ATTRIBUTES[$tag] ?? [];

        foreach ($this->attributesToArray($node) as $attribute) {
            $name = strtolower($attribute->nodeName);

            if (!in_array($name, self::GLOBAL_ATTRIBUTES, true) && !in_array($name, $tagAttributes, true)) {
                $node->removeAttributeNode($attribute);
                continue;
            }

            $value = (string) $attribute->nodeValue;

            if ($name === 'class') {
                $clean = $this->sanitizeClassList($value);
            } elseif ($name === 'style') {
                $clean = $this->sanitizeStyle($value);
            } elseif ($name === 'contenteditable') {
                $clean = $this->sanitizeContentEditable($value);
            } elseif ($name === 'src') {
                $clean = $this->sanitizeImageSource($value);
            } elseif (in_array($name, ['colspan', 'rowspan', 'width', 'height'], true)) {
                $clean = preg_match('/^\d+$/', trim($value)) === 1 ? trim($value) : '';
            } elseif ($name === 'draggable') {
                $clean = in_array(strtolower(trim($value)), ['true', 'false'], true) ? strtolower(trim($value)) : '';
            } elseif ($name === 'alt') {
                $clean = trim(strip_tags($value));
            } else {
                $clean = trim($value);
            }

            if ($clean === '') {
                $node->removeAttributeNode($attribute);
                continue;
            }

            $attribute->nodeValue = $clean;
        }
    }

    private function sanitizeClassList(string $value): string
    {
        $classes = preg_split('/\s+/', trim($value)) ?: [];
        $safe = [];

        foreach ($classes as $class) {
            if ($class !== '' && preg_match('/^[A-Za-z0-9_-]+$/', $class) === 1) {
                $safe[$class] = true;
            }
        }

        return implode(' ', array_keys($safe));
    }

    private function sanitizeStyle(string $value): string
    {
        $declarations = array_filter(array_map('trim', explode(';', $value)));
        $safe = [];

        foreach ($declarations as $declaration) {
            if (!str_contains($declaration, ':')) {
                continue;
            }

            [$property, $rawValue] = array_map('trim', explode(':', $declaration, 2));
            $property = strtolower($property);
            $candidate = strtolower($property . ':' . $rawValue);

            if (
                $property === ''
                || preg_match('/^[a-z-]+$/', $property) !== 1
                || preg_match('/expression|javascript:|url\(|@import|behavior:/i', $candidate) === 1
                || preg_match('/^[#(),.%\-\/:_ a-z0-9]+$/i', $rawValue) !== 1
            ) {
                continue;
            }

            $safe[] = $property . ':' . $rawValue;
        }

        return implode(';', $safe);
    }

    private function sanitizeContentEditable(string $value): string
    {
        $normalized = strtolower(trim($value));

        return in_array($normalized, ['true', 'false', 'plaintext-only'], true) ? $normalized : '';
    }

    private function sanitizeImageSource(string $value): string
    {
        $normalized = trim($value);

        if ($normalized === '') {
            return '';
        }

        if (preg_match('#^data:image/[a-z0-9.+-]+;base64,[a-z0-9+/=]+$#i', $normalized) === 1) {
            return $normalized;
        }

        if (preg_match('#^(https?:)?//#i', $normalized) === 1 || str_starts_with($normalized, '/')) {
            return $normalized;
        }

        return '';
    }

    private function buildPlainText(array $sections): string
    {
        $parts = [];

        foreach ($sections as $html) {
            $text = $this->extractPlainTextFromHtml((string) $html);

            if ($text !== '') {
                $parts[] = $text;
            }
        }

        $text = implode("\n\n", $parts);
        $text = preg_replace("/\r\n?/", "\n", $text);
        $text = preg_replace("/[ \t]+\n/", "\n", $text);
        $text = preg_replace("/\n{3,}/", "\n\n", $text);

        return trim((string) $text);
    }

    private function extractPlainTextFromHtml(string $html): string
    {
        if (trim($html) === '') {
            return '';
        }

        $normalized = preg_replace('/<\s*br\s*\/?>/i', "\n", $html);
        $normalized = preg_replace('/<\/(p|div|li|tr|blockquote|pre|h[1-6])>/i', "\n", (string) $normalized);
        $normalized = preg_replace('/<\/(td|th)>/i', "\t", (string) $normalized);
        $normalized = html_entity_decode(strip_tags((string) $normalized), ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $normalized = str_replace("\xc2\xa0", ' ', $normalized);
        $normalized = preg_replace('/[ \t]{2,}/', ' ', $normalized);
        $normalized = preg_replace("/\n{3,}/", "\n\n", (string) $normalized);

        return trim((string) $normalized);
    }

    private function extractPlaceholders(string $content): array
    {
        preg_match_all('/\{([a-z0-9_.-]+)\}/i', $content, $matches);
        $tokens = array_values(array_unique(array_map('strtolower', $matches[1] ?? [])));

        sort($tokens);

        return $tokens;
    }

    private function normalizeExtension(mixed $value): ?string
    {
        $normalized = strtolower(ltrim(trim((string) $value), '.'));

        return $normalized !== '' ? $normalized : null;
    }

    private function nullableTrim(mixed $value): ?string
    {
        $normalized = trim((string) $value);

        return $normalized !== '' ? $normalized : null;
    }

    private function unwrapNode(DOMNode $node): void
    {
        $parent = $node->parentNode;

        if (!$parent) {
            return;
        }

        while ($node->firstChild) {
            $parent->insertBefore($node->firstChild, $node);
        }

        $parent->removeChild($node);
    }

    private function innerHtml(DOMNode $node): string
    {
        $html = '';

        foreach ($node->childNodes as $child) {
            $html .= $node->ownerDocument?->saveHTML($child) ?? '';
        }

        return $html;
    }

    private function childNodesToArray(DOMNode $node): array
    {
        $children = [];

        foreach ($node->childNodes as $child) {
            $children[] = $child;
        }

        return $children;
    }

    private function attributesToArray(DOMElement $element): array
    {
        $attributes = [];

        foreach ($element->attributes as $attribute) {
            $attributes[] = $attribute;
        }

        return $attributes;
    }
}
