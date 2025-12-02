<?php

namespace App\Http\Controllers\AdminControllers;

use App\Http\Controllers\Controller;
use App\Models\Advertisement;
use Illuminate\Http\Request;

class AdvertisementController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $role = $user->role;
        $carrera = $user->carrera ?? null;

        $anuncios = Advertisement::query()
            ->visibles()
            ->paraRol($role)
            ->when(
                $role === 'student' && $carrera,
                function ($q) use ($carrera) {
                    $q->where(function ($qq) use ($carrera) {
                        $qq->whereNull('target_carrera')
                           ->orWhere('target_carrera', $carrera);
                    });
                }
            )
            ->latest()
            ->get();

        return response()->json($anuncios);
    }

    public function store(Request $request)
    {
        $user = $request->user();

        if (!in_array($user->role, ['coordinator', 'admin'])) {
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
