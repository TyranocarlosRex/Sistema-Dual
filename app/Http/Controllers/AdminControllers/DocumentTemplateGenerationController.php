<?php

namespace App\Http\Controllers\AdminControllers;

use App\Http\Requests\DownloadGeneratedDocumentPdfRequest;
use App\Http\Controllers\Concerns\ResolvesPeriodContext;
use App\Http\Controllers\Controller;
use App\Http\Requests\GenerateDocumentTemplateRequest;
use App\Models\DocumentTemplate;
use App\Support\DocumentTemplateGenerationService;
use Barryvdh\DomPDF\Facade\Pdf;
use Barryvdh\DomPDF\PDF as DomPdfWrapper;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
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

            return $this->fitPdfToPage($document, $generatedDocument, $period)
                ->download((string) ($generatedDocument['pdf_filename'] ?? 'documento.pdf'));
        } catch (Throwable $exception) {
            report($exception);

            $message = str_contains(strtolower($exception->getMessage()), 'gd extension is required')
                ? 'No se pudo generar el PDF porque PHP no tiene habilitada la extension GD, necesaria para procesar las imagenes del membrete. Puedes usar "Imprimir / Guardar PDF" mientras se habilita.'
                : 'No se pudo generar el PDF del documento solicitado.';

            return response()->json([
                'message' => $message,
            ], 422);
        }
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
}
