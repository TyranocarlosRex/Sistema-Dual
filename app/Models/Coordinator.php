<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
/*Clase: Coordinator
Descripción: Modelo que representa a un coordinador en la aplicación.
Atributos:
- user_id: ID del usuario asociado al coordinador.
- Nombre: Nombre del coordinador.
- Apellidos: Apellidos del coordinador.
- Carrera: Carrera que coordina el coordinador.
Relaciones:
- user(): Relación de pertenencia con el modelo User, indicando que un coordinador pertenece a un usuario específico.
*/  
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
