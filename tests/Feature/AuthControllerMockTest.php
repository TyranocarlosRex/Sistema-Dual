<?php

namespace Tests\Feature;

use App\Http\Controllers\AuthController;
use App\Http\Requests\Auth\LoginAdminRequest;
use App\Services\Auth\AdminLogin;
use Tests\TestCase;

class AuthControllerMockTest extends TestCase
{
    public function test_login_admin(): void
    {
        $credentials = [
            'email' => 'admin@gmail.com',
            'password' => '6969',
        ];

        $serviceResponse = [
            'access_token' => 'fake-token',
            'token' => 'fake-token',
            'token_type' => 'Bearer',
            'abilities' => ['admin'],
            'user' => [
                'id' => 1,
                'name' => 'Admin',
                'email' => 'admin@gmail.com',
            ],
        ];

        // Stub: fija el valor que devuelve validated() sin ejecutar validacion real.
        $request = new class($credentials) extends LoginAdminRequest {
            public function __construct(private array $payload = [])
            {
            }

            public function validated($key = null, $default = null): array
            {
                return $this->payload;
            }
        };

        // Mock: verifica que el servicio reciba las credenciales esperadas.
        $service = $this->createMock(AdminLogin::class);
        $service->expects($this->once())
            ->method('login')
            ->with($credentials)
            ->willReturn($serviceResponse);

        $response = app(AuthController::class)->loginAdmin($request, $service);

        $this->assertSame(200, $response->getStatusCode());
        $this->assertSame($serviceResponse, $response->getData(true));
    }
}
