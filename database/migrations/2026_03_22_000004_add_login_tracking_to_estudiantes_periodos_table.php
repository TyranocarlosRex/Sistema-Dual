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
        Schema::table('students_period', function (Blueprint $table) {
            if (!Schema::hasColumn('students_period', 'Primer_login_at')) {
                $table->timestamp('Primer_login_at')->nullable()->after('Fecha_cierre');
            }

            if (!Schema::hasColumn('students_period', 'Ultimo_login_at')) {
                $table->timestamp('Ultimo_login_at')->nullable()->after('Primer_login_at');
            }

            if (!Schema::hasColumn('students_period', 'Origen_login')) {
                $table->string('Origen_login')->nullable()->after('Ultimo_login_at');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('students_period', function (Blueprint $table) {
            if (Schema::hasColumn('students_period', 'Origen_login')) {
                $table->dropColumn('Origen_login');
            }

            if (Schema::hasColumn('students_period', 'Ultimo_login_at')) {
                $table->dropColumn('Ultimo_login_at');
            }

            if (Schema::hasColumn('students_period', 'Primer_login_at')) {
                $table->dropColumn('Primer_login_at');
            }
        });
    }
};
