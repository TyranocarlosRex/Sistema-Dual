<!doctype html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <title>{{ $generatedDocument['student']['nombre_completo'] ?? ($document->titulo ?? 'Documento generado') }}</title>
    @php
        $fitScale = isset($scale) ? max(0.76, min(1.0, (float) $scale)) : 1.0;
        $pageMarginTop = max(8, 18 * $fitScale);
        $pageMarginSide = max(8, 16 * $fitScale);
        $bodyFontSize = max(9.2, 12 * $fitScale);
        $lineHeight = max(1.2, 1.45 - ((1 - $fitScale) * 0.18));
        $headerMargin = max(10, 18 * $fitScale);
        $footerMargin = max(12, 20 * $fitScale);
        $paragraphMargin = max(5, 10 * $fitScale);
        $tableOuterMarginTop = max(8, 12 * $fitScale);
        $tableOuterMarginBottom = max(10, 16 * $fitScale);
        $tableCellPaddingY = max(4, 6 * $fitScale);
        $tableCellPaddingX = max(5, 8 * $fitScale);
        $ruleMarginTop = max(5, 8 * $fitScale);
        $ruleMarginBottom = max(8, 12 * $fitScale);
        $mediaMargin = max(6, 10 * $fitScale);
        $monoFontSize = max(8.6, 11 * $fitScale);
    @endphp
    <style>
        @page {
            margin: {{ number_format($pageMarginTop, 2, '.', '') }}mm {{ number_format($pageMarginSide, 2, '.', '') }}mm;
        }

        * {
            box-sizing: border-box;
        }

        body {
            margin: 0;
            color: #0f172a;
            font-family: DejaVu Sans, sans-serif;
            font-size: {{ number_format($bodyFontSize, 2, '.', '') }}px;
            line-height: {{ number_format($lineHeight, 2, '.', '') }};
        }

        img {
            max-width: 100%;
            height: auto;
            page-break-inside: avoid;
        }

        .document-shell {
            width: 100%;
        }

        .docx-section--header {
            margin-bottom: {{ number_format($headerMargin, 2, '.', '') }}px;
            page-break-after: avoid;
        }

        .docx-section--footer {
            margin-top: {{ number_format($footerMargin, 2, '.', '') }}px;
            page-break-before: avoid;
        }

        .docx-paragraph {
            margin: 0 0 {{ number_format($paragraphMargin, 2, '.', '') }}px;
            white-space: pre-wrap;
            line-height: {{ number_format($lineHeight, 2, '.', '') }};
            page-break-inside: avoid;
        }

        .docx-paragraph.is-right {
            text-align: right;
        }

        .docx-paragraph.is-center {
            text-align: center;
        }

        .docx-paragraph.is-justify {
            text-align: justify;
        }

        .docx-table {
            width: 100%;
            border-collapse: collapse;
            margin: {{ number_format($tableOuterMarginTop, 2, '.', '') }}px 0 {{ number_format($tableOuterMarginBottom, 2, '.', '') }}px;
            page-break-inside: avoid;
        }

        .docx-table td,
        .docx-table th {
            border: 1px solid #cbd5e1;
            padding: {{ number_format($tableCellPaddingY, 2, '.', '') }}px {{ number_format($tableCellPaddingX, 2, '.', '') }}px;
            vertical-align: top;
        }

        .docx-rule {
            display: block;
            width: 100%;
            height: 0;
            margin: {{ number_format($ruleMarginTop, 2, '.', '') }}px 0 {{ number_format($ruleMarginBottom, 2, '.', '') }}px;
            border-top: 1.5px solid #64748b;
        }

        .docx-textbox,
        .docx-media--banner,
        .docx-media--inline {
            margin-bottom: {{ number_format($mediaMargin, 2, '.', '') }}px;
            page-break-inside: avoid;
        }

        .imported-pre {
            margin: 0;
            white-space: pre-wrap;
            word-break: break-word;
            font-family: DejaVu Sans Mono, monospace;
            font-size: {{ number_format($monoFontSize, 2, '.', '') }}px;
            line-height: {{ number_format(max(1.2, $lineHeight + 0.05), 2, '.', '') }};
        }
    </style>
</head>
<body>
    <div class="document-shell">
        @if (!empty($generatedDocument['header_html']))
            <div class="docx-section docx-section--header">{!! $generatedDocument['header_html'] !!}</div>
        @endif

        {!! $generatedDocument['body_html'] ?? '' !!}

        @if (!empty($generatedDocument['footer_html']))
            <div class="docx-section docx-section--footer">{!! $generatedDocument['footer_html'] !!}</div>
        @endif
    </div>
</body>
</html>
