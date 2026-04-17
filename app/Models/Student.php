<?php

namespace App\Models;

use Illuminate\Support\Carbon;
use Illuminate\Database\Eloquent\Model;

class Student extends Model
{
    public const STATUS_ACTIVO = 'Activo';
    public const STATUS_INACTIVO = 'Inactivo';
    public const STATUS_BAJA = 'Baja';

    /**
     * @var array<int, string>
     */
    protected $fillable = [
        'Nombre',
        'Apellidos',
        'No_control',
        'Semestre',
        'Direccion',
        'Telefono',
        'Carrera',
        'Correo_institucional',
    ];

    public static function allowedStatuses(): array
    {
        return [
            self::STATUS_ACTIVO,
            self::STATUS_INACTIVO,
            self::STATUS_BAJA,
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function periodAssignments()
    {
        return $this->hasMany(StudentPeriod::class);
    }

    public function periods()
    {
        return $this->belongsToMany(Period::class, 'students_period', 'student_id', 'periodo_id')
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
                'Primer_login_at',
                'Ultimo_login_at',
                'Origen_login',
            ])
            ->withTimestamps();
    }

    public function enrollmentForPeriod(?int $periodId): ?StudentPeriod
    {
        if ($periodId === null) {
            return null;
        }

        if ($this->relationLoaded('periodAssignments')) {
            return $this->periodAssignments->firstWhere('periodo_id', $periodId);
        }

        return $this->periodAssignments()
            ->where('periodo_id', $periodId)
            ->first();
    }

    public function ensureEnrollmentForPeriod(?int $periodId): ?StudentPeriod
    {
        if ($periodId === null) {
            return null;
        }

        $assignment = $this->periodAssignments()->firstOrCreate(
            [
                'periodo_id' => $periodId,
                'student_id' => $this->id,
            ],
            [
                'Estatus' => self::STATUS_INACTIVO,
                'Semestre' => $this->Semestre ?? null,
                'Carrera' => $this->Carrera ?? null,
                'Fecha_alta' => Carbon::today(),
            ]
        );

        $dirty = false;

        if (blank($assignment->Carrera) && !blank($this->Carrera)) {
            $assignment->Carrera = $this->Carrera;
            $dirty = true;
        }

        if (blank($assignment->Semestre) && !blank($this->Semestre)) {
            $assignment->Semestre = $this->Semestre;
            $dirty = true;
        }

        if ($dirty) {
            $assignment->save();
        }

        return $assignment;
    }

    public function statusForPeriod(?int $periodId): ?string
    {
        return $this->enrollmentForPeriod($periodId)?->Estatus;
    }
}
