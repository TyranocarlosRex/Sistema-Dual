<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ReportGeneratedAttachment extends Model
{
    use HasFactory;

    protected $fillable = [
        'report_id',
        'student_id',
        'document_template_id',
        'periodo_id',
        'file_path',
        'original_name',
        'created_by',
    ];

    protected $hidden = [
        'file_path',
    ];

    public function report()
    {
        return $this->belongsTo(Report::class);
    }

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function documentTemplate()
    {
        return $this->belongsTo(DocumentTemplate::class);
    }

    public function period()
    {
        return $this->belongsTo(Period::class, 'periodo_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
