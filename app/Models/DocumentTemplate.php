<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DocumentTemplate extends Model
{
    use HasFactory;

    protected $fillable = [
        'titulo',
        'descripcion',
        'header_html',
        'body_html',
        'footer_html',
        'plain_text',
        'source_filename',
        'source_extension',
        'placeholders',
        'created_by',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'placeholders' => 'array',
        ];
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}
