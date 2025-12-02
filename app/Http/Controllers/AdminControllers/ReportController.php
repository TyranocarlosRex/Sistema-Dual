<?php

namespace App\Http\Controllers\AdminControllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreReportRequest;
use App\Http\Requests\UpdateReportRequest;
use App\Models\Report;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ReportController extends Controller
{
    public function index(Request $request)
    {
        $query = Report::with('evidence')->orderBy('created_at', 'desc');

        $evidenceId = $request->input('evidence_id') ?? $request->input('evidences_id');
        if ($evidenceId) {
            $query->where('evidence_id', $evidenceId);
        }

        return response()->json($query->get());
    }

    public function store(StoreReportRequest $request)
    {
        $data = $request->validated();
        $data['created_by'] = $request->user()->id;
        $data['has_attachment'] = false;
        $data['attachment_path'] = null;

        if ($request->hasFile('attachment')) {
            $originalName = $request->file('attachment')->getClientOriginalName();
            $fileName = time() . '_' . $originalName;
            $path = $request->file('attachment')->storeAs('reports', $fileName, 'public');
            $data['has_attachment'] = true;
            $data['attachment_path'] = $path;
        }

        $report = Report::create($data);

        return response()->json($report->load('evidence'), 201);
    }

    public function downloadAttachment(Report $report)
    {
        if (!$report->has_attachment || !$report->attachment_path) {
            return response()->json(['message' => 'Este reporte no tiene archivo adjunto.'], 404);
        }

        $path = storage_path('app/public/' . $report->attachment_path);
        if (!file_exists($path)) {
            return response()->json(['message' => 'El archivo no existe en el servidor.'], 404);
        }

        return response()->download($path, basename($report->attachment_path));
    }

    public function indexForStudent(Request $request)
    {
        $user = $request->user();
        $student = $user->student;

        if (!$student) {
            return response()->json(['message' => 'No tienes perfil de estudiante.'], 403);
        }

        $query = Report::with('evidence');

        $query->whereHas('evidence', function ($q) use ($student) {
            $q->where('tipo', 'inscripcion');
            if ($student->estatus === 'Activo') {
                $q->orWhere('tipo', 'programa');
            }
        });

        $reports = $query->orderBy('fecha_limite', 'asc')->get();

        return response()->json($reports);
    }

    public function update(UpdateReportRequest $request, Report $report)
    {
        $data = $request->validated();

        if ($request->hasFile('attachment')) {
            if ($report->has_attachment && $report->attachment_path && Storage::disk('public')->exists($report->attachment_path)) {
                Storage::disk('public')->delete($report->attachment_path);
            }

            $originalName = $request->file('attachment')->getClientOriginalName();
            $fileName = time() . '_' . $originalName;
            $path = $request->file('attachment')->storeAs('reports', $fileName, 'public');
            $data['has_attachment'] = true;
            $data['attachment_path'] = $path;
        } elseif ($request->boolean('remove_attachment')) {
            if ($report->has_attachment && $report->attachment_path && Storage::disk('public')->exists($report->attachment_path)) {
                Storage::disk('public')->delete($report->attachment_path);
            }
            $data['has_attachment'] = false;
            $data['attachment_path'] = null;
        } else {
            unset($data['attachment'], $data['has_attachment'], $data['attachment_path']);
        }

        $report->update($data);

        return response()->json($report->load('evidence'));
    }

    public function destroy(Report $report)
    {
        if ($report->has_attachment && $report->attachment_path && Storage::disk('public')->exists($report->attachment_path)) {
            Storage::disk('public')->delete($report->attachment_path);
        }

        $report->delete();

        return response()->json(['message' => 'Reporte eliminado']);
    }
}
