<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('evidences', 'fecha_limite')) {
            Schema::table('evidences', function (Blueprint $table) {
                $table->date('fecha_limite')->nullable()->after('descripcion');
            });
        }

        if (Schema::hasColumn('reports', 'fecha_limite')) {
            DB::table('evidences')
                ->orderBy('id')
                ->chunkById(100, function ($evidences) {
                    foreach ($evidences as $evidence) {
                        $fechaLimite = DB::table('reports')
                            ->where('evidence_id', $evidence->id)
                            ->whereNotNull('fecha_limite')
                            ->min('fecha_limite');

                        if ($fechaLimite) {
                            DB::table('evidences')
                                ->where('id', $evidence->id)
                                ->update(['fecha_limite' => $fechaLimite]);
                        }
                    }
                });

            Schema::table('reports', function (Blueprint $table) {
                $table->dropColumn('fecha_limite');
            });
        }
    }

    public function down(): void
    {
        if (!Schema::hasColumn('reports', 'fecha_limite')) {
            Schema::table('reports', function (Blueprint $table) {
                $table->date('fecha_limite')->nullable()->after('descripcion');
            });
        }

        if (Schema::hasColumn('evidences', 'fecha_limite')) {
            DB::table('reports')
                ->orderBy('id')
                ->chunkById(100, function ($reports) {
                    foreach ($reports as $report) {
                        $fechaLimite = DB::table('evidences')
                            ->where('id', $report->evidence_id)
                            ->value('fecha_limite');

                        if ($fechaLimite) {
                            DB::table('reports')
                                ->where('id', $report->id)
                                ->update(['fecha_limite' => $fechaLimite]);
                        }
                    }
                });

            Schema::table('evidences', function (Blueprint $table) {
                $table->dropColumn('fecha_limite');
            });
        }
    }
};
