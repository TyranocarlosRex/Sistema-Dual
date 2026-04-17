<!doctype html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <title>{{ $generatedDocument['student']['nombre_completo'] ?? ($document->titulo ?? 'Documento generado') }}</title>
    <style>
        @page {
            margin: 18mm 16mm;
        }

        * {
            box-sizing: border-box;
        }

        body {
            margin: 0;
            color: #0f172a;
            font-family: DejaVu Sans, sans-serif;
            font-size: 12px;
            line-height: 1.45;
        }

        img {
            max-width: 100%;
            height: auto;
        }

        .document-shell {
            width: 100%;
        }

        .docx-section--header {
            margin-bottom: 18px;
        }

        .docx-section--footer {
            margin-top: 20px;
        }

        .docx-paragraph {
            margin: 0 0 10px;
            white-space: pre-wrap;
            line-height: 1.45;
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
            margin: 12px 0 16px;
        }

        .docx-table td,
        .docx-table th {
            border: 1px solid #cbd5e1;
            padding: 6px 8px;
            vertical-align: top;
        }

        .docx-rule {
            display: block;
            width: 100%;
            height: 0;
            margin: 8px 0 12px;
            border-top: 1.5px solid #64748b;
        }

        .docx-textbox,
        .docx-media--banner,
        .docx-media--inline {
            margin-bottom: 10px;
        }

        .imported-pre {
            margin: 0;
            white-space: pre-wrap;
            word-break: break-word;
            font-family: DejaVu Sans Mono, monospace;
            font-size: 11px;
            line-height: 1.5;
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
