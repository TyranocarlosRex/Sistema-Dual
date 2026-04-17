<?php

namespace App\Services\Auth;

use App\Models\Period;
use App\Models\StudentPeriod;
use App\Models\User;
use Illuminate\Support\Carbon;

class CandidateTracker
{
    public function track(User $user): void
    {
        $user->loadMissing('student');

        if (!$this->shouldTrack($user)) {
            return;
        }

        $student = $user->student;
        $periodoActivo = Period::current();

        if ($student === null || $periodoActivo === null) {
            return;
        }

        $registroPeriodo = $student->ensureEnrollmentForPeriod($periodoActivo->id);

        if ($registroPeriodo === null) {
            return;
        }

        $now = Carbon::now();

        if ($registroPeriodo->Primer_login_at === null) {
            $registroPeriodo->Primer_login_at = $now;
        }

        $registroPeriodo->Ultimo_login_at = $now;
        $registroPeriodo->Origen_login = 'login';
        $registroPeriodo->Carrera = $registroPeriodo->Carrera ?? $student->Carrera ?? null;
        $registroPeriodo->Semestre = $registroPeriodo->Semestre ?? (isset($student->Semestre) ? (int)$student->Semestre : null);

        $registroPeriodo->save();
    }

    private function shouldTrack(User $user): bool
    {
        if (strtolower((string)($user->role ?? '')) !== 'student') {
            return false;
        }

        return $user->student !== null;
    }
}
