<?php

namespace App\Http\Controllers\AdminControllers;

use App\Http\Controllers\Concerns\ResolvesPeriodContext;
use App\Http\Controllers\Controller;
use App\Models\Period;
use App\Models\Student;
use App\Models\StudentPeriod;
use App\Models\Submission;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PeriodController extends Controller
{
    use ResolvesPeriodContext;

    public function index(Request $request)
    {
        $query = Period::query()
            ->withCount([
                'studentAssignments as students_count',
                'studentAssignments as active_students_count' => function ($q) {
                    $q->where('Estatus', Student::STATUS_ACTIVO);
                },
                'studentAssignments as dropped_students_count' => function ($q) {
                    $q->where('Estatus', Student::STATUS_BAJA);
                },
                'reports',
            ])
            ->orderByDesc(Period::COLUMN_YEAR)
            ->orderByDesc('numero');

        if ($request->boolean('with_students')) {
            $query->with([
                'studentAssignments' => function ($q) {
                    $q->with('student')->orderBy('student_id');
                },
            ]);
        }

        return response()->json($query->get());
    }

    public function show(Request $request, Period $period)
    {
        $period->loadCount([
            'studentAssignments as students_count',
            'studentAssignments as active_students_count' => function ($q) {
                $q->where('Estatus', Student::STATUS_ACTIVO);
            },
            'studentAssignments as dropped_students_count' => function ($q) {
                $q->where('Estatus', Student::STATUS_BAJA);
            },
            'reports',
        ]);

        if ($request->boolean('with_students')) {
            $period->load([
                'studentAssignments' => function ($q) {
                    $q->with('student')->orderBy('student_id');
                },
            ]);
        }

        return response()->json($period);
    }

    public function store(Request $request)
    {
        $request->merge([
            'anio' => $request->input('anio', $request->input('year')),
            'numero' => $request->input('numero', $request->input('number')),
            'estatus' => $request->input('estatus', $request->input('status')),
            'fecha_inicio' => $request->input('fecha_inicio', $request->input('starts_at')),
            'fecha_fin' => $request->input('fecha_fin', $request->input('ends_at')),
            'clonar_estudiantes_desde_periodo_id' => $request->input(
                'clonar_estudiantes_desde_periodo_id',
                $request->input('clone_students_from_period_id')
            ),
        ]);

        $validated = $request->validate([
            'anio' => ['required', 'integer', 'min:2000', 'max:2100'],
            'numero' => ['required', 'integer', 'in:1,2'],
            'estatus' => ['nullable', 'in:' . implode(',', [
                Period::ESTATUS_BORRADOR,
                Period::ESTATUS_ACTIVO,
            ])],
            'fecha_inicio' => ['nullable', 'date'],
            'fecha_fin' => ['nullable', 'date', 'after_or_equal:fecha_inicio'],
            'clonar_estudiantes_desde_periodo_id' => ['nullable', 'integer', 'exists:periods,id'],
        ]);

        $estatus = $validated['estatus'] ?? Period::ESTATUS_BORRADOR;
        $codigo = $validated['anio'] . '-' . $validated['numero'];

        if (Period::query()->where(Period::COLUMN_YEAR, $validated['anio'])->where('numero', $validated['numero'])->exists()) {
            throw ValidationException::withMessages([
                'anio' => ['Ese periodo ya existe.'],
            ]);
        }

        if ($estatus === Period::ESTATUS_ACTIVO) {
            $this->ensureNoOtherActivePeriod();
        }

        $period = DB::transaction(function () use ($validated, $estatus, $codigo) {
            $period = Period::create([
                'anio' => $validated['anio'],
                'numero' => $validated['numero'],
                'codigo' => $codigo,
                'estatus' => $estatus,
                'fecha_inicio' => $validated['fecha_inicio'] ?? null,
                'fecha_fin' => $validated['fecha_fin'] ?? null,
            ]);

            if (!empty($validated['clonar_estudiantes_desde_periodo_id'])) {
                $this->cloneStudentsIntoPeriod(
                    $period,
                    (int)$validated['clonar_estudiantes_desde_periodo_id'],
                    false
                );
            }

            return $period;
        });

        return response()->json($period, 201);
    }

    public function update(Request $request, Period $period)
    {
        if ($period->isClosed()) {
            return response()->json([
                'message' => 'El periodo cerrado solo permite consulta y estadisticas.',
            ], 422);
        }

        $request->merge([
            'anio' => $request->input('anio', $request->input('year')),
            'numero' => $request->input('numero', $request->input('number')),
            'estatus' => $request->input('estatus', $request->input('status')),
            'fecha_inicio' => $request->input('fecha_inicio', $request->input('starts_at')),
            'fecha_fin' => $request->input('fecha_fin', $request->input('ends_at')),
        ]);

        $validated = $request->validate([
            'anio' => ['required', 'integer', 'min:2000', 'max:2100'],
            'numero' => ['required', 'integer', 'in:1,2'],
            'estatus' => ['nullable', 'in:' . implode(',', [
                Period::ESTATUS_BORRADOR,
                Period::ESTATUS_ACTIVO,
            ])],
            'fecha_inicio' => ['nullable', 'date'],
            'fecha_fin' => ['nullable', 'date', 'after_or_equal:fecha_inicio'],
        ]);

        $estatus = $validated['estatus'] ?? $period->estatus;
        $codigo = $validated['anio'] . '-' . $validated['numero'];

        if (
            Period::query()
                ->where(Period::COLUMN_YEAR, $validated['anio'])
                ->where('numero', $validated['numero'])
                ->where('id', '!=', $period->id)
                ->exists()
        ) {
            throw ValidationException::withMessages([
                'anio' => ['Ese periodo ya existe.'],
            ]);
        }

        if ($estatus === Period::ESTATUS_ACTIVO) {
            $this->ensureNoOtherActivePeriod($period->id);
        }

        $period->update([
            'anio' => $validated['anio'],
            'numero' => $validated['numero'],
            'codigo' => $codigo,
            'estatus' => $estatus,
            'fecha_inicio' => $validated['fecha_inicio'] ?? null,
            'fecha_fin' => $validated['fecha_fin'] ?? null,
            'fecha_cierre' => $estatus === Period::ESTATUS_CERRADO ? $period->fecha_cierre : null,
        ]);

        return response()->json($period->fresh());
    }

    public function activate(Period $period)
    {
        if ($period->isClosed()) {
            return response()->json([
                'message' => 'No puedes activar un periodo cerrado.',
            ], 422);
        }

        $this->ensureNoOtherActivePeriod($period->id);

        $period->update([
            'estatus' => Period::ESTATUS_ACTIVO,
            'fecha_cierre' => null,
        ]);

        return response()->json($period);
    }

    public function close(Period $period)
    {
        if ($period->isClosed()) {
            return response()->json($period);
        }

        DB::transaction(function () use ($period) {
            $ahora = Carbon::now();

            $period->update([
                'estatus' => Period::ESTATUS_CERRADO,
                'fecha_cierre' => $ahora,
            ]);

            StudentPeriod::query()
                ->where('periodo_id', $period->id)
                ->whereNull('Fecha_cierre')
                ->update([
                    'Fecha_cierre' => $ahora,
                ]);
        });

        return response()->json($period->fresh());
    }

    public function statistics(Period $period)
    {
        $assignments = StudentPeriod::query()->where('periodo_id', $period->id);
        $studentsCount = (clone $assignments)->count();
        $ingresosCount = (clone $assignments)->whereNotNull('Fecha_alta')->count();

        if ($ingresosCount === 0 && $studentsCount > 0) {
            $ingresosCount = $studentsCount;
        }

        $summary = [
            'alumnos' => $studentsCount,
            'ingresos' => $ingresosCount,
            'activos' => (clone $assignments)->where('Estatus', Student::STATUS_ACTIVO)->count(),
            'inactivos' => (clone $assignments)->where('Estatus', Student::STATUS_INACTIVO)->count(),
            'bajas' => (clone $assignments)->where('Estatus', Student::STATUS_BAJA)->count(),
            'con_acceso' => (clone $assignments)->whereNotNull('Primer_login_at')->count(),
            'empresas_vinculadas' => $this->countDistinctFilled((clone $assignments), 'Empresa'),
            'carreras_activas' => $this->countDistinctFilled((clone $assignments), 'Carrera'),
            'reportes' => $period->reports()->count(),
        ];

        $submissions = Submission::query()->where('periodo_id', $period->id);
        $submissionBreakdown = [
            [
                'status' => 'enviado',
                'label' => 'Pendientes de revision',
                'total' => (int) (clone $submissions)->where('status', 'enviado')->count(),
            ],
            [
                'status' => 'aceptado',
                'label' => 'Aceptadas',
                'total' => (int) (clone $submissions)->where('status', 'aceptado')->count(),
            ],
            [
                'status' => 'rechazado',
                'label' => 'Rechazadas',
                'total' => (int) (clone $submissions)->where('status', 'rechazado')->count(),
            ],
        ];

        $summary['entregas'] = (int) array_sum(array_column($submissionBreakdown, 'total'));

        $dropReasons = $this->periodBreakdown(
            $period,
            "COALESCE(NULLIF(TRIM(Motivo_baja), ''), 'Sin motivo especificado') as label, COUNT(*) as total",
            fn ($query) => $query->where('Estatus', Student::STATUS_BAJA)
        );

        $careerBreakdown = $this->periodBreakdown(
            $period,
            "COALESCE(NULLIF(TRIM(Carrera), ''), 'Sin carrera asignada') as label, COUNT(*) as total"
        );

        $companyBreakdown = $this->periodBreakdown(
            $period,
            'TRIM(Empresa) as label, COUNT(*) as total',
            fn ($query) => $query->whereRaw("NULLIF(TRIM(Empresa), '') IS NOT NULL")
        );

        return response()->json([
            'period' => [
                'id' => $period->id,
                'codigo' => $period->codigo,
                'estatus' => $period->estatus,
                'fecha_inicio' => optional($period->fecha_inicio)->toDateString(),
                'fecha_fin' => optional($period->fecha_fin)->toDateString(),
                'fecha_cierre' => optional($period->fecha_cierre)->toIso8601String(),
            ],
            'summary' => $summary,
            'drop_reasons' => $dropReasons,
            'career_breakdown' => $careerBreakdown,
            'company_breakdown' => $companyBreakdown,
            'submission_breakdown' => $submissionBreakdown,
        ]);
    }

    private function periodBreakdown(Period $period, string $selectRaw, ?callable $scope = null)
    {
        $query = StudentPeriod::query()
            ->where('periodo_id', $period->id)
            ->selectRaw($selectRaw);

        if ($scope) {
            $scope($query);
        }

        return $query
            ->groupBy('label')
            ->orderByDesc('total')
            ->orderBy('label')
            ->get()
            ->map(fn ($row) => [
                'label' => $row->label,
                'total' => (int) $row->total,
            ])
            ->values();
    }

    public function syncStudents(Request $request, Period $period)
    {
        if ($period->isClosed()) {
            return response()->json([
                'message' => 'El periodo cerrado solo permite consulta y estadisticas.',
            ], 422);
        }

        $request->merge([
            'reemplazar_faltantes' => $request->input('reemplazar_faltantes', $request->input('replace_missing')),
        ]);

        $validated = $request->validate([
            'reemplazar_faltantes' => ['nullable', 'boolean'],
            'students' => ['required', 'array', 'min:1'],
            'students.*.student_id' => ['required', 'integer', 'exists:students,id'],
            'students.*.estatus' => ['nullable', 'string', 'in:' . implode(',', Student::allowedStatuses())],
            'students.*.semestre' => ['nullable', 'integer', 'min:1', 'max:20'],
            'students.*.carrera' => ['nullable', 'string', 'max:255'],
            'students.*.empresa' => ['nullable', 'string', 'max:255'],
            'students.*.numero_convenio' => ['nullable', 'string', 'max:255'],
            'students.*.motivo_baja' => ['nullable', 'string', 'max:2000'],
            'students.*.fecha_baja' => ['nullable', 'date'],
            'students.*.fecha_alta' => ['nullable', 'date'],
        ]);

        $reemplazarFaltantes = (bool)($validated['reemplazar_faltantes'] ?? false);
        $studentIds = [];

        DB::transaction(function () use ($validated, $period, $reemplazarFaltantes, &$studentIds) {
            foreach ($validated['students'] as $item) {
                $studentIds[] = (int)$item['student_id'];

                $student = Student::query()->findOrFail($item['student_id']);
                $estatus = $item['estatus'] ?? Student::STATUS_INACTIVO;

                StudentPeriod::query()->updateOrCreate(
                    [
                        'periodo_id' => $period->id,
                        'student_id' => $student->id,
                    ],
                    [
                        'Estatus' => $estatus,
                        'Semestre' => $item['semestre'] ?? $student->Semestre ?? null,
                        'Carrera' => $item['carrera'] ?? $student->Carrera ?? null,
                        'Empresa' => $item['empresa'] ?? null,
                        'Numero_convenio' => $item['numero_convenio'] ?? null,
                        'Motivo_baja' => $item['motivo_baja'] ?? null,
                        'Fecha_baja' => $item['fecha_baja'] ?? null,
                        'Fecha_alta' => $item['fecha_alta'] ?? now()->toDateString(),
                        'Fecha_cierre' => null,
                    ]
                );
            }

            if ($reemplazarFaltantes) {
                StudentPeriod::query()
                    ->where('periodo_id', $period->id)
                    ->whereNotIn('student_id', $studentIds)
                    ->delete();
            }
        });

        return $this->show($request, $period->fresh());
    }

    public function cloneStudents(Request $request, Period $period)
    {
        if ($period->isClosed()) {
            return response()->json([
                'message' => 'El periodo cerrado solo permite consulta y estadisticas.',
            ], 422);
        }

        $request->merge([
            'periodo_origen_id' => $request->input('periodo_origen_id', $request->input('source_period_id')),
            'sobrescribir_existentes' => $request->input(
                'sobrescribir_existentes',
                $request->input('overwrite_existing')
            ),
        ]);

        $validated = $request->validate([
            'periodo_origen_id' => ['required', 'integer', 'exists:periods,id'],
            'sobrescribir_existentes' => ['nullable', 'boolean'],
        ]);

        if ((int)$validated['periodo_origen_id'] === (int)$period->id) {
            throw ValidationException::withMessages([
                'periodo_origen_id' => ['Debes seleccionar un periodo origen distinto al destino.'],
            ]);
        }

        $this->cloneStudentsIntoPeriod(
            $period,
            (int)$validated['periodo_origen_id'],
            (bool)($validated['sobrescribir_existentes'] ?? false)
        );

        return $this->show($request, $period->fresh());
    }

    private function ensureNoOtherActivePeriod(?int $ignorePeriodId = null): void
    {
        $query = Period::query()->active();

        if ($ignorePeriodId !== null) {
            $query->where('id', '!=', $ignorePeriodId);
        }

        if ($query->exists()) {
            throw ValidationException::withMessages([
                'periodo' => ['Ya existe un periodo activo. Cierralo antes de activar otro.'],
            ]);
        }
    }

    private function countDistinctFilled($query, string $column): int
    {
        return (int) ($query
            ->selectRaw("COUNT(DISTINCT NULLIF(TRIM({$column}), '')) as aggregate")
            ->value('aggregate') ?? 0);
    }

    private function cloneStudentsIntoPeriod(Period $targetPeriod, int $sourcePeriodId, bool $overwriteExisting): void
    {
        $sourceAssignments = StudentPeriod::query()
            ->where('periodo_id', $sourcePeriodId)
            ->get();

        foreach ($sourceAssignments as $assignment) {
            $attributes = [
                'periodo_id' => $targetPeriod->id,
                'student_id' => $assignment->student_id,
            ];

            $values = [
                'Estatus' => $assignment->Estatus,
                'Semestre' => $assignment->Semestre,
                'Carrera' => $assignment->Carrera,
                'Empresa' => $assignment->Empresa,
                'Numero_convenio' => $assignment->Numero_convenio,
                'Motivo_baja' => $assignment->Motivo_baja,
                'Fecha_baja' => $assignment->Fecha_baja,
                'Fecha_alta' => now()->toDateString(),
                'Fecha_cierre' => null,
            ];

            if ($overwriteExisting) {
                StudentPeriod::query()->updateOrCreate($attributes, $values);
                continue;
            }

            StudentPeriod::query()->firstOrCreate($attributes, $values);
        }
    }
}
