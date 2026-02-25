<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
/*Clase: Admin
Descripción: Modelo que representa a un administrador en la aplicación.
Atributos:
- user_id: ID del usuario asociado al administrador.
- nombre: Nombre del administrador.
- apellidos: Apellidos del administrador.
Relaciones:
- user(): Relación de pertenencia con el modelo User, indicando que un administrador pertenece 
a un usuario específico.
*/
class Admin extends Model
{
    use HasFactory;

    protected $table = 'admins';

    protected $fillable = [
        'user_id',
        'nombre',
        'apellidos',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}