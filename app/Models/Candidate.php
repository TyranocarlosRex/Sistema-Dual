<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Candidate extends Model
{
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