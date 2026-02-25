<?php

namespace App\Http\Controllers\AdminControllers;

use App\Http\Controllers\Controller;
use App\Models\Evidence;
use Illuminate\Http\Request;


/*Este código define el controlador EvidenceController que maneja las 
solicitudes relacionadas con las evidencias.

El método index devuelve una lista de evidencias ordenadas por tipo y título, con la opción de incluir los reportes relacionados.

El método store permite crear una nueva evidencia validando los datos de entrada.

El método show devuelve los detalles de una evidencia específica, incluyendo sus reportes.

El método update permite actualizar una evidencia existente validando los datos de entrada.

El método indexForStudent devuelve una lista de evidencias visibles para un estudiante 
autenticado, filtrando por el estatus del estudiante y ordenando los reportes por 
fecha límite y fecha de creación.*/

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
