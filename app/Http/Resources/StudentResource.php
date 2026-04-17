<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StudentResource extends JsonResource
{
    /**
     * @param Request $request
     */
    public function toArray($request): array
    {
        $assignment = $this->relationLoaded('periodAssignments')
            ? $this->periodAssignments->first()
            : null;

        return [
            'id' => $this->id,
            'Nombre' => $this->Nombre,
            'Apellidos' => $this->Apellidos,
            'Correo' => $this->user->email ?? null,
            'Carrera' => $assignment->Carrera ?? $this->Carrera,
            'No_control' => $this->No_control,
            'Semestre' => $assignment->Semestre ?? $this->Semestre,
            'Empresa' => $assignment->Empresa ?? null,
            'Numero_convenio' => $assignment->Numero_convenio ?? null,
            'estatus' => $assignment->Estatus ?? null,
            'Motivo_baja' => $assignment->Motivo_baja ?? null,
            'Fecha_baja' => optional($assignment?->Fecha_baja)->toDateString(),
            'period' => $assignment ? [
                'id' => $assignment->periodo_id,
                'codigo' => $assignment->period->codigo ?? null,
            ] : null,
            'submitted_reports_count' => (int)($this->submitted_reports_count ?? 0),
            'assigned_reports_count' => (int)($this->assigned_reports_count ?? 0),
            'progress_percent' => (int)($this->progress_percent ?? 0),
        ];
    }
}
