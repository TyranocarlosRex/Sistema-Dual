<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\ResolvesPeriodContext;
use App\Models\Report;
use App\Models\Submission;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;

class SubmissionController extends Controller
{
    use ResolvesPeriodContext;

    public function storeForStudent(Request $request, Report $report)
    {
        $user = $request->user();
        $student = $user->student;

        if (!$student) {
            return response()->json(['message' => 'No tienes perfil de estudiante.'], 403);
        }

        $report->loadMissing(['period', 'evidence']);

        if ($report->period?->isClosed()) {
            return response()->json([
                'message' => 'El periodo de este reporte ya esta cerrado.',
            ], 422);
        }

        if (!$report->periodo_id) {
            return response()->json([
                'message' => 'El reporte no esta asociado a un periodo.',
            ], 422);
        }

        $assignment = $this->resolveStudentAssignmentForPeriod($student, $report->periodo_id);
        if ($assignment instanceof JsonResponse) {
            return $assignment;
        }

        if (!$report->isVisibleToStudentAssignment($assignment)) {
            return response()->json([
                'message' => 'No puedes entregar este reporte con tu estatus actual.',
            ], 403);
        }

        $this->validateSubmissionFile($request);

        $previous = Submission::query()
            ->where('report_id', $report->id)
            ->where('student_id', $student->id)
            ->get();

        foreach ($previous as $old) {
            if ($old->file_path) {
                Storage::disk('public')->delete($old->file_path);
            }
            $old->delete();
        }

        $file = $request->file('file');
        $path = $file->store('submissions', 'public');
        $origName = $file->getClientOriginalName();

        $submission = Submission::create([
            'report_id' => $report->id,
            'evidence_id' => $report->evidence_id,
            'periodo_id' => $report->periodo_id,
            'student_id' => $student->id,
            'file_path' => $path,
            'original_name' => $origName,
            'status' => 'enviado',
        ]);

        return response()->json($submission->load(['report', 'evidence', 'period']), 201);
    }

    public function indexForStaff(Request $request)
    {
        $query = Submission::with(['report.period', 'report.evidence', 'student'])
            ->whereNotNull('report_id');
        $user = $request->user();
        $role = mb_strtolower((string)($user->role ?? ''));
        $period = $this->resolvePeriodFromRequest($request);

        if ($role === 'coordinator') {
            $user->loadMissing('coordinator');
            $coordinatorCareer = mb_strtolower(trim((string)($user->coordinator->Carrera ?? '')));

            if ($coordinatorCareer === '') {
                return response()->json(['message' => 'El coordinador no tiene carrera asignada.'], 403);
            }

            if ($period) {
                $query->whereHas('student.periodAssignments', function ($q) use ($coordinatorCareer, $period) {
                    $q->where('periodo_id', $period->id)
                        ->whereRaw('LOWER(Carrera) = ?', [$coordinatorCareer]);
                });
            } else {
                $query->whereHas('student', function ($q) use ($coordinatorCareer) {
                    $q->whereRaw('LOWER(Carrera) = ?', [$coordinatorCareer]);
                });
            }
        }

        if ($period) {
            $query->whereHas('report', function ($q) use ($period) {
                $q->where('periodo_id', $period->id);
            });
        }

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

    public function updateStatus(Request $request, Submission $submission)
    {
        $submission->loadMissing(['report.period']);
        $period = $submission->report?->period;

        if ($period?->isClosed()) {
            return response()->json([
                'message' => 'El periodo cerrado solo permite consulta y estadisticas.',
            ], 422);
        }

        if ($forbidden = $this->forbidCoordinatorFromOtherCareer($request, $submission)) {
            return $forbidden;
        }

        $request->validate([
            'status' => ['required_without_all:calificacion,feedback', 'in:enviado,aceptado,rechazado'],
            'feedback' => ['nullable', 'string'],
            'calificacion' => ['nullable', 'numeric', 'min:0', 'max:100'],
        ]);

        $submission->update([
            'status' => $request->input('status', $submission->status),
            'feedback' => $request->input('feedback', $submission->feedback),
            'calificacion' => $request->input('calificacion', $submission->calificacion),
        ]);

        return response()->json($submission->fresh()->load(['report.period', 'report.evidence', 'student']));
    }

    public function download(Request $request, Submission $submission)
    {
        if ($forbidden = $this->forbidCoordinatorFromOtherCareer($request, $submission)) {
            return $forbidden;
        }

        return $this->submissionFileResponse($submission, true);
    }

    public function preview(Request $request, Submission $submission)
    {
        if ($forbidden = $this->forbidCoordinatorFromOtherCareer($request, $submission)) {
            return $forbidden;
        }

        return $this->submissionFileResponse($submission, false);
    }

    private function forbidCoordinatorFromOtherCareer(Request $request, Submission $submission)
    {
        $user = $request->user();
        $role = mb_strtolower((string)($user->role ?? ''));

        if ($role !== 'coordinator') {
            return null;
        }

        $user->loadMissing('coordinator');
        $coordinatorCareer = mb_strtolower(trim((string)($user->coordinator->Carrera ?? '')));

        if ($coordinatorCareer === '') {
            return response()->json(['message' => 'El coordinador no tiene carrera asignada.'], 403);
        }

        $submission->loadMissing(['student', 'report.period']);
        $periodoId = $submission->report?->periodo_id;

        if ($periodoId) {
            $studentAssignment = $submission->student?->periodAssignments()
                ->where('periodo_id', $periodoId)
                ->first();

            $studentCareer = mb_strtolower(trim((string)($studentAssignment->Carrera ?? $submission->student->Carrera ?? '')));
        } else {
            $studentCareer = mb_strtolower(trim((string)($submission->student->Carrera ?? '')));
        }

        if ($studentCareer !== $coordinatorCareer) {
            return response()->json(['message' => 'No puedes acceder a entregas de otra carrera.'], 403);
        }

        return null;
    }

    private function validateSubmissionFile(Request $request): void
    {
        $request->validate([
            'file' => ['required', 'file', 'max:4096'],
        ]);
    }

    private function resolveStudentAssignmentForPeriod($student, ?int $periodId)
    {
        if (!$periodId) {
            return response()->json([
                'message' => 'No hay un periodo valido para registrar la entrega.',
            ], 422);
        }

        $assignment = $student->enrollmentForPeriod($periodId);

        if ($assignment === null) {
            return response()->json([
                'message' => 'No perteneces al periodo de esta entrega.',
            ], 403);
        }

        if (mb_strtolower(trim((string)$assignment->Estatus)) === 'baja') {
            return response()->json([
                'message' => 'Tu estatus en este periodo es Baja. No puedes entregar documentos.',
            ], 403);
        }

        return $assignment;
    }

    private function resolveSubmissionDownloadName(Submission $submission): string
    {
        $original = trim((string)($submission->original_name ?? ''));
        if ($original !== '') {
            return $this->sanitizeDownloadName($original, 'entrega-' . $submission->id);
        }

        $storedName = basename(str_replace('\\', '/', (string)$submission->file_path));
        if ($storedName !== '') {
            return $this->sanitizeDownloadName($storedName, 'entrega-' . $submission->id);
        }

        return 'entrega-' . $submission->id;
    }

    private function submissionFileResponse(Submission $submission, bool $download)
    {
        $disk = Storage::disk('public');
        $filePath = trim((string)$submission->file_path);

        if ($filePath === '' || !$disk->exists($filePath)) {
            return response()->json(['message' => 'El archivo no existe.'], 404);
        }

        $path = $disk->path($filePath);
        $downloadName = $this->resolveSubmissionDownloadName($submission);
        $mime = 'application/octet-stream';

        try {
            $mime = $disk->mimeType($filePath) ?: $mime;
        } catch (\Throwable) {
            $mime = 'application/octet-stream';
        }

        $headers = [
            'Content-Type' => $mime,
            'X-Download-Filename' => rawurlencode($downloadName),
        ];

        if ($download) {
            return response()->download($path, $downloadName, $headers);
        }

        $response = response()->file($path, $headers);
        $response->setContentDisposition(
            'inline',
            $downloadName,
            $this->asciiFilenameFallback($downloadName, 'entrega-' . $submission->id)
        );

        return $response;
    }

    private function sanitizeDownloadName(string $name, string $fallback): string
    {
        $name = basename(str_replace('\\', '/', $name));
        $clean = trim((string)preg_replace('/[\x00-\x1F\x7F]/u', '', $name));

        return $clean !== '' ? $clean : $fallback;
    }

    private function asciiFilenameFallback(string $name, string $fallback): string
    {
        $ascii = (string)preg_replace('/[^\x20-\x7E]/', '_', $name);
        $ascii = str_replace(['%', '/', '\\'], '_', $ascii);
        $ascii = trim($ascii, " \t\n\r\0\x0B\"'");

        return $ascii !== '' ? $ascii : $fallback;
    }
}
