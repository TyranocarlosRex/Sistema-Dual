<?php

namespace App\Http\Controllers\AdminControllers;

use App\Http\Requests\DownloadGeneratedDocumentPdfRequest;
use App\Http\Controllers\Concerns\ResolvesPeriodContext;
use App\Http\Controllers\Controller;
use App\Http\Requests\GenerateDocumentTemplateRequest;
use App\Models\DocumentTemplate;
use App\Models\Report;
use App\Models\ReportGeneratedAttachment;
use App\Support\DocumentTemplateGenerationService;
use Barryvdh\DomPDF\Facade\Pdf;
use Barryvdh\DomPDF\PDF as DomPdfWrapper;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Throwable;

class DocumentTemplateGenerationController extends Controller
{
    use ResolvesPeriodContext;

    public function __construct(private readonly DocumentTemplateGenerationService $generator)
    {
    }

    public function options(Request $request): JsonResponse
    {
        if (!$request->filled('periodo_id') && $request->filled('period_id')) {
            $request->merge([
                'periodo_id' => $request->input('period_id'),
            ]);
        }

        $validated = $request->validate([
            'periodo_id' => ['nullable', 'integer', 'exists:periods,id'],
            'period_id' => ['nullable', 'integer', 'exists:periods,id'],
            'search' => ['nullable', 'string', 'max:255'],
            'career' => ['nullable', 'string', 'max:255'],
            'limit' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $period = $this->resolvePeriodFromRequest($request);

        return response()->json(
            $this->generator->options(
                $period,
                (string) ($validated['search'] ?? ''),
                $validated['career'] ?? null,
                (int) ($validated['limit'] ?? 25)
            )
        );
    }

    public function generate(GenerateDocumentTemplateRequest $request, DocumentTemplate $document): JsonResponse
    {
        $validated = $request->validated();
        $period = $this->resolvePeriodFromRequest($request);

        return response()->json(
            $this->generator->generate(
                $document,
                $period,
                (string) $validated['scope'],
                isset($validated['student_id']) ? (int) $validated['student_id'] : null,
                $validated['career'] ?? null
            )
        );
    }

    public function downloadPdf(DownloadGeneratedDocumentPdfRequest $request, DocumentTemplate $document): Response|JsonResponse
    {
        try {
            $validated = $request->validated();
            $period = $this->resolvePeriodFromRequest($request);
            $generated = $this->generator->generate(
                $document,
                $period,
                'student',
                (int) $validated['student_id'],
                null
            );
            $generatedDocument = $generated['documents'][0] ?? null;

            abort_if(!$generatedDocument, 404, 'No se pudo generar el PDF solicitado.');

            if ($this->requiresGdForPdf($generatedDocument)) {
                return $this->missingGdResponse();
            }

            return $this->fitPdfToPage($document, $generatedDocument, $period)
                ->download((string) ($generatedDocument['pdf_filename'] ?? 'documento.pdf'));
        } catch (Throwable $exception) {
            report($exception);

            if ($this->isMissingGdException($exception)) {
                return $this->missingGdResponse();
            }

            return response()->json([
                'message' => 'No se pudo generar el PDF del documento solicitado.',
            ], 422);
        }
    }

    public function attachToReport(Request $request, DocumentTemplate $document): JsonResponse
    {
        $validated = $request->validate([
            'report_id' => ['required', 'integer', 'exists:reports,id'],
            'periodo_id' => ['nullable', 'integer', 'exists:periods,id'],
            'period_id' => ['nullable', 'integer', 'exists:periods,id'],
            'scope' => ['required', 'string', 'in:student,career,all'],
            'student_id' => ['nullable', 'integer', 'exists:students,id'],
            'career' => ['nullable', 'string', 'max:255'],
        ]);

        $report = Report::query()->with('period')->findOrFail((int) $validated['report_id']);

        if ($report->period?->isClosed()) {
            return response()->json([
                'message' => 'No puedes adjuntar documentos a un reporte de un periodo cerrado.',
            ], 422);
        }

        $requestedPeriodId = $validated['periodo_id'] ?? $validated['period_id'] ?? null;
        if ($requestedPeriodId && $report->periodo_id && (int) $requestedPeriodId !== (int) $report->periodo_id) {
            return response()->json([
                'message' => 'El reporte destino pertenece a otro periodo.',
            ], 422);
        }

        $period = $report->period ?: $this->resolvePeriodFromRequest($request);

        if ($period === null) {
            return response()->json([
                'message' => 'Selecciona un reporte asociado a un periodo valido.',
            ], 422);
        }

        $generated = $this->generator->generate(
            $document,
            $period,
            (string) $validated['scope'],
            isset($validated['student_id']) ? (int) $validated['student_id'] : null,
            $validated['career'] ?? null
        );

        if (!extension_loaded('gd')) {
            foreach (($generated['documents'] ?? []) as $generatedDocument) {
                if ($this->documentContainsImages($generatedDocument)) {
                    return $this->missingGdResponse();
                }
            }
        }

        $attachments = [];

        foreach (($generated['documents'] ?? []) as $generatedDocument) {
            $studentId = (int) data_get($generatedDocument, 'student.id', 0);

            if ($studentId <= 0) {
                continue;
            }

            $filename = $this->sanitizeStorageFilename(
                (string) ($generatedDocument['pdf_filename'] ?? $generatedDocument['filename'] ?? 'documento-generado.pdf')
            );
            if (!str_ends_with(mb_strtolower($filename), '.pdf')) {
                $filename .= '.pdf';
            }

            $path = sprintf(
                'generated-report-attachments/report-%d/student-%d/template-%d-%s',
                $report->id,
                $studentId,
                $document->id,
                $filename
            );

            Storage::disk('public')->put(
                $path,
                $this->fitPdfToPage($document, $generatedDocument, $period)->output()
            );

            $existing = ReportGeneratedAttachment::query()
                ->where('report_id', $report->id)
                ->where('student_id', $studentId)
                ->where('document_template_id', $document->id)
                ->first();

            if ($existing && $existing->file_path !== $path) {
                Storage::disk('public')->delete($existing->file_path);
            }

            $attachment = ReportGeneratedAttachment::query()->updateOrCreate(
                [
                    'report_id' => $report->id,
                    'student_id' => $studentId,
                    'document_template_id' => $document->id,
                ],
                [
                    'periodo_id' => $period->id,
                    'file_path' => $path,
                    'original_name' => $filename,
                    'created_by' => $request->user()->id,
                ]
            );

            $attachments[] = $attachment->fresh();
        }

        return response()->json([
            'message' => 'Documentos adjuntados al reporte.',
            'attached_count' => count($attachments),
            'report' => $report->fresh()->load('evidence', 'period'),
            'attachments' => $attachments,
        ], 201);
    }

    private function fitPdfToPage(DocumentTemplate $document, array $generatedDocument, mixed $period): DomPdfWrapper
    {
        $candidateScales = [1.0, 0.97, 0.94, 0.91, 0.88, 0.85, 0.82, 0.79, 0.76];
        $bestPdf = null;

        foreach ($candidateScales as $scale) {
            $pdf = $this->buildPdf($document, $generatedDocument, $period, $scale);
            $pdf->render();
            $bestPdf = $pdf;

            if ($pdf->getCanvas()->get_page_count() <= 1) {
                break;
            }
        }

        return $bestPdf ?? $this->buildPdf($document, $generatedDocument, $period, 1.0);
    }

    private function buildPdf(DocumentTemplate $document, array $generatedDocument, mixed $period, float $scale): DomPdfWrapper
    {
        return Pdf::setOptions([
            'isRemoteEnabled' => true,
            'defaultFont' => 'DejaVu Sans',
        ])
            ->loadView('documents.generated-document-pdf', [
                'document' => $document,
                'generatedDocument' => $generatedDocument,
                'period' => $period,
                'scale' => $scale,
            ])
            ->setPaper('letter', 'portrait');
    }

    private function requiresGdForPdf(array $generatedDocument): bool
    {
        return !extension_loaded('gd') && $this->documentContainsImages($generatedDocument);
    }

    private function isMissingGdException(Throwable $exception): bool
    {
        return str_contains(strtolower($exception->getMessage()), 'gd extension is required');
    }

    private function documentContainsImages(array $generatedDocument): bool
    {
        foreach (['header_html', 'body_html', 'footer_html'] as $field) {
            $html = (string) ($generatedDocument[$field] ?? '');

            if (preg_match('/<img\b/i', $html) === 1) {
                return true;
            }

            if (preg_match('/background(?:-image)?\s*:\s*url\(/i', $html) === 1) {
                return true;
            }
        }

        return false;
    }

    private function missingGdResponse(): JsonResponse
    {
        return response()->json([
            'message' => 'El servidor necesita la extension GD de PHP para generar PDFs con membrete. Activa GD y vuelve a intentar.',
        ], 422);
    }

    private function sanitizeStorageFilename(string $filename): string
    {
        $filename = basename(str_replace('\\', '/', $filename));
        $extension = pathinfo($filename, PATHINFO_EXTENSION);
        $base = pathinfo($filename, PATHINFO_FILENAME);
        $base = Str::slug($base) ?: 'documento-generado';

        return $extension !== '' ? "{$base}.{$extension}" : $base;
    }
}
