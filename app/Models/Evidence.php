<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Report;
/*Clase: Evidence
Descripción: Modelo que representa un espacio de evidencia en la aplicación, donde los 
candidatos pueden subir sus evidencias para las tareas asignadas.
Atributos:
- titulo: Título del espacio de evidencia.
- descripcion: Descripción del espacio de evidencia.
- attachment_path: Ruta del archivo adjunto (opcional).
- tipo: Tipo de evidencia (e.g., 'general', 'especifica').
- created_by: ID del usuario (admin) que creó el espacio de evidencia.
Relaciones:
- creador(): Relación de pertenencia con el modelo User, indicando quién creó el espacio de evidencia.
- reports(): Relación de uno a muchos con el modelo Report, indicando que un espacio de evidencia puede tener múltiples reportes (tareas) asociados.
*/
class Evidence extends Model
{
    use HasFactory;

    protected $table = 'evidences';

    protected $fillable = [
        'titulo',
        'descripcion',
        'attachment_path',
        'tipo',
        'created_by',
    ];

    /**
     * Creador del espacio de evidencia (admin).
     */
    public function creador()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Reportes (tareas) que cuelgan de esta evidencia/espacio.
     */
   public function reports()
    {
        // IMPORTANTE: el FK se llama evidences_id, no evidence_id
        return $this->hasMany(Report::class, 'evidence_id');
    }
}