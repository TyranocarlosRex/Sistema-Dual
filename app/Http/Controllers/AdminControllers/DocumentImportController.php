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
        $validated = $request->validate([
            'file' => ['required', 'file', 'max:15360', 'mimes:txt,html,htm,docx,pdf'],
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
