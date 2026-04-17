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
        Schema::create('students_period', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->cascadeOnDelete();
            $table->foreignId('periodo_id')->constrained('periods')->cascadeOnDelete();
            $table->enum('Estatus', ['Activo', 'Inactivo', 'Baja'])->default('Inactivo')->index();
            $table->unsignedTinyInteger('Semestre')->nullable();
            $table->string('Carrera')->nullable();
            $table->string('Empresa')->nullable();
            $table->string('Numero_convenio')->nullable();
            $table->text('Motivo_baja')->nullable();
            $table->date('Fecha_baja')->nullable();
            $table->date('Fecha_alta')->nullable();
            $table->timestamp('Fecha_cierre')->nullable();
            $table->timestamps();

            $table->unique(['student_id', 'periodo_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('students_period');
    }
};
