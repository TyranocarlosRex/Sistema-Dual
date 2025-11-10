<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CoordinatorResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'        => $this->id,
            'Nombre'    => $this->Nombre,
            'Apellidos' => $this->Apellidos,
            'Correo'    => $this->user->email ?? null,
            'Carrera'   => $this->Carrera,
        ];
    }
}