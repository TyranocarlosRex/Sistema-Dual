<?php

namespace App\Http\Controllers\AdminControllers;

use App\Http\Controllers\Controller;
use App\Models\Advertisement;
use App\Models\Period;
use App\Models\User;
use Illuminate\Http\Request;

class AdvertisementController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $role = mb_strtolower((string)$user->role);

        if ($request->query('scope') === 'outbox') {
            return $this->outbox($user, $role);
        }

        $carrera = null;

        if ($role === 'student') {
            $user->loadMissing('student');
            $student = $user->student;
            $period = Period::current();
            $assignment = $period ? $student?->enrollmentForPeriod($period->id) : null;
            $carrera = $assignment?->Carrera ?? $student?->Carrera;
        }

        $anuncios = Advertisement::query()
            ->visibles()
            ->paraRol($role)
            ->when(
                $role === 'student',
                function ($q) use ($carrera) {
                    $q->where(function ($qq) use ($carrera) {
                        $qq->whereNull('target_carrera');

                        if (!blank($carrera)) {
                            $qq->orWhere('target_carrera', $carrera);
                        }
                    });
                }
            )
            ->latest()
            ->get();

        return response()->json($anuncios);
    }

    private function outbox(User $user, string $role)
    {
        if (!in_array($role, ['coordinator', 'admin'], true)) {
            return response()->json(['message' => 'No autorizado'], 403);
        }

        $query = Advertisement::query()
            ->where('created_by', $user->id);

        if ($role === 'coordinator') {
            $user->loadMissing('coordinator');
            $career = trim((string)($user->coordinator?->Carrera ?? ''));

            if ($career === '') {
                return response()->json([
                    'message' => 'El coordinador no tiene carrera asignada.',
                ], 403);
            }

            $query
                ->where('target_role', 'student')
                ->whereRaw('LOWER(target_carrera) = ?', [mb_strtolower($career)]);
        }

        return response()->json(
            $query->latest()->get()
        );
    }

    public function store(Request $request)
    {
        $user = $request->user();
        $role = mb_strtolower((string)$user->role);

        if (!in_array($role, ['coordinator', 'admin'], true)) {
            return response()->json(['message' => 'No autorizado'], 403);
        }

        $validated = $request->validate([
            'titulo'         => 'required|string|max:255',
            'mensaje'        => 'required|string',
            'target_role'    => 'required|in:all,student,coordinator,admin',
            'target_carrera' => 'nullable|string|max:255',
            'visible_from'   => 'nullable|date',
            'attachment'     => 'nullable|file|max:4096',
        ]);

        if ($role === 'coordinator') {
            $user->loadMissing('coordinator');
            $career = trim((string)($user->coordinator?->Carrera ?? ''));

            if ($career === '') {
                return response()->json([
                    'message' => 'El coordinador no tiene carrera asignada.',
                ], 403);
            }

            $requestedCareer = trim((string)($validated['target_carrera'] ?? ''));

            if ($validated['target_role'] !== 'student') {
                return response()->json([
                    'message' => 'Solo puedes publicar anuncios para estudiantes de tu carrera.',
                ], 403);
            }

            if ($requestedCareer !== '' && mb_strtolower($requestedCareer) !== mb_strtolower($career)) {
                return response()->json([
                    'message' => 'Solo puedes publicar anuncios para estudiantes de tu carrera.',
                ], 403);
            }

            $validated['target_role'] = 'student';
            $validated['target_carrera'] = $career;
        }

        $path = null;
        if ($request->hasFile('attachment')) {
            $path = $request->file('attachment')->store('advertisements', 'public');
        }

        $anuncio = Advertisement::create([
            'titulo'         => $validated['titulo'],
            'mensaje'        => $validated['mensaje'],
            'target_role'    => $validated['target_role'],
            'target_carrera' => $validated['target_carrera'] ?? null,
            'visible_from'   => $validated['visible_from'] ?? null,
            'attachment_path'=> $path,
            'created_by'     => $user->id,
        ]);

        return response()->json($anuncio, 201);
    }
}
