<?php

namespace App\Services\Auth;

use App\Models\User;
use App\Models\Candidate;
use Illuminate\Support\Carbon;
/*Clase: CandidateTracker
Descripción: Esta clase se encarga de rastrear la actividad de los candidatos (estudiantes) 
que inician sesión en el sistema. Al iniciar sesión, se verifica si el usuario es un estudiante
y, de ser así, se actualiza o crea un registro en la tabla de candidatos con información
relevante como el número de control, nombre, carrera, semestre y las fechas de primer y último 
inicio de sesión. Esto permite llevar un seguimiento de la actividad de los estudiantes en el 
sistema, lo que puede ser útil para análisis y reportes futuros. 
*/
class CandidateTracker
{
    public function track(User $user): void
    {
        $user->loadMissing('student');
        if (!$this->shouldTrack($user)) {
            return;
        }
        // asegurate de tener el perfil de estudiante cargado
        $student = $user->student;
        $now = Carbon::now();

        $payload = [
            'student_id' => $student->id ?? null,
            'No_control' => $student->No_control ?? null,
            'Apellidos'  => $student->Apellidos ?? ($user->apellidos ?? null),
            'Nombre'     => $student->Nombre ?? ($user->name ?? null),
            'Correo_institucional' => $student->Correo_institucional ?? ($user->email ?? null),
            'Carrera'    => $student->Carrera ?? null,
            'Semestre'   => isset($student->Semestre) ? (int)$student->Semestre : null,
            'origen'     => Candidate::ORIGEN_LOGIN,
            'last_login_at' => $now,
        ];

        $rec = Candidate::firstOrNew(['user_id' => $user->id]);
        if (!$rec->exists) {
            $payload['first_login_at'] = $now;
            $payload['Estatus'] = Candidate::STATUS_INACTIVO; // o STATUS_ACTIVO
        }
        $rec->fill($payload)->save();
    }

    private function shouldTrack(User $user): bool
    {
        if (strtolower((string)($user->role ?? '')) !== 'student') {
            return false;
        }
        if (!$user->student) {
            return false;
        }
        // if ($user->student && (int)$user->student->Semestre !== 8) return false;
        return true;
    }
}
