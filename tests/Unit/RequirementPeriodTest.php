<?php

namespace Tests\Unit;

use App\Models\Period;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RequirementPeriodTest extends TestCase
{
    use RefreshDatabase;

    public function test_rf_12_rf_15_period_model_exposes_allowed_statuses_and_closed_state(): void
    {
        $closedPeriod = Period::query()->create([
            'anio' => 2026,
            'numero' => 1,
            'codigo' => '2026-1',
            'estatus' => Period::ESTATUS_CERRADO,
            'fecha_inicio' => '2026-01-15',
            'fecha_fin' => '2026-06-30',
        ]);

        $this->assertSame([
            Period::ESTATUS_BORRADOR,
            Period::ESTATUS_ACTIVO,
            Period::ESTATUS_CERRADO,
        ], Period::allowedStatuses());
        $this->assertTrue($closedPeriod->isClosed());
        $this->assertSame(2026, $closedPeriod->anio);
    }

    public function test_rf_12_rf_15_period_model_returns_latest_active_period(): void
    {
        Period::query()->create([
            'anio' => 2025,
            'numero' => 2,
            'codigo' => '2025-2',
            'estatus' => Period::ESTATUS_ACTIVO,
            'fecha_inicio' => '2025-08-15',
            'fecha_fin' => '2025-12-15',
        ]);

        $latest = Period::query()->create([
            'anio' => 2026,
            'numero' => 1,
            'codigo' => '2026-1',
            'estatus' => Period::ESTATUS_ACTIVO,
            'fecha_inicio' => '2026-01-15',
            'fecha_fin' => '2026-06-30',
        ]);

        Period::query()->create([
            'anio' => 2026,
            'numero' => 2,
            'codigo' => '2026-2',
            'estatus' => Period::ESTATUS_BORRADOR,
            'fecha_inicio' => '2026-08-15',
            'fecha_fin' => '2026-12-15',
        ]);

        $this->assertSame($latest->id, Period::current()?->id);
    }
}
