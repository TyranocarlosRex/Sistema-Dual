<?php

namespace Tests\Unit;

use App\Models\Advertisement;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class AdvertisementScopeTest extends TestCase
{
    use RefreshDatabase;

    public function test_visible_scope_excludes_future_advertisements(): void
    {
        Carbon::setTestNow('2026-05-25 10:00:00');

        $creator = User::factory()->create(['role' => 'admin']);
        $visibleNow = $this->makeAdvertisement($creator, 'Visible ahora', 'student', null);
        $visiblePast = $this->makeAdvertisement($creator, 'Visible pasado', 'student', '2026-05-24 10:00:00');
        $future = $this->makeAdvertisement($creator, 'Futuro', 'student', '2026-05-26 10:00:00');

        $ids = Advertisement::query()->visibles()->pluck('id')->all();

        $this->assertContains($visibleNow->id, $ids);
        $this->assertContains($visiblePast->id, $ids);
        $this->assertNotContains($future->id, $ids);

        Carbon::setTestNow();
    }

    public function test_role_scope_includes_all_and_requested_role(): void
    {
        $creator = User::factory()->create(['role' => 'admin']);
        $general = $this->makeAdvertisement($creator, 'General', 'all');
        $student = $this->makeAdvertisement($creator, 'Estudiantes', 'student');
        $coordinator = $this->makeAdvertisement($creator, 'Coordinadores', 'coordinator');

        $ids = Advertisement::query()->paraRol('student')->pluck('id')->all();

        $this->assertContains($general->id, $ids);
        $this->assertContains($student->id, $ids);
        $this->assertNotContains($coordinator->id, $ids);
    }

    private function makeAdvertisement(
        User $creator,
        string $title,
        string $role,
        ?string $visibleFrom = null
    ): Advertisement {
        return Advertisement::query()->create([
            'titulo' => $title,
            'mensaje' => 'Mensaje de prueba',
            'target_role' => $role,
            'target_carrera' => null,
            'visible_from' => $visibleFrom,
            'created_by' => $creator->id,
        ]);
    }
}
