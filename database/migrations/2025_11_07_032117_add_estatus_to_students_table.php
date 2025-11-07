<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('students', function (Blueprint $table) {
            if (Schema::hasColumn('students', 'Telefono')) {
                $table->string('Telefono', 20)->nullable()->change();
            }

            if (!Schema::hasColumn('students', 'Estatus')) {
                $table->enum('Estatus', ['Activo', 'Inactivo'])
                      ->default('Inactivo')
                      ->after('Telefono')
                      ->index();
            }

            if (!Schema::hasColumn('students', 'Carrera')) {
                $table->enum('Carrera', [
                    'Ingenieria Biomedica',
                    'Ingenieria Electrica',
                    'Ingenieria Electronica',
                    'Ingenieria Industrial',
                    'Ingenieria Mecanica',
                    'Ingenieria Mecatronica',
                    'Licenciatura en Administracion',
                    'Ingenieria en Sistemas Computacionales',
                    'Ingenieria Informatica',
                    'Ingenieria en Gestión Empresarial',
                    'Ingenieria Aeronautica',
                ])->after('Estatus')->index();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            if (Schema::hasColumn('students', 'Carrera')) {
                // Nombre de índice por convención
                $table->dropIndex('students_Carrera_index');
                $table->dropColumn('Carrera');
            }

            // Revertir estatus
            if (Schema::hasColumn('students', 'Estatus')) {
                $table->dropIndex('students_Estatus_index');
                $table->dropColumn('Estatus');
            }

            // Revertir Telefono a integer nullable (como estaba en tu create)
            if (Schema::hasColumn('students', 'Telefono')) {
                $table->integer('Telefono')->nullable()->change();
            }
        });
    }
};
