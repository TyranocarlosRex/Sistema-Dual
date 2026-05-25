<?php

namespace Tests\Unit;

use App\Models\Period;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PeriodModelTest extends TestCase
{
    use RefreshDatabase;

    public function test_allowed_statuses_and_closed_state_are_reported(): void
    {
        $this->assertSame([
            Period::ESTATUS_BORRADOR,
            Period::ESTATUS_ACTIVO,
            Period::ESTATUS_CERRADO,
        ], Period::allowedStatuses());

        $closed = $this->makePeriod(2026, 1, Period::ESTATUS_CERRADO);
        $draft = $this->makePeriod(2026, 2, Period::ESTATUS_BORRADOR);

        $this->assertTrue($closed->isClosed());
        $this->assertFalse($draft->isClosed());
    }

    public function test_current_returns_latest_active_period(): void
    {
        $this->makePeriod(2026, 1, Period::ESTATUS_ACTIVO);
        $expected = $this->makePeriod(2026, 2, Period::ESTATUS_ACTIVO);
        $this->makePeriod(2027, 1, Period::ESTATUS_BORRADOR);

        $this->assertSame($expected->id, Period::current()?->id);
    }

    public function test_active_scope_filters_active_periods(): void
    {
        $active = $this->makePeriod(2026, 1, Period::ESTATUS_ACTIVO);
        $this->makePeriod(2026, 2, Period::ESTATUS_CERRADO);

        $periods = Period::query()->active()->pluck('id')->all();

        $this->assertSame([$active->id], $periods);
    }

    private function makePeriod(int $year, int $number, string $status): Period
    {
        return Period::query()->create([
            'anio' => $year,
            'numero' => $number,
            'codigo' => "{$year}-{$number}",
            'estatus' => $status,
            'fecha_inicio' => "{$year}-01-15",
            'fecha_fin' => "{$year}-06-30",
        ]);
    }
}
