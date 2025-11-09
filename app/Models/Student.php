<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Candidate;

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