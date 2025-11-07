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
                ])->after('Apellidos')->index();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('coordinators', function (Blueprint $table) { 
            // Quitar enum carrera si existe
            if (Schema::hasColumn('coordinators', 'Carrera')) {
                $table->dropIndex('coordinators_Carrera_index');
                $table->dropColumn('Carrera');
            }
        });
    }
};