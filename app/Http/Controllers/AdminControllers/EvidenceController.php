<?php

namespace App\Http\Controllers\AdminControllers;

use App\Http\Controllers\Concerns\ResolvesPeriodContext;
use App\Http\Controllers\Controller;
use App\Models\Evidence;
use App\Models\Period;
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

        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'titulo' => ['required', 'string', 'max:255'],
            'descripcion' => ['nullable', 'string'],
            'tipo' => ['required', 'in:inscripcion,programa'],
        ]);

        $data['created_by'] = $request->user()->id;

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
            'tipo' => ['required', 'in:inscripcion,programa'],
        ]);

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
                        ->orderBy('fecha_limite', 'asc')
                        ->orderBy('created_at', 'asc');
                },
            ])
            ->whereIn('tipo', $tiposVisibles)
            ->whereHas('reports', function ($qq) use ($period) {
                $qq->where('periodo_id', $period->id);
            })
            ->orderByRaw("CASE tipo WHEN 'inscripcion' THEN 0 WHEN 'programa' THEN 1 ELSE 2 END")
            ->orderBy('titulo')
            ->get();

        return response()->json($evidences);
    }
}
