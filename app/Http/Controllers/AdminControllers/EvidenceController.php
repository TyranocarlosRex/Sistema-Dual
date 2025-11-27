<?php

namespace App\Http\Controllers\AdminControllers;

use App\Http\Controllers\Controller;
use App\Models\Evidence;
use Illuminate\Http\Request;

class EvidenceController extends Controller
{
    public function index(Request $request)
    {
        $query = Evidence::query()
            ->orderBy('tipo')
            ->orderBy('titulo');

        if ($request->boolean('with_reports')) {
            $query->with('reports');
        }

        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'titulo'      => ['required', 'string', 'max:255'],
            'descripcion' => ['nullable', 'string'],
            'tipo'        => ['required', 'in:inscripcion,programa'],
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
            'titulo'      => ['required', 'string', 'max:255'],
            'descripcion' => ['nullable', 'string'],
            'tipo'        => ['required', 'in:inscripcion,programa'],
        ]);

        $evidence->update($data);

        return response()->json($evidence);
    }

    public function indexForStudent(Request $request)
    {
        $user = $request->user();
        $student = $user->student;

        if (!$student) {
            return response()->json([
                'message' => 'No tienes perfil de estudiante.'
            ], 403);
        }

        // tomar estatus sin importar si la columna es estatus o Estatus
        $rawEstatus = $student->estatus ?? $student->Estatus ?? '';
        $estatus    = strtolower(trim((string) $rawEstatus));

        $tiposVisibles = ['inscripcion'];
        if ($estatus === 'activo') {
            $tiposVisibles[] = 'programa';
        }

        $evidences = Evidence::query()
            ->with([
                'reports' => function ($q) use ($student) {
                    $q->with([
                        // 👇 solo las entregas de ESTE alumno
                        'submissions' => function ($qq) use ($student) {
                            $qq->where('student_id', $student->id);
                        }
                    ])
                    ->orderBy('fecha_limite', 'asc')
                    ->orderBy('created_at', 'asc');
                }
            ])
            ->whereIn('tipo', $tiposVisibles)
            ->orderByRaw("FIELD(tipo, 'inscripcion','programa')")
            ->orderBy('titulo')
            ->get();

        return response()->json($evidences);
    }
}
