<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Report;
use App\Models\Submission;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class SubmissionController extends Controller
{
    /**
     * Alumno sube archivo de un reporte
     */
    public function storeForStudent(Request $request, Report $report)
    {
        $user = $request->user();
        $student = $user->student;

        if (!$student) {
            return response()->json(['message' => 'No tienes perfil de estudiante.'], 403);
        }

        $request->validate([
            'file' => ['required', 'file', 'max:4096'], // 4 MB
        ]);

        // reemplaza envíos anteriores del mismo estudiante para este reporte
        $previous = Submission::where('report_id', $report->id)
            ->where('student_id', $student->id)
            ->get();

        foreach ($previous as $old) {
            if ($old->file_path) {
                Storage::disk('public')->delete($old->file_path);
            }
            $old->delete();
        }

        $file      = $request->file('file');
        $path      = $file->store('submissions', 'public');
        $origName  = $file->getClientOriginalName();

        // Si quieres, puedes permitir múltiples intentos; aquí creamos un registro nuevo cada vez
        $submission = Submission::create([
            'report_id'     => $report->id,
            'student_id'    => $student->id,
            'file_path'     => $path,
            'original_name' => $origName,
            'status'        => 'enviado',
        ]);

        return response()->json($submission, 201);
    }

    /**
     * Coordinador/Admin: ver todas las entregas (filtros opcionales)
     */
    public function indexForStaff(Request $request)
    {
        $query = Submission::with(['report', 'student']);

        if ($request->has('report_id')) {
            $query->where('report_id', $request->input('report_id'));
        }

        if ($request->has('status')) {
            $query->where('status', $request->input('status'));
        }

        $submissions = $query
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($submissions);
    }

    /**
     * Coord/Admin: actualizar estado y feedback
     */
    public function updateStatus(Request $request, Submission $submission)
    {
        $request->validate([
            'status'   => ['required', 'in:enviado,aceptado,rechazado'],
            'feedback' => ['nullable', 'string'],
        ]);

        $submission->update([
            'status'   => $request->input('status'),
            'feedback' => $request->input('feedback'),
        ]);

        return response()->json($submission);
    }

    /**
     * Descargar archivo ya subido (para coord/admin)
     */
    public function download(Submission $submission)
    {
        $path = storage_path('app/public/' . $submission->file_path);

        if (!file_exists($path)) {
            return response()->json(['message' => 'El archivo no existe.'], 404);
        }

        // Detecta MIME para que el navegador no lo trate como texto plano
        $mime = 'application/octet-stream';
        try {
            $mime = Storage::disk('public')->mimeType($submission->file_path) ?: $mime;
        } catch (\Throwable) {
            $mime = $mime;
        }

        return response()->download($path, $submission->original_name, [
            'Content-Type' => $mime,
        ]);
    }
}
