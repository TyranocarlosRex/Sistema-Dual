<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\StudentResource;
use App\Models\Student;
use Illuminate\Http\Request;

class StudentIndexController extends Controller
{
    public function index(Request $request)
    {
        $q = Student::with('user'); // para sacar correo desde users

        // Filtros opcionales: nombre, correo, carrera
        if ($nombre = trim((string) $request->query('nombre', ''))) {
            // Asumiendo columnas "Nombre" y "Apellidos" con mayúsculas (como en tu DB)
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
        $students = $q->paginate($perPage);

        return StudentResource::collection($students);
    }
}