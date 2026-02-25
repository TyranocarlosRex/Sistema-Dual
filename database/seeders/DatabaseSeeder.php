<?php

namespace Database\Seeders;
/*Este seeder es el encargado de ejecutar los seeders de roles y permisos,
 ademas de crear un usuario de prueba para poder iniciar sesión en la aplicación y 
 probar los permisos asignados a ese usuario.*/

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
        ]);

        $this->call(RolePermissionSeeder::class);
    }
}
