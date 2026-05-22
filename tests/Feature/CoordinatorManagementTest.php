<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Feature\Concerns\BuildsAcademicScenarios;
use Tests\TestCase;

class CoordinatorManagementTest extends TestCase
{
    use BuildsAcademicScenarios;
    use RefreshDatabase;

    public function test_admin_can_create_and_delete_coordinators(): void
    {
        $admin = $this->makeAdmin([
            'email' => 'coordinator-manager@example.test',
        ]);

        Sanctum::actingAs($admin, ['admin']);

        $response = $this->postJson('/api/coordinators', [
            'nombre' => 'Lucia',
            'apellidos' => 'Soto',
            'correo' => 'lucia.soto@example.test',
            'carrera' => 'Ingenieria Industrial',
            'password' => 'secret123',
        ])
            ->assertCreated()
            ->assertJsonPath('data.Nombre', 'Lucia')
            ->assertJsonPath('data.Apellidos', 'Soto')
            ->assertJsonPath('data.Correo', 'lucia.soto@example.test')
            ->assertJsonPath('data.Carrera', 'Ingenieria Industrial');

        $coordinatorId = $response->json('data.id');
        $userId = User::query()
            ->where('email', 'lucia.soto@example.test')
            ->value('id');

        $this->assertDatabaseHas('users', [
            'id' => $userId,
            'role' => 'coordinator',
        ]);
        $this->assertDatabaseHas('coordinators', [
            'id' => $coordinatorId,
            'user_id' => $userId,
            'Carrera' => 'Ingenieria Industrial',
        ]);

        $this->deleteJson("/api/coordinators/{$coordinatorId}")
            ->assertOk()
            ->assertJsonPath('message', 'Coordinador eliminado');

        $this->assertDatabaseMissing('coordinators', ['id' => $coordinatorId]);
        $this->assertDatabaseMissing('users', ['id' => $userId]);
    }

    public function test_non_admin_role_cannot_manage_coordinators_with_admin_ability(): void
    {
        $student = User::factory()->create(['role' => 'student']);
        $target = $this->makeCoordinator('Ingenieria Mecanica', [
            'email' => 'target-coordinator@example.test',
        ]);

        Sanctum::actingAs($student, ['admin']);

        $this->postJson('/api/coordinators', [
            'nombre' => 'Lucia',
            'apellidos' => 'Soto',
            'correo' => 'lucia.soto@example.test',
            'carrera' => 'Ingenieria Industrial',
            'password' => 'secret123',
        ])
            ->assertForbidden()
            ->assertJsonPath('message', 'No autorizado.');

        $this->deleteJson("/api/coordinators/{$target->coordinator->id}")
            ->assertForbidden()
            ->assertJsonPath('message', 'No autorizado.');

        $this->assertDatabaseHas('coordinators', ['id' => $target->coordinator->id]);
    }
}
