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
        Schema::create('submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('report_id')
                ->constrained('reports')
                ->cascadeOnDelete();
            $table->foreignId('student_id')
                ->constrained('students')
                ->cascadeOnDelete();
            $table->string('file_path');        // ruta en storage
            $table->string('original_name');    // nombre original del archivo
            $table->enum('status', ['enviado', 'aceptado', 'rechazado'])
                  ->default('enviado');
            $table->text('feedback')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('submissions');
    }
};
