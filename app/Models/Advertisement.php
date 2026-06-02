<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Advertisement extends Model
{
    use HasFactory;

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

    public function creador()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function scopeVisibles($query)
    {
        return $query->where(function ($q) {
            $q->whereNull('visible_from')
              ->orWhere('visible_from', '<=', now());
        });
    }

    public function scopeParaRol($query, string $role)
    {
        return $query->where(function ($q) use ($role) {
            $q->where('target_role', 'all')
              ->orWhere('target_role', $role);
        });
    }
}
