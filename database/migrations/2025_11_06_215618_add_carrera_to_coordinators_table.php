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
        Schema::table('coordinators', function (Blueprint $table) {
            // Ajusta Telefono a VARCHAR(20)
            // Por qué: garantizar formato corto y consistente en BD.
            if (Schema::hasColumn('coordinators', 'Telefono')) {
                $table->string('Telefono', 20)->change();
            }

            // Agrega enum carrera si no existe
            if (!Schema::hasColumn('coordinators', 'Carrera')) {
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
                    'Ingenieria en Gestion Empresarial',
                    'Ingenieria Aeronautica',
                ])->after('Telefono')->index();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('coordinators', function (Blueprint $table) {
            // Revertir Telefono a VARCHAR(255) (ajusta si tu tamaño anterior era otro)
            if (Schema::hasColumn('coordinators', 'Telefono')) {
                $table->string('Telefono', 255)->change();
            }

            // Quitar enum carrera si existe
            if (Schema::hasColumn('coordinators', 'Carrera')) {
                $table->dropIndex('coordinators_Carrera_index');
                $table->dropColumn('Carrera');
            }
        });
    }
};