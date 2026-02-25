<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Candidate;
/*Clase: Student
Descripción: Modelo que representa a un estudiante en la aplicación.
Atributos:
- Nombre: Nombre del estudiante.
- Apellidos: Apellidos del estudiante.
- No_control: Número de control del estudiante.
- Semestre: Semestre actual del estudiante.
- Direccion: Dirección del estudiante.
- Telefono: Número de teléfono del estudiante.
- Estatus: Estatus del estudiante (e.g., 'Activo', 'Inactivo').
- Carrera: Carrera del estudiante.
- Correo_institucional: Correo institucional del estudiante.
Relaciones:
- user(): Relación de pertenencia con el modelo User, indicando que un estudiante pertenece a un usuario específico.
- candidate(): Relación de uno a uno con el modelo Candidate, indicando que un estudiante tiene un registro asociado en la tabla candidate, que contiene información adicional sobre su estatus como candidato.
*/
class Student extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'Nombre',
        'Apellidos',
        'No_control',
        'Semestre',
        'Direccion',
        'Telefono',
        'Estatus',
        'Carrera',
        'Correo_institucional',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function candidate()
    {
        return $this->hasOne(Candidate::class, 'student_id');
    }
}