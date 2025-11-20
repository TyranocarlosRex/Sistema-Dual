<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreReportRequest;
use App\Models\Report;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ReportController extends Controller
{
    // Lista de reportes (para el panel del admin o para estudiantes)
    public function index(Request $request)
    {
        $reports = Report::orderBy('created_at', 'desc')->get();
        return response()->json($reports);
    }

    // Crear reporte (área para subir evidencia)
    public function store(StoreReportRequest $request)
    {
        $data = $request->validated();

        $data['created_by'] = $request->user()->id;
        $data['has_attachment'] = false;
        $data['attachment_path'] = null;

        if ($request->hasFile('attachment')) {
            // Guarda el archivo en storage/app/public/reports
            $path = $request->file('attachment')->store('reports', 'public');
            $data['has_attachment'] = true;
            $data['attachment_path'] = $path;
        }

        $report = Report::create($data);

        return response()->json($report, 201);
    }

    // Descargar el archivo base (si existe)
    public function downloadAttachment(Report $report)
{
    if (!$report->has_attachment || !$report->attachment_path) {
        return response()->json([
            'message' => 'Este reporte no tiene archivo adjunto.'
        ], 404);
    }

    // Ruta absoluta al archivo dentro de storage/app/public
    $path = storage_path('app/public/' . $report->attachment_path);

    if (!file_exists($path)) {
        return response()->json([
            'message' => 'El archivo no existe en el servidor.'
        ], 404);
    }

    return response()->download($path);
}
}