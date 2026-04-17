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
        Schema::create('periods', function (Blueprint $table) {
            $table->id();
            $table->unsignedSmallInteger('año');
            $table->unsignedTinyInteger('numero');
            $table->string('codigo', 16)->unique();
            $table->enum('estatus', ['borrador', 'activo', 'cerrado'])->default('borrador')->index();
            $table->date('fecha_inicio')->nullable();
            $table->date('fecha_fin')->nullable();
            $table->timestamp('fecha_cierre')->nullable();
            $table->timestamps();

            $table->unique(['año', 'numero']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('periods');
    }
};
