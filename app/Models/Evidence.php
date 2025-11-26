<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Report;

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