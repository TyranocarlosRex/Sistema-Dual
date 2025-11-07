<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Coordinator extends Model
{
    protected $table = 'coordinators';

    protected $fillable = [
        'Nombre',
        'Apellidos',
        'user_id',
        'Carrera',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}