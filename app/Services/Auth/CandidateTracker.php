<?php

namespace App\Services\Auth;

use App\Models\User;
use App\Models\Candidate;
use Illuminate\Support\Carbon;

class CandidateTracker
{
    public function track(User $user): void
    {
        if (!$this->shouldTrack($user)) {
            return;
        }

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
            $payload['Estatus'] = 'Inactivo'; // o 'Activo'
        }
        $rec->fill($payload)->save();
    }

    private function shouldTrack(User $user): bool
    {
        if (isset($user->rol) && strtolower($user->rol) !== 'student') {
            return false;
        }
        if (method_exists($user, 'student') && !$user->student) {
            return false;
        }
        // if ($user->student && (int)$user->student->Semestre !== 8) return false;
        return true;
    }
}