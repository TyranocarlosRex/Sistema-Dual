<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('evidences', function (Blueprint $table) {
            if (!Schema::hasColumn('evidences', 'is_active')) {
                $table->boolean('is_active')->default(false)->after('tipo');
            }

            if (!Schema::hasColumn('evidences', 'preserve_submissions_between_periods')) {
                $table->boolean('preserve_submissions_between_periods')->default(false)->after('is_active');
            }
        });

        DB::table('evidences')->update(['is_active' => true]);
    }

    public function down(): void
    {
        Schema::table('evidences', function (Blueprint $table) {
            if (Schema::hasColumn('evidences', 'preserve_submissions_between_periods')) {
                $table->dropColumn('preserve_submissions_between_periods');
            }

            if (Schema::hasColumn('evidences', 'is_active')) {
                $table->dropColumn('is_active');
            }
        });
    }
};
