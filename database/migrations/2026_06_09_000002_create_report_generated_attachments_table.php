<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('report_generated_attachments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('report_id')->constrained('reports')->cascadeOnDelete();
            $table->foreignId('student_id')->constrained('students')->cascadeOnDelete();
            $table->foreignId('document_template_id')->constrained('document_templates')->cascadeOnDelete();
            $table->foreignId('periodo_id')->nullable()->constrained('periods')->nullOnDelete();
            $table->string('file_path');
            $table->string('original_name');
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['report_id', 'student_id', 'document_template_id'], 'report_student_document_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('report_generated_attachments');
    }
};
