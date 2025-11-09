<?php

namespace App\Services\Auth;

use App\Models\Candidate;
use App\Models\User;
use Illuminate\Support\Carbon;

class CandidateTracker
{
    public function track(User $user): void
    {
        $student = method_exists($user, 'student') ? $user->student : null;

        $payload = [
            'student_id' => $student->id ?? null,
            'No_control' => $student->No_control ?? null,
            'Apellidos'  => $student->Apellidos ?? ($user->apellidos ?? null),
            'Nombre'     => $student->Nombre ?? ($user->name ?? null),
            'Correo_institucional' => $student->Correo_institucional ?? ($user->email ?? null),
            'Carrera'    => $student->Carrera ?? null,
            'Semestre'   => isset($student->Semestre) ? (int)$student->Semestre : null,
            'origen'     => 'login',
            'last_login_at' => Carbon::now(),
        ];

        $rec = Candidate::firstOrNew(['user_id' => $user->id]);
        if (!$rec->exists) {
            $payload['first_login_at'] = Carbon::now();
            $payload['Estatus'] = 'Inactivo'; // o 'Activo' si quieres auto-activar
        }

        $rec->fill($payload)->save();
    }
}