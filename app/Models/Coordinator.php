<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Coordinator extends Model
{
    protected $table = 'coordinators';

    public const CAREERS = [
        'Ingenieria Biomedica',
        'Ingenieria Electrica',
        'Ingenieria Electronica',
        'Ingenieria Industrial',
        'Ingenieria Mecanica',
        'Ingenieria Mecatronica',
        'Licenciatura en Administracion',
        'Ingenieria en Sistemas Computacionales',
        'Ingenieria Informatica',
        'Ingenieria en Gestion Empresarial',
        'Ingenieria Aeronautica',
    ];

    protected $fillable = [
        'Nombre',
        'Apellidos',
        'user_id',
        'Carrera',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
