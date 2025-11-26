<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Submission extends Model
{
    use HasFactory;

    protected $fillable = [
        'report_id',
        'student_id',
        'file_path',
        'original_name',
        'status',
        'feedback',
    ];

    public function report()
    {
        return $this->belongsTo(Report::class);
    }

    public function student()
    {
        return $this->belongsTo(Student::class);
    }
}