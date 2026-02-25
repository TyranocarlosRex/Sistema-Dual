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

    public function submissions()
    {
        return $this->hasMany(Submission::class);
    }
}