<?php

namespace App\Http\Middleware;

use App\Models\Period;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureStudentMinimumSemester
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user === null || strtolower((string)($user->role ?? '')) !== 'student') {
            return $next($request);
        }

        $user->loadMissing('student');
        $student = $user->student;

        if ($student === null) {
            return $next($request);
        }

        $periodoActivo = Period::current();

        if (!$student->hasMinimumAccessSemester($periodoActivo?->id)) {
            return response()->json([
                'message' => 'Solo estudiantes de septimo semestre en adelante pueden acceder.',
            ], 403);
        }

        return $next($request);
    }
}
