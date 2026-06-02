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
        'attachment_path',
        'tipo',
        'created_by',
    ];

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
