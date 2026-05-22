<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
/*Clase: Report
Descripción: Modelo que representa un reporte o tarea asignada a los candidatos en la aplicación.
Atributos:
- evidence_id: ID del espacio de evidencia al que pertenece el reporte.
- titulo: Título del reporte.
- descripcion: Descripción del reporte.
- fecha_limite: Fecha límite para entregar el reporte.
- has_attachment: Indica si el reporte tiene un archivo adjunto (booleano).
- attachment_path: Ruta del archivo adjunto (opcional).
- created_by: ID del usuario (admin) que creó el reporte.
Relaciones:
- creator(): Relación de pertenencia con el modelo User, indicando quién creó el reporte.
- evidence(): Relación de pertenencia con el modelo Evidence, indicando a qué espacio de evidencia pertenece el reporte.
- submissions(): Relación de uno a muchos con el modelo Submission, indicando que un reporte puede tener múltiples entregas (submissions) de los candidatos.
*/
class Report extends Model
{
    use HasFactory;

    protected $fillable = [
        'evidence_id',
        'periodo_id',
        'titulo',
        'descripcion',
        'fecha_limite',
        'has_attachment',
        'attachment_path',
        'created_by',
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function evidence()
    {
        return $this->belongsTo(Evidence::class, 'evidence_id');
    }

    public function period()
    {
        return $this->belongsTo(Period::class, 'periodo_id');
    }

    public function submissions()
    {
        return $this->hasMany(Submission::class);
    }

    public function isVisibleToStudentAssignment(?StudentPeriod $assignment): bool
    {
        if ($assignment === null) {
            return false;
        }

        $this->loadMissing('evidence');

        $evidenceType = mb_strtolower(trim((string)($this->evidence?->tipo ?? '')));
        $studentStatus = mb_strtolower(trim((string)($assignment->Estatus ?? '')));

        return $evidenceType === 'inscripcion'
            || ($evidenceType === 'programa' && $studentStatus === mb_strtolower(Student::STATUS_ACTIVO));
    }
}
