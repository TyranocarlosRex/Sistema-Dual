<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CoordinatorResource;
use App\Models\Coordinator;
use Illuminate\Http\Request;

class CoordinatorIndexController extends Controller
{
    public function index(Request $request)
    {
        $q = Coordinator::with('user');

        if ($nombre = trim((string) $request->query('nombre', ''))) {
            $q->where(function ($qq) use ($nombre) {
                $qq->where('Nombre', 'like', "%{$nombre}%")
                   ->orWhere('Apellidos', 'like', "%{$nombre}%");
            });
        }

        if ($correo = trim((string) $request->query('correo', ''))) {
            $q->whereHas('user', function ($u) use ($correo) {
                $u->where('email', 'like', "%{$correo}%");
            });
        }

        if ($carrera = trim((string) $request->query('carrera', ''))) {
            $q->where('Carrera', 'like', "%{$carrera}%");
        }

        $perPage = (int) $request->query('per_page', 10);
        $coordinators = $q->paginate($perPage);

        return CoordinatorResource::collection($coordinators);
    }
}