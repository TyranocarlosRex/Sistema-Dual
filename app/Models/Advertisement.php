<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Advertisement extends Model
{
    use HasFactory;

    // Laravel ya asume 'advertisements', no es obligatorio declarar $table,
    // pero si quieres ser explícito, puedes descomentar:
    // protected $table = 'advertisements';

    protected $fillable = [
        'titulo',
        'mensaje',
        'target_role',
        'target_carrera',
        'visible_from',
        'attachment_path',
        'created_by',
    ];

    protected $casts = [
        'visible_from' => 'datetime',
    ];

    /**
     * Usuario (admin/coordinador) que creó el anuncio.
     */
    public function creador()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Scope para anuncios visibles a partir de ahora.
     */
    public function scopeVisibles($query)
    {
        return $query->where(function ($q) {
            $q->whereNull('visible_from')
              ->orWhere('visible_from', '<=', now());
        });
    }

    /**
     * Scope para filtrar por rol objetivo (all o el rol dado).
     */
    public function scopeParaRol($query, string $role)
    {
        return $query->where(function ($q) use ($role) {
            $q->where('target_role', 'all')
              ->orWhere('target_role', $role);
        });
    }
}