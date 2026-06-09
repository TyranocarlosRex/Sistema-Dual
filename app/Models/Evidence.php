<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Evidence extends Model
{
    use HasFactory;

    protected $table = 'evidences';

    protected $fillable = [
        'titulo',
        'descripcion',
        'fecha_limite',
        'attachment_path',
        'tipo',
        'is_active',
        'preserve_submissions_between_periods',
        'created_by',
    ];

    protected $casts = [
        'fecha_limite' => 'date',
        'is_active' => 'boolean',
        'preserve_submissions_between_periods' => 'boolean',
    ];

    /**
     * Creador del espacio de evidencia (admin).
     */
    public function creador()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function reports()
    {
        return $this->hasMany(Report::class, 'evidence_id');
    }

    public function submissions()
    {
        return $this->hasMany(Submission::class, 'evidence_id');
    }
}
