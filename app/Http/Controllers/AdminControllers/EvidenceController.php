<?php

namespace App\Http\Controllers\AdminControllers;

use App\Http\Controllers\Concerns\ResolvesPeriodContext;
use App\Http\Controllers\Controller;
use App\Models\Evidence;
use App\Models\Period;
use App\Models\Student;
use App\Models\StudentPeriod;
use App\Models\Submission;
use Illuminate\Http\Request;

class EvidenceController extends Controller
{
    use ResolvesPeriodContext;

    public function index(Request $request)
    {
        $period = $this->resolvePeriodFromRequest($request);
        $query = Evidence::query()
            ->orderBy('tipo')
            ->orderBy('titulo');

        if ($request->boolean('with_reports')) {
            $query->with([
                'reports' => function ($q) use ($period) {
                    if ($period) {
                        $q->where('periodo_id', $period->id);
                    }
                },
            ]);
        }

        if ($period && $request->boolean('only_with_reports')) {
            $query->whereHas('reports', function ($q) use ($period) {
                $q->where('periodo_id', $period->id);
            });
        }

        $evidences = $query->get();
        $this->attachVisibleStudentCounts($evidences, $period?->id, $request);

        return response()->json($evidences);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'titulo' => ['required', 'string', 'max:255'],
            'descripcion' => ['nullable', 'string'],
            'fecha_limite' => ['nullable', 'date'],
            'tipo' => ['required', 'in:inscripcion,programa'],
            'is_active' => ['sometimes', 'boolean'],
            'preserve_submissions_between_periods' => ['sometimes', 'boolean'],
        ]);

        $data['created_by'] = $request->user()->id;
        $data['is_active'] = $request->boolean('is_active', false);
        $data['preserve_submissions_between_periods'] = $request->boolean('preserve_submissions_between_periods', false);

        $evidence = Evidence::create($data);

        return response()->json($evidence, 201);
    }

    public function show(Evidence $evidence)
    {
        $evidence->load('reports');
        return response()->json($evidence);
    }

    public function update(Request $request, Evidence $evidence)
    {
        $data = $request->validate([
            'titulo' => ['required', 'string', 'max:255'],
            'descripcion' => ['nullable', 'string'],
            'fecha_limite' => ['nullable', 'date'],
            'tipo' => ['required', 'in:inscripcion,programa'],
            'is_active' => ['sometimes', 'boolean'],
            'preserve_submissions_between_periods' => ['sometimes', 'boolean'],
        ]);

        $data['is_active'] = $request->boolean('is_active', (bool)$evidence->is_active);
        $data['preserve_submissions_between_periods'] = $request->boolean(
            'preserve_submissions_between_periods',
            (bool)$evidence->preserve_submissions_between_periods
        );

        $evidence->update($data);

        return response()->json($evidence);
    }

    public function destroy(Evidence $evidence)
    {
        $hasClosedPeriodReports = $evidence->reports()
            ->whereHas('period', function ($q) {
                $q->where('estatus', Period::ESTATUS_CERRADO);
            })
            ->exists();

        if ($hasClosedPeriodReports) {
            return response()->json([
                'message' => 'No puedes eliminar evidencias con reportes en periodos cerrados.',
            ], 422);
        }

        $evidence->delete();

        return response()->json(['message' => 'Espacio eliminado']);
    }

    public function indexForStudent(Request $request)
    {
        $user = $request->user();
        $student = $user->student;

        if (!$student) {
            return response()->json([
                'message' => 'No tienes perfil de estudiante.',
            ], 403);
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

        $tiposVisibles = ['inscripcion'];
        if (mb_strtolower(trim((string)$assignment->Estatus)) === 'activo') {
            $tiposVisibles[] = 'programa';
        }

        $evidences = Evidence::query()
            ->with([
                'reports' => function ($q) use ($student, $period) {
                    $q->where('periodo_id', $period->id)
                        ->with([
                            'submissions' => function ($qq) use ($student) {
                                $qq->where('student_id', $student->id);
                            },
                        ])
                        ->orderBy('created_at', 'asc');
                },
            ])
            ->whereIn('tipo', $tiposVisibles)
            ->where('is_active', true)
            ->whereHas('reports', function ($qq) use ($period) {
                $qq->where('periodo_id', $period->id);
            })
            ->orderByRaw("CASE tipo WHEN 'inscripcion' THEN 0 WHEN 'programa' THEN 1 ELSE 2 END")
            ->orderByRaw('fecha_limite IS NULL')
            ->orderBy('fecha_limite')
            ->orderBy('titulo')
            ->get();

        $this->appendPreservedSubmissions($evidences, $student->id, $period);

        $existingEvidenceIds = $evidences->pluck('id')->filter()->values();
        $historicalEvidences = $this->getReadonlyPreservedEvidences(
            $student->id,
            $period,
            $tiposVisibles,
            $existingEvidenceIds
        );

        if ($historicalEvidences->isNotEmpty()) {
            $evidences = $evidences
                ->concat($historicalEvidences)
                ->sortBy([
                    fn (Evidence $a, Evidence $b) => (
                        ['inscripcion' => 0, 'programa' => 1][$a->tipo] ?? 2
                    ) <=> (
                        ['inscripcion' => 0, 'programa' => 1][$b->tipo] ?? 2
                    ),
                    fn (Evidence $a, Evidence $b) => strcmp((string)$a->titulo, (string)$b->titulo),
                ])
                ->values();
        }

        return response()->json($evidences);
    }

    private function appendPreservedSubmissions($evidences, int $studentId, Period $period): void
    {
        $evidences->each(function (Evidence $evidence) use ($studentId, $period) {
            if (!$evidence->preserve_submissions_between_periods || !$evidence->relationLoaded('reports')) {
                return;
            }

            $reports = $evidence->reports;
            if ($reports->isEmpty()) {
                return;
            }

            $titles = $reports
                ->pluck('titulo')
                ->map(fn ($title) => trim((string)$title))
                ->filter()
                ->unique()
                ->values();

            if ($titles->isEmpty()) {
                return;
            }

            $previousSubmissions = Submission::query()
                ->with(['report.period', 'period'])
                ->where('student_id', $studentId)
                ->where('evidence_id', $evidence->id)
                ->where(function ($query) use ($period) {
                    $query->whereHas('period', function ($periodQuery) use ($period) {
                        $this->constrainToPreviousPeriods($periodQuery, $period);
                    })->orWhere(function ($fallbackQuery) use ($period) {
                        $fallbackQuery
                            ->whereNull('periodo_id')
                            ->whereHas('report.period', function ($periodQuery) use ($period) {
                                $this->constrainToPreviousPeriods($periodQuery, $period);
                            });
                    });
                })
                ->whereHas('report', function ($query) use ($titles) {
                    $query->whereIn('titulo', $titles->all());
                })
                ->latest()
                ->get()
                ->groupBy(fn (Submission $submission) => trim((string)$submission->report?->titulo));

            $reports->each(function ($report) use ($previousSubmissions) {
                $currentSubmissions = $report->relationLoaded('submissions')
                    ? $report->submissions
                    : collect();
                $historicalSubmissions = $previousSubmissions->get(trim((string)$report->titulo), collect())
                    ->map(function (Submission $submission) {
                        $submission->setAttribute('is_historical', true);
                        return $submission;
                    });

                if ($historicalSubmissions->isEmpty()) {
                    return;
                }

                $report->setRelation(
                    'submissions',
                    $currentSubmissions
                        ->concat($historicalSubmissions)
                        ->sortByDesc(fn (Submission $submission) => $submission->created_at)
                        ->values()
                );
            });
        });
    }

    private function getReadonlyPreservedEvidences(int $studentId, Period $period, array $visibleTypes, $excludedEvidenceIds)
    {
        $submissions = Submission::query()
            ->with(['report.evidence', 'report.period', 'period'])
            ->where('student_id', $studentId)
            ->whereNotNull('report_id')
            ->where(function ($query) use ($period) {
                $query->whereHas('period', function ($periodQuery) use ($period) {
                    $this->constrainToPreviousPeriods($periodQuery, $period);
                })->orWhere(function ($fallbackQuery) use ($period) {
                    $fallbackQuery
                        ->whereNull('periodo_id')
                        ->whereHas('report.period', function ($periodQuery) use ($period) {
                            $this->constrainToPreviousPeriods($periodQuery, $period);
                        });
                });
            })
            ->whereHas('report.evidence', function ($query) use ($visibleTypes, $excludedEvidenceIds) {
                $query
                    ->where('is_active', true)
                    ->where('preserve_submissions_between_periods', true)
                    ->whereIn('tipo', $visibleTypes);

                if ($excludedEvidenceIds->isNotEmpty()) {
                    $query->whereNotIn('id', $excludedEvidenceIds->all());
                }
            })
            ->latest()
            ->get();

        if ($submissions->isEmpty()) {
            return collect();
        }

        return $submissions
            ->filter(fn (Submission $submission) => $submission->report?->evidence !== null)
            ->groupBy(fn (Submission $submission) => $submission->report->evidence_id)
            ->map(function ($evidenceSubmissions) {
                /** @var Evidence $evidence */
                $evidence = $evidenceSubmissions->first()->report->evidence;
                $evidence->setAttribute('is_readonly_historical', true);

                $reports = $evidenceSubmissions
                    ->groupBy('report_id')
                    ->map(function ($reportSubmissions) {
                        $report = $reportSubmissions->first()->report;
                        $report->setAttribute('is_readonly_historical', true);

                        $report->setRelation(
                            'submissions',
                            $reportSubmissions
                                ->map(function (Submission $submission) {
                                    $submission->setAttribute('is_historical', true);
                                    return $submission;
                                })
                                ->sortByDesc(fn (Submission $submission) => $submission->created_at)
                                ->values()
                        );

                        return $report;
                    })
                    ->sortByDesc(fn ($report) => optional($report->submissions->first())->created_at)
                    ->values();

                $evidence->setRelation('reports', $reports);

                return $evidence;
            })
            ->values();
    }

    private function constrainToPreviousPeriods($query, Period $period)
    {
        return $query
            ->where(Period::COLUMN_YEAR, '<', $period->anio)
            ->orWhere(function ($q) use ($period) {
                $q->where(Period::COLUMN_YEAR, $period->anio)
                    ->where('numero', '<', $period->numero);
            });
    }

    private function attachVisibleStudentCounts($evidences, ?int $periodId, Request $request): void
    {
        if ($periodId === null || $evidences->isEmpty()) {
            return;
        }

        $user = $request->user();
        $role = mb_strtolower((string)($user->role ?? ''));
        $countsByType = [];

        $evidences->each(function (Evidence $evidence) use (&$countsByType, $periodId, $role, $user) {
            $type = mb_strtolower(trim((string)$evidence->tipo));
            if ($type === '') {
                return;
            }

            if (!array_key_exists($type, $countsByType)) {
                $countsByType[$type] = $this->countVisibleStudentsForEvidenceType($type, $periodId, $role, $user);
            }

            $evidence->setAttribute('assigned_students_count', $countsByType[$type]);
            $evidence->setAttribute('visible_students_count', $countsByType[$type]);
        });
    }

    private function countVisibleStudentsForEvidenceType(string $type, int $periodId, string $role, $user): int
    {
        if (!in_array($type, ['inscripcion', 'programa'], true)) {
            return 0;
        }

        $query = StudentPeriod::query()
            ->join('students', 'students.id', '=', 'students_period.student_id')
            ->where('students_period.periodo_id', $periodId)
            ->where(function ($q) {
                $q->where('students_period.Semestre', '>=', Student::MINIMUM_ACCESS_SEMESTER)
                    ->orWhere(function ($qq) {
                        $qq->whereNull('students_period.Semestre')
                            ->where('students.Semestre', '>=', Student::MINIMUM_ACCESS_SEMESTER);
                    });
            });

        if ($type === 'programa') {
            $query->where('students_period.Estatus', Student::STATUS_ACTIVO);
        }

        if ($role === 'coordinator') {
            $user->loadMissing('coordinator');
            $coordinatorCareer = mb_strtolower(trim((string)($user->coordinator->Carrera ?? '')));

            if ($coordinatorCareer === '') {
                return 0;
            }

            $query->whereRaw('LOWER(students_period.Carrera) = ?', [$coordinatorCareer]);
        }

        return (int)$query->distinct('students_period.student_id')->count('students_period.student_id');
    }
}
