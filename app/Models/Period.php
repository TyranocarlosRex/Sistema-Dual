<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Period extends Model
{
    use HasFactory;

    public const COLUMN_YEAR = 'año';
    public const ESTATUS_BORRADOR = 'borrador';
    public const ESTATUS_ACTIVO = 'activo';
    public const ESTATUS_CERRADO = 'cerrado';

    protected $table = 'periods';

    protected $fillable = [
        'anio',
        'numero',
        'codigo',
        'estatus',
        'fecha_inicio',
        'fecha_fin',
        'fecha_cierre',
    ];

    protected $casts = [
        'fecha_inicio' => 'date',
        'fecha_fin' => 'date',
        'fecha_cierre' => 'datetime',
    ];

    protected $hidden = [
        'año',
    ];

    protected $appends = [
        'anio',
    ];

    public static function allowedStatuses(): array
    {
        return [
            self::ESTATUS_BORRADOR,
            self::ESTATUS_ACTIVO,
            self::ESTATUS_CERRADO,
        ];
    }

    public static function current(): ?self
    {
        return static::query()
            ->where('estatus', self::ESTATUS_ACTIVO)
            ->orderByDesc(self::COLUMN_YEAR)
            ->orderByDesc('numero')
            ->first();
    }

    public function scopeActive($query)
    {
        return $query->where('estatus', self::ESTATUS_ACTIVO);
    }

    public function isClosed(): bool
    {
        return $this->estatus === self::ESTATUS_CERRADO;
    }

    public function studentAssignments()
    {
        return $this->hasMany(StudentPeriod::class, 'periodo_id');
    }

    public function students()
    {
        return $this->belongsToMany(Student::class, 'students_period', 'periodo_id', 'student_id')
            ->withPivot([
                'Estatus',
                'Semestre',
                'Carrera',
                'Empresa',
                'Numero_convenio',
                'Motivo_baja',
                'Fecha_baja',
                'Fecha_alta',
                'Fecha_cierre',
            ])
            ->withTimestamps();
    }

    public function reports()
    {
        return $this->hasMany(Report::class, 'periodo_id');
    }

    public function getAnioAttribute(): ?int
    {
        $value = $this->getAttributeFromArray(self::COLUMN_YEAR);

        return $value !== null ? (int) $value : null;
    }

    public function setAnioAttribute(mixed $value): void
    {
        $this->attributes[self::COLUMN_YEAR] = $value;
    }
}
