<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
/*Clase: CoordinatorResource
Descripción: Esta clase se encarga de transformar los datos del coordinador para ser 
enviados como respuesta*/
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