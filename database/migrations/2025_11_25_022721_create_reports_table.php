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
        Schema::create('reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('evidence_id')
            ->nullable()
            ->constrained('evidences')
            ->nullOnDelete();
            $table->string('titulo');
            $table->text('descripcion')->nullable();
            $table->date('fecha_limite')->nullable();
            // Indica si la asignación incluye un archivo base (formato, guía, etc.)
            $table->boolean('has_attachment')->default(false);
            $table->string('attachment_path')->nullable();
            // Usuario (admin) que creó la asignación
            $table->unsignedBigInteger('created_by');  // admin que creó la asignación
            $table->timestamps();
            $table->foreign('created_by')
                ->references('id')
                ->on('users')
                ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reports');
    }
};
