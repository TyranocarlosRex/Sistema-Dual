<?php

namespace App\Http\Controllers\AdminControllers;

use App\Http\Controllers\Controller;
use App\Support\DocumentImportService;
use Illuminate\Http\Request;
use RuntimeException;

class DocumentImportController extends Controller
{
    public function __construct(private readonly DocumentImportService $importer)
    {
    }

    public function store(Request $request)
    {
        $uploadLimit = ini_get('upload_max_filesize') ?: 'desconocido';
        $postLimit = ini_get('post_max_size') ?: 'desconocido';

        $validated = $request->validate([
            'file' => ['bail', 'required', 'file', 'max:15360', 'mimes:txt,html,htm,docx,pdf'],
        ], [
            'file.required' => 'Selecciona un archivo antes de importarlo.',
            'file.uploaded' => "El archivo no pudo subirse. Revisa que no exceda 15 MB y que PHP tenga upload_max_filesize={$uploadLimit} y post_max_size={$postLimit} o mayores.",
            'file.file' => 'El archivo seleccionado no es valido.',
            'file.max' => 'El archivo no debe pesar mas de 15 MB.',
            'file.mimes' => 'El archivo debe ser TXT, HTML, DOCX o PDF.',
        ]);

        try {
            return response()->json($this->importer->import($validated['file']));
        } catch (RuntimeException $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
            ], 422);
        }
    }
}
