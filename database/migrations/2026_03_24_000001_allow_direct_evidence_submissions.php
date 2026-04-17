<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('submissions', function (Blueprint $table) {
            $table->dropForeign(['report_id']);
            $table->foreignId('evidence_id')
                ->nullable()
                ->after('report_id')
                ->constrained('evidences')
                ->cascadeOnDelete();
            $table->foreignId('periodo_id')
                ->nullable()
                ->after('evidence_id')
                ->constrained('periods')
                ->cascadeOnDelete();
        });

        DB::table('submissions')
            ->whereNotNull('report_id')
            ->orderBy('id')
            ->chunkById(100, function ($submissions) {
                $reportIds = collect($submissions)
                    ->pluck('report_id')
                    ->filter()
                    ->unique()
                    ->values();

                $reports = DB::table('reports')
                    ->whereIn('id', $reportIds)
                    ->get(['id', 'evidence_id', 'periodo_id'])
                    ->keyBy('id');

                foreach ($submissions as $submission) {
                    $report = $reports->get($submission->report_id);

                    if (! $report) {
                        continue;
                    }

                    DB::table('submissions')
                        ->where('id', $submission->id)
                        ->update([
                            'evidence_id' => $report->evidence_id,
                            'periodo_id' => $report->periodo_id,
                        ]);
                }
            });

        Schema::table('submissions', function (Blueprint $table) {
            $table->unsignedBigInteger('report_id')->nullable()->change();
        });

        Schema::table('submissions', function (Blueprint $table) {
            $table->foreign('report_id')
                ->references('id')
                ->on('reports')
                ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        DB::table('submissions')
            ->whereNull('report_id')
            ->delete();

        Schema::table('submissions', function (Blueprint $table) {
            $table->dropForeign(['evidence_id']);
            $table->dropForeign(['periodo_id']);
            $table->dropForeign(['report_id']);
        });

        Schema::table('submissions', function (Blueprint $table) {
            $table->unsignedBigInteger('report_id')->nullable(false)->change();
        });

        Schema::table('submissions', function (Blueprint $table) {
            $table->dropColumn(['evidence_id', 'periodo_id']);
            $table->foreign('report_id')
                ->references('id')
                ->on('reports')
                ->cascadeOnDelete();
        });
    }
};
