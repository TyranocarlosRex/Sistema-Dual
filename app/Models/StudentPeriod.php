<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StudentPeriod extends Model
{
    protected $table = 'students_period';

    protected $fillable = [
        'student_id',
        'periodo_id',
        'Estatus',
        'Semestre',
        'Carrera',
        'Empresa',
        'Numero_convenio',
        'Motivo_baja',
        'Fecha_baja',
        'Fecha_alta',
        'Fecha_cierre',
        'Primer_login_at',
        'Ultimo_login_at',
        'Origen_login',
    ];

    protected $casts = [
        'Fecha_baja' => 'date',
        'Fecha_alta' => 'date',
        'Fecha_cierre' => 'datetime',
        'Primer_login_at' => 'datetime',
        'Ultimo_login_at' => 'datetime',
    ];

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function period()
    {
        return $this->belongsTo(Period::class, 'periodo_id');
    }
}
