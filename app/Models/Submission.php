<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
/*Clase: Submission
Descripción: Modelo que representa una entrega o submission de un candidato 
para un reporte específico en la aplicación.
Atributos:
- report_id: ID del reporte al que corresponde la entrega.
- student_id: ID del estudiante (candidato) que realizó la entrega.
- file_path: Ruta del archivo entregado.
- original_name: Nombre original del archivo entregado.
- status: Estado de la entrega (e.g., 'Pendiente', 'Revisado').
- feedback: Retroalimentación proporcionada por el coordinador o admin (opcional).
- calificacion: Calificación asignada a la entrega (opcional).
Relaciones:
- report(): Relación de pertenencia con el modelo Report, indicando a qué reporte corresponde la entrega.
- student(): Relación de pertenencia con el modelo Student, indicando quién realizó la entrega.
*/
class Submission extends Model
{
    use HasFactory;

    protected $fillable = [
        'report_id',
        'evidence_id',
        'periodo_id',
        'student_id',
        'file_path',
        'original_name',
        'status',
        'feedback',
        'calificacion',
    ];

    public function report()
    {
        return $this->belongsTo(Report::class);
    }

    public function evidence()
    {
        return $this->belongsTo(Evidence::class, 'evidence_id');
    }

    public function period()
    {
        return $this->belongsTo(Period::class, 'periodo_id');
    }

    public function student()
    {
        return $this->belongsTo(Student::class);
    }
}
