<?php

namespace App\Http\Controllers\AdminControllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreDocumentTemplateRequest;
use App\Http\Requests\UpdateDocumentTemplateRequest;
use App\Models\DocumentTemplate;
use App\Support\DocumentTemplateContentService;
use Illuminate\Http\JsonResponse;

class DocumentTemplateController extends Controller
{
    public function __construct(private readonly DocumentTemplateContentService $content)
    {
    }

    public function index(): JsonResponse
    {
        $documents = DocumentTemplate::query()
            ->orderByDesc('updated_at')
            ->orderByDesc('id')
            ->get();

        return response()->json($documents->map(fn (DocumentTemplate $document) => $this->transform($document))->all());
    }

    public function store(StoreDocumentTemplateRequest $request): JsonResponse
    {
        $document = DocumentTemplate::query()->create(
            $this->content->preparePayload($request->validated()) + [
                'created_by' => $request->user()->id,
                'updated_by' => $request->user()->id,
            ]
        );

        return response()->json($this->transform($document), 201);
    }

    public function show(DocumentTemplate $document): JsonResponse
    {
        return response()->json($this->transform($document));
    }

    public function update(UpdateDocumentTemplateRequest $request, DocumentTemplate $document): JsonResponse
    {
        $document->update(
            $this->content->preparePayload($request->validated()) + [
                'updated_by' => $request->user()->id,
            ]
        );

        return response()->json($this->transform($document->fresh()));
    }

    public function destroy(DocumentTemplate $document): JsonResponse
    {
        $document->delete();

        return response()->json([
            'message' => 'Documento eliminado correctamente.',
        ]);
    }

    private function transform(DocumentTemplate $document): array
    {
        $plainText = (string) ($document->plain_text ?? '');

        return [
            'id' => (int) $document->id,
            'titulo' => (string) $document->titulo,
            'descripcion' => $document->descripcion,
            'header_html' => (string) ($document->header_html ?? ''),
            'body_html' => (string) ($document->body_html ?? ''),
            'footer_html' => (string) ($document->footer_html ?? ''),
            'plain_text' => $plainText,
            'text' => $plainText,
            'filename' => $document->source_filename,
            'extension' => $document->source_extension,
            'source_filename' => $document->source_filename,
            'source_extension' => $document->source_extension,
            'characters' => mb_strlen($plainText),
            'lines' => $this->content->countLines($plainText),
            'placeholders' => array_values($document->placeholders ?? []),
            'created_by' => (int) $document->created_by,
            'updated_by' => $document->updated_by ? (int) $document->updated_by : null,
            'created_at' => $document->created_at?->toJSON(),
            'updated_at' => $document->updated_at?->toJSON(),
        ];
    }
}
