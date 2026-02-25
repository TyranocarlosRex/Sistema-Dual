<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
/*Clase: Candidate
Descripción: Modelo que representa a un candidato (estudiante) en la aplicación.
Atributos:
- user_id: ID del usuario asociado al candidato.
- student_id: ID del estudiante (número de control).
- No_control: Número de control del estudiante.
- Apellidos: Apellidos del estudiante.
- Nombre: Nombre del estudiante.
- Correo_institucional: Correo institucional del estudiante.
- Carrera: Carrera del estudiante.
- Semestre: Semestre actual del estudiante.
- Estatus: Estatus del candidato (e.g., 'Activo', 'Inactivo').
- first_login_at: Fecha y hora del primer inicio de sesión del candidato.
- last_login_at: Fecha y hora del último inicio de sesión del candidato.
- origen: Origen del registro del candidato (e.g., 'login').
Relaciones:
- user(): Relación de pertenencia con el modelo User, indicando que un candidato pertenece a un usuario específico.
Scopes:
- scopeActivos(): Scope para obtener solo los candidatos con estatus 'Activo'.
- scopeInactivos(): Scope para obtener solo los candidatos con estatus 'Inactivo'.
*/
class Candidate extends Model
{
    public const STATUS_ACTIVO   = 'Activo';
    public const STATUS_INACTIVO = 'Inactivo';
    public const ORIGEN_LOGIN    = 'login';

    protected $table = 'candidate';

    protected $fillable = [
        'user_id','student_id',
        'No_control','Apellidos','Nombre','Correo_institucional',
        'Carrera','Semestre','Estatus',
        'first_login_at','last_login_at','origen'
    ];

    // Scopes con el mismo case que guarda tu DB
    public function scopeActivos($q){ return $q->where('Estatus','Activo'); }
    public function scopeInactivos($q){ return $q->where('Estatus','Inactivo'); }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
