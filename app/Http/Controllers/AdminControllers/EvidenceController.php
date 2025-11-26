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
            'titulo'      => ['sometimes', 'required', 'string', 'max:255'],
            'descripcion' => ['nullable', 'string'],
            'tipo'        => ['sometimes', 'required', 'in:inscripcion,programa'],
        ]);

        $evidence->update($data);

        return response()->json($evidence);
    }

    public function destroy(Evidence $evidence)
    {
        $evidence->delete();
        return response()->json(['message' => 'El espacio/evidence fue eliminado.']);
    }

    public function indexForStudent(Request $request)
{
    $user = $request->user();
    $student = $user->student; // ajusta si tu relación se llama diferente

    if (!$student) {
        return response()->json([
            'message' => 'No tienes perfil de estudiante.'
        ], 403);
    }

    $query = Evidence::query()
        ->with(['reports' => function ($q) {
            $q->orderBy('fecha_limite', 'asc')
              ->orderBy('created_at', 'asc');
        }]);

    // Siempre puede ver inscripción
    $query->where('tipo', 'inscripcion');

    // Si está activo, también programa
    if ($student->estatus === 'Activo') {
        $query->orWhere('tipo', 'programa');
    }

    $evidences = $query
        ->orderByRaw("FIELD(tipo, 'inscripcion','programa')")
        ->orderBy('titulo')
        ->get();

    return response()->json($evidences);
}
}