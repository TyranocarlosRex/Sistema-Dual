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
        Schema::create('advertisements', function (Blueprint $table) {
            $table->id();
            $table->string('titulo');
            $table->text('mensaje');
             $table->enum('target_role', ['all', 'student', 'coordinator', 'admin'])
                  ->default('all');
            $table->string('target_carrera')->nullable();
             $table->dateTime('visible_from')->nullable();
             $table->string('attachment_path')->nullable();
              $table->foreignId('created_by')
                  ->constrained('users')
                  ->cascadeOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('advertisements');
    }
};
