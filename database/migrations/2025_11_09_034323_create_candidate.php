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
        Schema::create('candidate', function (Blueprint $table) {
                        $table->id();

            // Quien inició sesión (1 a 1)
            $table->foreignId('user_id')->unique()->constrained('users')->onDelete('cascade');

            // Si tu User está ligado a Student, puedes guardar el id:
            $table->foreignId('student_id')->nullable()->constrained('students')->nullOnDelete();

            // Copias para filtros rápidos (opcional pero práctico)
            $table->string('No_control')->nullable()->index();
            $table->string('Apellidos')->nullable()->index();
            $table->string('Nombre')->nullable();
            $table->string('Correo_institucional')->nullable()->index();
            $table->string('Carrera')->nullable()->index();
            $table->tinyInteger('Semestre')->nullable()->index();

            // Estatus binario que pediste
            $table->enum('Estatus', ['Inactivo','Activo'])->default('Inactivo')->index();

            $table->timestamp('first_login_at')->nullable();
            $table->timestamp('last_login_at')->nullable();

            // Origen (por si más adelante agregas otra forma)
            $table->string('origen')->default('login');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('candidate');
    }
};
