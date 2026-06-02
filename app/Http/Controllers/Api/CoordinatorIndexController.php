<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CoordinatorResource;
use App\Models\Coordinator;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class CoordinatorIndexController extends Controller
{
    public function index(Request $request)
    {
        if ($forbidden = $this->forbidNonAdminRole($request)) {
            return $forbidden;
        }

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

    public function store(Request $request)
    {
        if ($forbidden = $this->forbidNonAdminRole($request)) {
            return $forbidden;
        }

        $request->merge([
            'nombre' => $request->input('nombre', $request->input('Nombre')),
            'apellidos' => $request->input('apellidos', $request->input('Apellidos')),
            'correo' => mb_strtolower(trim((string)$request->input(
                'correo',
                $request->input('Correo', $request->input('email'))
            ))),
            'carrera' => $request->input('carrera', $request->input('Carrera')),
        ]);

        $data = $request->validate([
            'nombre' => ['required', 'string', 'max:255'],
            'apellidos' => ['required', 'string', 'max:255'],
            'correo' => ['required', 'email', 'max:255', 'unique:users,email'],
            'carrera' => ['required', 'string', Rule::in(Coordinator::CAREERS)],
            'password' => ['required', 'string', 'min:8'],
        ]);

        $coordinator = DB::transaction(function () use ($data) {
            $user = User::query()->create([
                'name' => trim($data['nombre'] . ' ' . $data['apellidos']),
                'email' => $data['correo'],
                'password' => $data['password'],
                'role' => 'coordinator',
            ]);

            return Coordinator::query()->create([
                'user_id' => $user->id,
                'Nombre' => $data['nombre'],
                'Apellidos' => $data['apellidos'],
                'Carrera' => $data['carrera'],
            ])->load('user');
        });

        return CoordinatorResource::make($coordinator)
            ->response()
            ->setStatusCode(201);
    }

    public function destroy(Request $request, Coordinator $coordinator)
    {
        if ($forbidden = $this->forbidNonAdminRole($request)) {
            return $forbidden;
        }

        $coordinator->loadMissing('user');
        $user = $coordinator->user;

        DB::transaction(function () use ($coordinator, $user) {
            $coordinator->delete();

            if ($user && mb_strtolower((string)$user->role) === 'coordinator') {
                $user->tokens()->delete();
                $user->delete();
            }
        });

        return response()->json(['message' => 'Coordinador eliminado']);
    }

    private function forbidNonAdminRole(Request $request)
    {
        $role = mb_strtolower((string)($request->user()?->role ?? ''));

        if ($role !== 'admin') {
            return response()->json(['message' => 'No autorizado.'], 403);
        }

        return null;
    }
}
