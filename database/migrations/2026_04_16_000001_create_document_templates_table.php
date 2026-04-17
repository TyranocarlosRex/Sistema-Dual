<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('document_templates', function (Blueprint $table) {
            $table->id();
            $table->string('titulo');
            $table->text('descripcion')->nullable();
            $table->longText('header_html')->nullable();
            $table->longText('body_html');
            $table->longText('footer_html')->nullable();
            $table->longText('plain_text')->nullable();
            $table->string('source_filename')->nullable();
            $table->string('source_extension', 20)->nullable();
            $table->json('placeholders')->nullable();
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('document_templates');
    }
};
