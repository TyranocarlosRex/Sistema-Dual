<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasTable('students') || !Schema::hasTable('students_period') || !Schema::hasTable('periods')) {
            return;
        }

        $studentColumns = ['Estatus', 'Empresa', 'Numero_convenio', 'Motivo_baja', 'Fecha_baja'];
        $availableStudentColumns = array_values(array_filter(
            $studentColumns,
            fn (string $column): bool => Schema::hasColumn('students', $column)
        ));

        if (!empty($availableStudentColumns)) {
            DB::table('students')
                ->select(array_merge(['id'], $availableStudentColumns))
                ->orderBy('id')
                ->chunkById(100, function ($students) {
                foreach ($students as $student) {
                    $assignment = DB::table('students_period')
                        ->join('periods', 'periods.id', '=', 'students_period.periodo_id')
                        ->where('students_period.student_id', $student->id)
                        ->select([
                            'students_period.id',
                            'students_period.Estatus',
                            'students_period.Empresa',
                            'students_period.Numero_convenio',
                            'students_period.Motivo_baja',
                            'students_period.Fecha_baja',
                        ])
                        ->orderByRaw("CASE periods.estatus WHEN 'activo' THEN 0 WHEN 'borrador' THEN 1 ELSE 2 END")
                        ->orderByDesc('periods.año')
                        ->orderByDesc('periods.numero')
                        ->first();

                    if (!$assignment) {
                        continue;
                    }

                    $updates = [];

                    $studentStatus = property_exists($student, 'Estatus') ? $student->Estatus : null;
                    $studentEmpresa = property_exists($student, 'Empresa') ? $student->Empresa : null;
                    $studentNumeroConvenio = property_exists($student, 'Numero_convenio') ? $student->Numero_convenio : null;
                    $studentMotivoBaja = property_exists($student, 'Motivo_baja') ? $student->Motivo_baja : null;
                    $studentFechaBaja = property_exists($student, 'Fecha_baja') ? $student->Fecha_baja : null;

                    if (($assignment->Estatus === null || $assignment->Estatus === 'Inactivo') && in_array($studentStatus, ['Activo', 'Baja'], true)) {
                        $updates['Estatus'] = $studentStatus;
                    }

                    if ($assignment->Empresa === null && $studentEmpresa !== null) {
                        $updates['Empresa'] = $studentEmpresa;
                    }

                    if ($assignment->Numero_convenio === null && $studentNumeroConvenio !== null) {
                        $updates['Numero_convenio'] = $studentNumeroConvenio;
                    }

                    if ($assignment->Motivo_baja === null && $studentMotivoBaja !== null) {
                        $updates['Motivo_baja'] = $studentMotivoBaja;
                    }

                    if ($assignment->Fecha_baja === null && $studentFechaBaja !== null) {
                        $updates['Fecha_baja'] = $studentFechaBaja;
                    }

                    if (!empty($updates)) {
                        DB::table('students_period')
                            ->where('id', $assignment->id)
                            ->update($updates);
                    }
                }
            });
        }

        Schema::table('students', function (Blueprint $table) {
            if (Schema::hasColumn('students', 'Fecha_baja')) {
                $table->dropColumn('Fecha_baja');
            }

            if (Schema::hasColumn('students', 'Motivo_baja')) {
                $table->dropColumn('Motivo_baja');
            }

            if (Schema::hasColumn('students', 'Numero_convenio')) {
                $table->dropColumn('Numero_convenio');
            }

            if (Schema::hasColumn('students', 'Empresa')) {
                $table->dropColumn('Empresa');
            }

            if (Schema::hasColumn('students', 'Estatus')) {
                $table->dropIndex(['Estatus']);
                $table->dropColumn('Estatus');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            if (!Schema::hasColumn('students', 'Estatus')) {
                $table->enum('Estatus', ['Activo', 'Inactivo', 'Baja'])
                    ->default('Inactivo')
                    ->after('Telefono')
                    ->index();
            }

            if (!Schema::hasColumn('students', 'Empresa')) {
                $table->string('Empresa')->nullable()->after('Carrera');
            }

            if (!Schema::hasColumn('students', 'Numero_convenio')) {
                $table->string('Numero_convenio')->nullable()->after('Empresa');
            }

            if (!Schema::hasColumn('students', 'Motivo_baja')) {
                $table->text('Motivo_baja')->nullable()->after('Numero_convenio');
            }

            if (!Schema::hasColumn('students', 'Fecha_baja')) {
                $table->date('Fecha_baja')->nullable()->after('Motivo_baja');
            }
        });
    }
};
