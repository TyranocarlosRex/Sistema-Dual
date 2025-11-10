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
        return [
            'id'         => $this->id,
            'Nombre'     => $this->Nombre,
            'Apellidos'  => $this->Apellidos,
            'Correo'     => $this->user->email ?? null,
            'Carrera'    => $this->Carrera,
            'No_control' => $this->No_control,
            'estatus'    => $this->Estatus ?? $this->estatus ?? null,
            // crudo por si quieres depurar:
            // '_raw'    => $this->resource,
        ];
    }
}