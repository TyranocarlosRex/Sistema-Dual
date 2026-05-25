<?php

namespace Tests\Unit;

use App\Models\User;
use App\Services\Auth\LaravelPasswordVerifier;
use App\Services\Auth\LoginResponseFactory;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class RequirementAuthSupportTest extends TestCase
{
    public function test_rf_02_password_verifier_accepts_valid_password_and_rejects_invalid_password(): void
    {
        $verifier = new LaravelPasswordVerifier();
        $hashedPassword = Hash::make('1234');

        $this->assertTrue($verifier->verify('1234', $hashedPassword));
        $this->assertFalse($verifier->verify('0000', $hashedPassword));
    }

    public function test_rf_01_rf_02_login_response_contains_token_abilities_and_user_identity(): void
    {
        $user = new User([
            'name' => 'Administrador Prueba',
            'email' => 'admin@example.test',
            'role' => 'admin',
        ]);
        $user->id = 10;

        $response = (new LoginResponseFactory())->make(
            $user,
            ['admin'],
            'token-de-prueba',
            ['role' => 'admin']
        );

        $this->assertSame('token-de-prueba', $response['access_token']);
        $this->assertSame('token-de-prueba', $response['token']);
        $this->assertSame('Bearer', $response['token_type']);
        $this->assertSame(['admin'], $response['abilities']);
        $this->assertSame('admin', $response['role']);
        $this->assertSame([
            'id' => 10,
            'name' => 'Administrador Prueba',
            'email' => 'admin@example.test',
        ], $response['user']);
    }
}
