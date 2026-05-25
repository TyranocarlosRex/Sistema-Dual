<?php

namespace Tests\Unit;

use App\Http\Resources\CoordinatorResource;
use App\Models\Coordinator;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CoordinatorResourceTest extends TestCase
{
    use RefreshDatabase;

    public function test_coordinator_resource_serializes_identity_email_and_career(): void
    {
        $user = User::factory()->create([
            'email' => 'coordinator-resource@example.test',
            'role' => 'coordinator',
        ]);

        $coordinator = Coordinator::query()->create([
            'user_id' => $user->id,
            'Nombre' => 'Grace',
            'Apellidos' => 'Hopper',
            'Carrera' => 'Ingenieria en Sistemas Computacionales',
        ]);

        $coordinator->load('user');

        $payload = (new CoordinatorResource($coordinator))->toArray(request());

        $this->assertSame($coordinator->id, $payload['id']);
        $this->assertSame('Grace', $payload['Nombre']);
        $this->assertSame('Hopper', $payload['Apellidos']);
        $this->assertSame('coordinator-resource@example.test', $payload['Correo']);
        $this->assertSame('Ingenieria en Sistemas Computacionales', $payload['Carrera']);
    }
}
