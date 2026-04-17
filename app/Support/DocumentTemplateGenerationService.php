<?php

namespace App\Support;

use App\Models\DocumentTemplate;
use App\Models\Period;
use App\Models\Student;
use App\Models\StudentPeriod;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class DocumentTemplateGenerationService
{
    public function options(?Period $period, string $search = '', ?string $career = null, int $limit = 25): array
    {
        $studentsQuery = $this->studentQuery($period);
        $this->applyStudentSearch($studentsQuery, $search);

        if (filled($career)) {
            $this->applyCareerFilter($studentsQuery, $period, (string) $career);
        }

        $total = (clone $studentsQuery)->count();
        $students = $studentsQuery
            ->orderBy('Apellidos')
            ->orderBy('Nombre')
            ->limit(max(1, min($limit, 50)))
            ->get();

        return [
            'period' => $this->serializePeriod($period),
            'careers' => $this->listCareers($period),
            'students_total' => $total,
            'students' => $students->map(function (Student $student) use ($period) {
                return $this->serializeStudent($student, $period ? $student->enrollmentForPeriod($period->id) : null);
            })->values()->all(),
        ];
    }

    public function generate(
        DocumentTemplate $document,
        ?Period $period,
        string $scope,
        ?int $studentId = null,
        ?string $career = null,
    ): array {
        $students = $this->resolveStudents($period, $scope, $studentId, $career);

        return [
            'document' => [
                'id' => (int) $document->id,
                'titulo' => (string) $document->titulo,
                'descripcion' => $document->descripcion,
                'placeholders' => array_values($document->placeholders ?? []),
            ],
            'scope' => $scope,
            'period' => $this->serializePeriod($period),
            'generated_count' => $students->count(),
            'documents' => $students->map(function (Student $student) use ($document, $period) {
                return $this->renderDocument($document, $student, $period);
            })->values()->all(),
        ];
    }

    private function resolveStudents(?Period $period, string $scope, ?int $studentId, ?string $career): Collection
    {
        $query = $this->studentQuery($period);

        if ($scope === 'student') {
            $student = $query->whereKey($studentId)->first();

            if (!$student) {
                throw ValidationException::withMessages([
                    'student_id' => ['Selecciona un alumno valido para el periodo indicado.'],
                ]);
            }

            return collect([$student]);
        }

        if ($scope === 'career') {
            $career = trim((string) $career);

            if ($career === '') {
                throw ValidationException::withMessages([
                    'career' => ['Selecciona una carrera para generar el documento.'],
                ]);
            }

            $this->applyCareerFilter($query, $period, $career);
        }

        $students = $query
            ->orderBy('Apellidos')
            ->orderBy('Nombre')
            ->get();

        if ($students->isEmpty()) {
            throw ValidationException::withMessages([
                'scope' => ['No se encontraron alumnos con el filtro seleccionado.'],
            ]);
        }

        return $students->values();
    }

    private function renderDocument(DocumentTemplate $document, Student $student, ?Period $period): array
    {
        $assignment = $period ? $student->enrollmentForPeriod($period->id) : null;
        $values = $this->buildPlaceholderValues($student, $assignment, $period);
        $placeholders = array_values($document->placeholders ?? []);
        $unresolved = array_values(array_filter($placeholders, fn (string $token) => !array_key_exists($token, $values)));

        $headerHtml = $this->replaceTokensInHtml((string) ($document->header_html ?? ''), $values);
        $bodyHtml = $this->replaceTokensInHtml((string) ($document->body_html ?? ''), $values);
        $footerHtml = $this->replaceTokensInHtml((string) ($document->footer_html ?? ''), $values);
        $plainText = $this->replaceTokensInText((string) ($document->plain_text ?? ''), $values);

        return [
            'student' => $this->serializeStudent($student, $assignment),
            'header_html' => $headerHtml,
            'body_html' => $bodyHtml,
            'footer_html' => $footerHtml,
            'plain_text' => $plainText,
            'filename' => $this->buildFilename($document, $student, 'html'),
            'pdf_filename' => $this->buildFilename($document, $student, 'pdf'),
            'unresolved_placeholders' => $unresolved,
        ];
    }

    private function buildPlaceholderValues(Student $student, ?StudentPeriod $assignment, ?Period $period): array
    {
        $fullName = trim(implode(' ', array_filter([
            trim((string) $student->Nombre),
            trim((string) $student->Apellidos),
        ])));

        return [
            'alumno_nombre' => trim((string) $student->Nombre),
            'alumno_apellidos' => trim((string) $student->Apellidos),
            'alumno_nombre_completo' => $fullName,
            'alumno_no_control' => trim((string) $student->No_control),
            'alumno_carrera' => trim((string) ($assignment->Carrera ?? $student->Carrera ?? '')),
            'alumno_semestre' => trim((string) ($assignment->Semestre ?? $student->Semestre ?? '')),
            'alumno_correo_institucional' => trim((string) ($student->Correo_institucional ?: $student->user?->email ?: '')),
            'alumno_telefono' => trim((string) ($student->Telefono ?? '')),
            'alumno_direccion' => trim((string) ($student->Direccion ?? '')),
            'periodo_codigo' => trim((string) ($period?->codigo ?? '')),
            'periodo_fecha_inicio' => $this->formatDate($period?->fecha_inicio),
            'periodo_fecha_fin' => $this->formatDate($period?->fecha_fin),
            'asignacion_estatus' => trim((string) ($assignment->Estatus ?? '')),
            'asignacion_empresa' => trim((string) ($assignment->Empresa ?? '')),
            'asignacion_numero_convenio' => trim((string) ($assignment->Numero_convenio ?? '')),
            'asignacion_motivo_baja' => trim((string) ($assignment->Motivo_baja ?? '')),
            'asignacion_fecha_alta' => $this->formatDate($assignment?->Fecha_alta),
            'asignacion_fecha_baja' => $this->formatDate($assignment?->Fecha_baja),
            'fecha_actual' => $this->formatDate(Carbon::now()),
        ];
    }

    private function replaceTokensInHtml(string $content, array $values): string
    {
        return (string) preg_replace_callback('/\{([a-z0-9_.-]+)\}/i', function (array $matches) use ($values) {
            $token = strtolower((string) ($matches[1] ?? ''));

            if (!array_key_exists($token, $values)) {
                return $matches[0];
            }

            return htmlspecialchars((string) $values[$token], ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
        }, $content);
    }

    private function replaceTokensInText(string $content, array $values): string
    {
        return (string) preg_replace_callback('/\{([a-z0-9_.-]+)\}/i', function (array $matches) use ($values) {
            $token = strtolower((string) ($matches[1] ?? ''));

            if (!array_key_exists($token, $values)) {
                return $matches[0];
            }

            return (string) $values[$token];
        }, $content);
    }

    private function studentQuery(?Period $period): Builder
    {
        $query = Student::query()->with('user');

        if ($period) {
            $query
                ->whereHas('periodAssignments', function (Builder $builder) use ($period) {
                    $builder->where('periodo_id', $period->id);
                })
                ->with([
                    'periodAssignments' => function ($builder) use ($period) {
                        $builder
                            ->with('period')
                            ->where('periodo_id', $period->id);
                    },
                ]);
        }

        return $query;
    }

    private function applyStudentSearch(Builder $query, string $search): void
    {
        $search = trim($search);

        if ($search === '') {
            return;
        }

        $query->where(function (Builder $builder) use ($search) {
            $builder
                ->where('Nombre', 'like', "%{$search}%")
                ->orWhere('Apellidos', 'like', "%{$search}%")
                ->orWhere('No_control', 'like', "%{$search}%");
        });
    }

    private function applyCareerFilter(Builder $query, ?Period $period, string $career): void
    {
        $normalizedCareer = mb_strtolower(trim($career));

        if ($period) {
            $query->whereHas('periodAssignments', function (Builder $builder) use ($period, $normalizedCareer) {
                $builder
                    ->where('periodo_id', $period->id)
                    ->whereRaw('LOWER(Carrera) = ?', [$normalizedCareer]);
            });

            return;
        }

        $query->whereRaw('LOWER(Carrera) = ?', [$normalizedCareer]);
    }

    private function listCareers(?Period $period): array
    {
        $careers = $period
            ? StudentPeriod::query()
                ->where('periodo_id', $period->id)
                ->whereNotNull('Carrera')
                ->orderBy('Carrera')
                ->pluck('Carrera')
            : Student::query()
                ->whereNotNull('Carrera')
                ->orderBy('Carrera')
                ->pluck('Carrera');

        return $careers
            ->map(fn ($value) => trim((string) $value))
            ->filter()
            ->unique(fn (string $value) => mb_strtolower($value))
            ->values()
            ->all();
    }

    private function serializeStudent(Student $student, ?StudentPeriod $assignment): array
    {
        $name = trim(implode(' ', array_filter([
            trim((string) $student->Nombre),
            trim((string) $student->Apellidos),
        ])));

        return [
            'id' => (int) $student->id,
            'nombre_completo' => $name,
            'nombre' => trim((string) $student->Nombre),
            'apellidos' => trim((string) $student->Apellidos),
            'no_control' => trim((string) $student->No_control),
            'carrera' => trim((string) ($assignment->Carrera ?? $student->Carrera ?? '')),
            'semestre' => trim((string) ($assignment->Semestre ?? $student->Semestre ?? '')),
            'correo' => trim((string) ($student->Correo_institucional ?: $student->user?->email ?: '')),
            'telefono' => trim((string) ($student->Telefono ?? '')),
            'estatus' => trim((string) ($assignment->Estatus ?? '')),
        ];
    }

    private function serializePeriod(?Period $period): ?array
    {
        if (!$period) {
            return null;
        }

        return [
            'id' => (int) $period->id,
            'codigo' => (string) $period->codigo,
            'anio' => $period->anio,
            'numero' => $period->numero,
            'estatus' => (string) $period->estatus,
            'fecha_inicio' => $period->fecha_inicio?->toDateString(),
            'fecha_fin' => $period->fecha_fin?->toDateString(),
        ];
    }

    private function formatDate(mixed $value): string
    {
        if ($value === null || $value === '') {
            return '';
        }

        $date = $value instanceof Carbon ? $value : Carbon::parse($value);

        return $date->format('d/m/Y');
    }

    private function buildFilename(DocumentTemplate $document, Student $student, string $extension = 'html'): string
    {
        $title = Str::slug((string) $document->titulo, '-');
        $control = trim((string) $student->No_control);

        return trim($title . ($control !== '' ? '-' . $control : ''), '-') . '.' . ltrim($extension, '.');
    }
}
