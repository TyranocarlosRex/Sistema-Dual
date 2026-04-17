<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\ResolvesPeriodContext;
use App\Models\Evidence;
use App\Models\Report;
use App\Models\Student;
use App\Models\Submission;
use Illuminate\Http\Request;

class StudentDetailsController extends Controller
{
    use ResolvesPeriodContext;

    public function me(Request $request)
    {
        $user = $request->user()->loadMissing('student.user');
        $student = $user->student;

        if ($student === null) {
            return response()->json(['message' => 'No tienes perfil de estudiante.'], 403);
        }

        $period = $this->resolvePeriodFromRequest($request);
        $assignment = $period
            ? $student->periodAssignments()->with('period')->where('periodo_id', $period->id)->first()
            : null;

        return response()->json([
            'period' => $this->serializePeriod($period),
            'student' => $this->serializeStudent($student, $assignment),
        ]);
    }

    public function updateOwnProfile(Request $request)
    {
        $user = $request->user()->loadMissing('student.user');
        $student = $user->student;

        if ($student === null) {
            return response()->json(['message' => 'No tienes perfil de estudiante.'], 403);
        }

        $validated = $request->validate([
            'telefono' => 'sometimes|nullable|string|max:20',
            'direccion' => 'sometimes|nullable|string|max:255',
        ]);

        if ($validated === []) {
            return response()->json([
                'message' => 'Debes enviar telefono o direccion para actualizar tu perfil.',
            ], 422);
        }

        if (array_key_exists('telefono', $validated)) {
            $student->Telefono = $this->normalizeOptionalText($validated['telefono']);
        }

        if (array_key_exists('direccion', $validated)) {
            $student->Direccion = $this->normalizeOptionalText($validated['direccion']);
        }

        $student->save();

        $period = $this->resolvePeriodFromRequest($request);
        $assignment = $period
            ? $student->periodAssignments()->with('period')->where('periodo_id', $period->id)->first()
            : null;

        return response()->json([
            'message' => 'Perfil actualizado correctamente.',
            'period' => $this->serializePeriod($period),
            'student' => $this->serializeStudent($student->loadMissing('user'), $assignment),
        ]);
    }

    public function show(Request $request, Student $student)
    {
        $user = $request->user();
        $role = mb_strtolower((string)($user->role ?? ''));
        $period = $this->resolvePeriodFromRequest($request);
        $assignment = $period
            ? $student->periodAssignments()->with('period')->where('periodo_id', $period->id)->first()
            : null;

        $studentCareer = mb_strtolower(trim((string)($assignment->Carrera ?? $student->Carrera ?? '')));

        if ($role === 'coordinator') {
            $user->loadMissing('coordinator');
            $coordinatorCareer = mb_strtolower(trim((string)($user->coordinator->Carrera ?? '')));

            if ($coordinatorCareer === '') {
                return response()->json(['message' => 'El coordinador no tiene carrera asignada.'], 403);
            }

            if ($studentCareer !== $coordinatorCareer) {
                return response()->json(['message' => 'No puedes ver estudiantes de otra carrera.'], 403);
            }
        }

        $student->load('user');

        $submissions = Submission::with(['report.evidence', 'report.period'])
            ->where('student_id', $student->id)
            ->when($period, function ($q) use ($period) {
                $q->whereHas('report', function ($qq) use ($period) {
                    $qq->where('periodo_id', $period->id);
                });
            })
            ->get();

        $effectiveStatus = $assignment?->Estatus;
        $visibleEvidenceTypes = ['inscripcion'];

        if (mb_strtolower(trim((string) $effectiveStatus)) === 'activo') {
            $visibleEvidenceTypes[] = 'programa';
        }

        $allReports = Report::with(['evidence', 'period'])
            ->when($period, function ($q) use ($period) {
                $q->where('periodo_id', $period->id);
            })
            ->whereHas('evidence', function ($q) use ($effectiveStatus) {
                $q->where('tipo', 'inscripcion');

                if (mb_strtolower(trim((string)$effectiveStatus)) === 'activo') {
                    $q->orWhere('tipo', 'programa');
                }
            })
            ->get();

        $evidenceSpaces = Evidence::query()
            ->whereIn('tipo', $visibleEvidenceTypes)
            ->withCount([
                'reports as period_reports_count' => function ($q) use ($period) {
                    if ($period) {
                        $q->where('periodo_id', $period->id);
                    } else {
                        $q->whereRaw('1 = 0');
                    }
                },
            ])
            ->orderByRaw("FIELD(tipo, 'inscripcion','programa')")
            ->orderBy('titulo')
            ->get()
            ->map(function ($evidence) {
                return [
                    'id' => $evidence->id,
                    'titulo' => $evidence->titulo,
                    'descripcion' => $evidence->descripcion,
                    'tipo' => $evidence->tipo,
                    'period_reports_count' => (int) ($evidence->period_reports_count ?? 0),
                ];
            })
            ->values();

        $submittedReportIds = $submissions->pluck('report_id')->unique();
        $pendingReports = $allReports->whereNotIn('id', $submittedReportIds);
        $candidateInfo = $assignment
            ? [
                'id' => $assignment->id,
                'origen' => $assignment->Origen_login,
                'first_login_at' => $assignment->Primer_login_at,
                'last_login_at' => $assignment->Ultimo_login_at,
            ]
            : null;

        return response()->json([
            'period' => $this->serializePeriod($period),
            'student' => $this->serializeStudent($student, $assignment, [
                'Estatus' => $effectiveStatus,
                'candidate' => $candidateInfo,
            ]),
            'documents' => [
                'spaces' => $evidenceSpaces,
                'sent' => $submissions->map(function ($sub) {
                    return [
                        'id' => $sub->id,
                        'status' => $sub->status,
                        'feedback' => $sub->feedback,
                        'calificacion' => $sub->calificacion,
                        'file_path' => $sub->file_path,
                        'original_name' => $sub->original_name,
                        'submitted_at' => $sub->created_at,
                        'report' => $sub->report ? [
                            'id' => $sub->report->id,
                            'titulo' => $sub->report->titulo,
                            'descripcion' => $sub->report->descripcion,
                            'fecha_limite' => $sub->report->fecha_limite,
                            'has_attachment' => $sub->report->has_attachment,
                            'attachment_path' => $sub->report->attachment_path,
                            'period' => $sub->report->period ? [
                                'id' => $sub->report->period->id,
                                'codigo' => $sub->report->period->codigo,
                            ] : null,
                            'evidence' => $sub->report->evidence ? [
                                'id' => $sub->report->evidence->id,
                                'titulo' => $sub->report->evidence->titulo,
                                'tipo' => $sub->report->evidence->tipo,
                            ] : null,
                        ] : null,
                    ];
                })->values(),
                'missing' => $pendingReports->map(function ($rep) {
                    return [
                        'id' => $rep->id,
                        'titulo' => $rep->titulo,
                        'descripcion' => $rep->descripcion,
                        'fecha_limite' => $rep->fecha_limite,
                        'period' => $rep->period ? [
                            'id' => $rep->period->id,
                            'codigo' => $rep->period->codigo,
                        ] : null,
                        'evidence' => $rep->evidence ? [
                            'id' => $rep->evidence->id,
                            'titulo' => $rep->evidence->titulo,
                            'tipo' => $rep->evidence->tipo,
                        ] : null,
                    ];
                })->values(),
            ],
        ]);
    }

    private function serializePeriod($period): ?array
    {
        if ($period === null) {
            return null;
        }

        return [
            'id' => $period->id,
            'codigo' => $period->codigo,
            'estatus' => $period->estatus,
        ];
    }

    private function serializeStudent(Student $student, $assignment = null, array $overrides = []): array
    {
        $payload = [
            'id' => $student->id,
            'Nombre' => $student->Nombre,
            'Apellidos' => $student->Apellidos,
            'No_control' => $student->No_control,
            'Carrera' => $assignment->Carrera ?? $student->Carrera,
            'Semestre' => $assignment->Semestre ?? $student->Semestre,
            'Estatus' => $assignment?->Estatus,
            'Empresa' => $assignment?->Empresa,
            'Numero_convenio' => $assignment?->Numero_convenio,
            'Motivo_baja' => $assignment?->Motivo_baja,
            'Fecha_baja' => optional($assignment?->Fecha_baja)->toDateString(),
            'Correo_institucional' => $student->Correo_institucional ?: $student->user?->email,
            'Direccion' => $student->Direccion,
            'Telefono' => $student->Telefono,
            'user' => $student->user ? [
                'id' => $student->user->id,
                'name' => $student->user->name,
                'email' => $student->user->email,
                'role' => $student->user->role,
            ] : null,
        ];

        return array_merge($payload, $overrides);
    }

    private function normalizeOptionalText($value): ?string
    {
        $value = trim((string) $value);

        return $value !== '' ? $value : null;
    }
}
