<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\ResolvesPeriodContext;
use App\Http\Controllers\Controller;
use App\Http\Resources\StudentResource;
use App\Models\Report;
use App\Models\Submission;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class StudentIndexController extends Controller
{
    use ResolvesPeriodContext;

    public function index(Request $request)
    {
        $user = $request->user();
        $role = mb_strtolower((string)($user->role ?? ''));

        if (!in_array($role, ['admin', 'coordinator'], true)) {
            return response()->json(['message' => 'No autorizado.'], 403);
        }

        $period = $this->resolvePeriodFromRequest($request);
        $q = Student::with('user');

        if ($period) {
            $q->whereHas('periodAssignments', function ($qq) use ($period) {
                $qq->where('periodo_id', $period->id);
            })->with([
                'periodAssignments' => function ($qq) use ($period) {
                    $qq->with('period')->where('periodo_id', $period->id);
                },
            ]);
        }

        if ($role === 'coordinator') {
            $user->loadMissing('coordinator');
            $coordinatorCareer = mb_strtolower(trim((string)($user->coordinator->Carrera ?? '')));

            if ($coordinatorCareer === '') {
                return response()->json(['message' => 'El coordinador no tiene carrera asignada.'], 403);
            }

            if ($period) {
                $q->whereHas('periodAssignments', function ($qq) use ($period, $coordinatorCareer) {
                    $qq->where('periodo_id', $period->id)
                        ->whereRaw('LOWER(Carrera) = ?', [$coordinatorCareer]);
                });
            } else {
                $q->whereRaw('LOWER(Carrera) = ?', [$coordinatorCareer]);
            }
        }

        if ($nombre = trim((string)$request->query('nombre', ''))) {
            $q->where(function ($qq) use ($nombre) {
                $qq->where('Nombre', 'like', "%{$nombre}%")
                    ->orWhere('Apellidos', 'like', "%{$nombre}%");
            });
        }

        if ($correo = trim((string)$request->query('correo', ''))) {
            $q->whereHas('user', function ($u) use ($correo) {
                $u->where('email', 'like', "%{$correo}%");
            });
        }

        if ($carrera = trim((string)$request->query('carrera', ''))) {
            if ($period) {
                $q->whereHas('periodAssignments', function ($qq) use ($period, $carrera) {
                    $qq->where('periodo_id', $period->id)
                        ->where('Carrera', 'like', "%{$carrera}%");
                });
            } else {
                $q->where('Carrera', 'like', "%{$carrera}%");
            }
        }

        if ($noControl = trim((string)$request->query('no_control', ''))) {
            $q->where('No_control', 'like', "%{$noControl}%");
        }

        if ($estatus = trim((string)$request->query('estatus', ''))) {
            if (!$period) {
                return response()->json([
                    'message' => 'Debes seleccionar un periodo o tener un periodo activo para filtrar por estatus.',
                ], 422);
            }

            $q->whereHas('periodAssignments', function ($qq) use ($period, $estatus) {
                $qq->where('periodo_id', $period->id)
                    ->where('Estatus', $estatus);
            });
        }

        $perPage = max(1, (int)$request->query('per_page', 10));
        $students = $q->paginate($perPage);
        $studentIds = $students->getCollection()->pluck('id')->all();

        $submittedByStudent = [];
        if ($period && !empty($studentIds)) {
            $submittedByStudent = Submission::query()
                ->select('student_id', DB::raw('COUNT(DISTINCT report_id) as total'))
                ->whereIn('student_id', $studentIds)
                ->whereNotNull('report_id')
                ->whereHas('report', function ($qq) use ($period) {
                    $qq->where('periodo_id', $period->id);
                })
                ->groupBy('student_id')
                ->pluck('total', 'student_id')
                ->all();
        }

        $inscripcionReports = $this->countReportsByTipo('inscripcion', $period?->id);
        $programaReports = $this->countReportsByTipo('programa', $period?->id);

        $students->getCollection()->transform(function (Student $student) use ($submittedByStudent, $inscripcionReports, $programaReports, $period) {
            $submittedCount = (int)($submittedByStudent[$student->id] ?? 0);
            $estatus = mb_strtolower(trim((string)($student->statusForPeriod($period?->id) ?? '')));
            $assignedCount = $period
                ? $inscripcionReports + ($estatus === 'activo' ? $programaReports : 0)
                : 0;

            $progressPercent = $assignedCount > 0
                ? (int)round(min(100, ($submittedCount / $assignedCount) * 100))
                : 0;

            $student->setAttribute('submitted_reports_count', $submittedCount);
            $student->setAttribute('assigned_reports_count', $assignedCount);
            $student->setAttribute('progress_percent', $progressPercent);

            return $student;
        });

        return StudentResource::collection($students);
    }

    public function updateEstatus(Request $request, Student $student)
    {
        $user = $request->user();
        $role = mb_strtolower((string)($user->role ?? ''));
        $period = $this->resolvePeriodFromRequest($request);

        if (!in_array($role, ['admin', 'coordinator'], true)) {
            return response()->json(['message' => 'No autorizado.'], 403);
        }

        if ($period === null) {
            return response()->json([
                'message' => 'Debes seleccionar un periodo o tener un periodo activo para actualizar estatus.',
            ], 422);
        }

        $assignment = $student->periodAssignments()
            ->where('periodo_id', $period->id)
            ->first();

        if ($assignment === null) {
            return response()->json([
                'message' => 'El estudiante no pertenece al periodo seleccionado.',
            ], 404);
        }

        $studentCareer = mb_strtolower(trim((string)($assignment->Carrera ?? $student->Carrera ?? '')));

        if ($role === 'coordinator') {
            $user->loadMissing('coordinator');
            $coordinatorCareer = mb_strtolower(trim((string)($user->coordinator->Carrera ?? '')));

            if ($coordinatorCareer === '') {
                return response()->json(['message' => 'El coordinador no tiene carrera asignada.'], 403);
            }

            if ($studentCareer !== $coordinatorCareer) {
                return response()->json(['message' => 'No puedes modificar estudiantes de otra carrera.'], 403);
            }
        }

        if ($period->isClosed()) {
            return response()->json([
                'message' => 'El periodo cerrado solo permite consulta y estadisticas.',
            ], 422);
        }

        $validated = $request->validate([
            'estatus' => 'sometimes|required|string|in:' . implode(',', Student::allowedStatuses()),
            'empresa' => 'sometimes|nullable|string|max:255',
            'numero_convenio' => 'sometimes|nullable|string|max:255',
            'motivo_baja' => 'sometimes|nullable|string|max:2000',
            'semestre' => 'sometimes|nullable|integer|min:1|max:20',
            'carrera' => 'sometimes|nullable|string|max:255',
        ]);

        if (empty($validated)) {
            return response()->json([
                'message' => 'Debes enviar al menos un campo para actualizar.',
            ], 422);
        }

        $currentStatus = $assignment->Estatus;
        $currentEmpresa = $assignment->Empresa;
        $currentNumeroConvenio = $assignment->Numero_convenio;
        $currentMotivoBaja = $assignment->Motivo_baja;

        $nextStatus = $validated['estatus'] ?? $currentStatus;
        $nextEmpresa = array_key_exists('empresa', $validated)
            ? $validated['empresa']
            : $currentEmpresa;
        $nextNumeroConvenio = array_key_exists('numero_convenio', $validated)
            ? $validated['numero_convenio']
            : $currentNumeroConvenio;
        $nextMotivoBaja = array_key_exists('motivo_baja', $validated)
            ? $validated['motivo_baja']
            : $currentMotivoBaja;

        if ($nextStatus === Student::STATUS_ACTIVO && (blank($nextEmpresa) || blank($nextNumeroConvenio))) {
            return response()->json([
                'message' => 'Para activar al estudiante debes capturar empresa y numero de convenio.',
            ], 422);
        }

        if ($nextStatus === Student::STATUS_BAJA && blank($nextMotivoBaja)) {
            return response()->json([
                'message' => 'Debes capturar el motivo de baja.',
            ], 422);
        }

        if (array_key_exists('empresa', $validated)) {
            $assignment->Empresa = $validated['empresa'];
        }

        if (array_key_exists('numero_convenio', $validated)) {
            $assignment->Numero_convenio = $validated['numero_convenio'];
        }

        if (array_key_exists('estatus', $validated)) {
            $assignment->Estatus = $validated['estatus'];
        }

        if (array_key_exists('semestre', $validated)) {
            $assignment->Semestre = $validated['semestre'];
        }

        if (array_key_exists('carrera', $validated)) {
            $assignment->Carrera = $validated['carrera'];
        }

        if ($nextStatus === Student::STATUS_BAJA) {
            $assignment->Motivo_baja = $nextMotivoBaja;
            $assignment->Fecha_baja = $assignment->Fecha_baja ?? Carbon::today();
        } else {
            $assignment->Motivo_baja = null;
            $assignment->Fecha_baja = null;
        }

        $assignment->save();

        return new StudentResource($student->load([
            'user',
            'periodAssignments' => function ($q) use ($period) {
                $q->with('period')->where('periodo_id', $period->id);
            },
        ]));
    }

    private function countReportsByTipo(string $tipo, ?int $periodId): int
    {
        if ($periodId === null) {
            return 0;
        }

        return Report::query()
            ->where('periodo_id', $periodId)
            ->whereHas('evidence', function ($q) use ($tipo) {
                $q->whereRaw('LOWER(tipo) = ?', [mb_strtolower($tipo)]);
            })
            ->count();
    }
}
