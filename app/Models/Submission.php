<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Submission extends Model
{
    use HasFactory;

    protected $fillable = [
        'report_id',
        'evidence_id',
        'periodo_id',
        'student_id',
        'file_path',
        'original_name',
        'status',
        'feedback',
        'calificacion',
    ];

    public function report()
    {
        return $this->belongsTo(Report::class);
    }

    public function evidence()
    {
        return $this->belongsTo(Evidence::class, 'evidence_id');
    }

    public function period()
    {
        return $this->belongsTo(Period::class, 'periodo_id');
    }

    public function student()
    {
        return $this->belongsTo(Student::class);
    }
}
