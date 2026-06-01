<?php

namespace App\Http\Controllers\AdminControllers;

use App\Http\Controllers\Concerns\ResolvesPeriodContext;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreReportRequest;
use App\Http\Requests\UpdateReportRequest;
use App\Models\Period;
use App\Models\Report;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ReportController extends Controller
{
    use ResolvesPeriodContext;

    public function index(Request $request)
    {
        $period = $this->resolvePeriodFromRequest($request);
        $query = Report::with(['evidence', 'period'])->orderBy('created_at', 'desc');

        $evidenceId = $request->input('evidence_id') ?? $request->input('evidences_id');
        if ($evidenceId) {
            $query->where('evidence_id', $evidenceId);
        }

        if ($period) {
            $query->where('periodo_id', $period->id);
        }

        return response()->json($query->get());
    }

    public function store(StoreReportRequest $request)
    {
        $data = $request->validated();
        $data['created_by'] = $request->user()->id;
        $data['has_attachment'] = false;
        $data['attachment_path'] = null;

        $periodoId = $data['periodo_id'] ?? $data['period_id'] ?? null;
        $period = $periodoId
            ? Period::query()->findOrFail($periodoId)
            : Period::current();

        unset($data['period_id']);
        $data['periodo_id'] = $period?->id;

        if ($period === null) {
            return response()->json([
                'message' => 'Debes tener un periodo activo o enviar periodo_id para crear reportes.',
            ], 422);
        }

        if ($period->isClosed()) {
            return response()->json([
                'message' => 'No puedes crear reportes en un periodo cerrado.',
            ], 422);
        }

        if ($request->hasFile('attachment')) {
            $originalName = $request->file('attachment')->getClientOriginalName();
            $fileName = time() . '_' . $originalName;
            $path = $request->file('attachment')->storeAs('reports', $fileName, 'public');
            $data['has_attachment'] = true;
            $data['attachment_path'] = $path;
        }

        $report = Report::create($data);

        return response()->json($report->load(['evidence', 'period']), 201);
    }

    public function downloadAttachment(Request $request, Report $report)
    {
        if ($forbidden = $this->forbidStudentFromUnavailableReport($request, $report)) {
            return $forbidden;
        }

        if (!$report->has_attachment || !$report->attachment_path) {
            return response()->json(['message' => 'Este reporte no tiene archivo adjunto.'], 404);
        }

        $path = storage_path('app/public/' . $report->attachment_path);
        if (!file_exists($path)) {
            return response()->json(['message' => 'El archivo no existe en el servidor.'], 404);
        }

        $downloadName = $this->resolveAttachmentDownloadName($report);

        return response()->download($path, $downloadName, [
            'X-Download-Filename' => rawurlencode($downloadName),
        ]);
    }

    public function indexForStudent(Request $request)
    {
        $user = $request->user();
        $student = $user->student;

        if (!$student) {
            return response()->json(['message' => 'No tienes perfil de estudiante.'], 403);
        }

        $period = $this->resolvePeriodFromRequest($request);
        if ($period === null) {
            return response()->json(['message' => 'No hay un periodo activo disponible.'], 422);
        }

        $assignment = $student->enrollmentForPeriod($period->id);

        if ($assignment === null) {
            return response()->json([
                'message' => 'No perteneces al periodo activo.',
            ], 403);
        }

        $query = Report::with([
            'evidence',
            'period',
            'submissions' => function ($q) use ($student) {
                $q->where('student_id', $student->id)
                    ->latest();
            },
        ])
            ->where('periodo_id', $period->id)
            ->whereHas('evidence', function ($q) use ($assignment) {
                $q->where('tipo', 'inscripcion');
                if (mb_strtolower(trim((string)$assignment->Estatus)) === 'activo') {
                    $q->orWhere('tipo', 'programa');
                }
            });

        $reports = $query->orderBy('fecha_limite', 'asc')->get();

        return response()->json($reports);
    }

    public function update(UpdateReportRequest $request, Report $report)
    {
        if ($report->period?->isClosed()) {
            return response()->json([
                'message' => 'No puedes editar reportes de un periodo cerrado.',
            ], 422);
        }

        $data = $request->validated();
        $targetPeriodId = $data['periodo_id'] ?? $data['period_id'] ?? $report->periodo_id;

        if (array_key_exists('period_id', $data) && !array_key_exists('periodo_id', $data)) {
            $data['periodo_id'] = $data['period_id'];
        }

        unset($data['period_id']);

        if ($targetPeriodId) {
            $targetPeriod = Period::query()->findOrFail($targetPeriodId);

            if ($targetPeriod->isClosed()) {
                return response()->json([
                    'message' => 'No puedes editar reportes en un periodo cerrado.',
                ], 422);
            }
        }

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

        return response()->json($report->load(['evidence', 'period']));
    }

    public function destroy(Report $report)
    {
        if ($report->period?->isClosed()) {
            return response()->json([
                'message' => 'No puedes eliminar reportes de un periodo cerrado.',
            ], 422);
        }

        if ($report->has_attachment && $report->attachment_path && Storage::disk('public')->exists($report->attachment_path)) {
            Storage::disk('public')->delete($report->attachment_path);
        }

        $report->delete();

        return response()->json(['message' => 'Reporte eliminado']);
    }

    private function forbidStudentFromUnavailableReport(Request $request, Report $report)
    {
        $user = $request->user();
        $role = mb_strtolower((string)($user?->role ?? ''));

        if ($role !== 'student') {
            return null;
        }

        $student = $user?->student;
        if ($student === null) {
            return response()->json(['message' => 'No tienes perfil de estudiante.'], 403);
        }

        if (!$report->periodo_id) {
            return response()->json(['message' => 'El reporte no esta asociado a un periodo.'], 422);
        }

        $assignment = $student->enrollmentForPeriod((int)$report->periodo_id);
        if ($assignment === null) {
            return response()->json(['message' => 'No perteneces al periodo de este reporte.'], 403);
        }

        if (!$report->isVisibleToStudentAssignment($assignment)) {
            return response()->json([
                'message' => 'No puedes acceder a este reporte con tu estatus actual.',
            ], 403);
        }

        return null;
    }

    private function resolveAttachmentDownloadName(Report $report): string
    {
        $storedName = basename(str_replace('\\', '/', (string)$report->attachment_path));
        if ($storedName === '') {
            return 'reporte-adjunto';
        }

        $withoutTimestamp = preg_replace('/^\d{10,}_/', '', $storedName) ?: $storedName;
        $isHashLike = preg_match('/^[a-f0-9]{20,}(?:\.[a-z0-9]+)?$/i', $withoutTimestamp) === 1;

        if ($isHashLike) {
            $ext = pathinfo($storedName, PATHINFO_EXTENSION);
            $base = Str::slug((string)($report->titulo ?: 'reporte-adjunto'));
            $base = $base !== '' ? $base : 'reporte-adjunto';

            return $ext !== '' ? "{$base}.{$ext}" : $base;
        }

        return $this->sanitizeDownloadName($withoutTimestamp, 'reporte-adjunto');
    }

    private function sanitizeDownloadName(string $name, string $fallback): string
    {
        $name = basename(str_replace('\\', '/', $name));
        $clean = trim((string)preg_replace('/[\x00-\x1F\x7F]/u', '', $name));

        return $clean !== '' ? $clean : $fallback;
    }
}
