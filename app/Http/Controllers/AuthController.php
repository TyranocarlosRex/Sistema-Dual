<?php
namespace App\Http\Controllers;
use App\Http\Requests\Auth\LoginStudentRequest;
use App\Http\Requests\Auth\LoginCoordinatorRequest;
use App\Http\Requests\Auth\LoginAdminRequest;
use App\Services\Auth\StudentLogin;
use App\Services\Auth\CoordinatorLogin;
use App\Services\Auth\AdminLogin;
use Illuminate\Http\Request;

/*La clase AuthController maneja la autenticación para estudiantes, coordinadores y administradores, 
    así como la obtención de información del administrador autenticado.

    - loginStudent: Maneja el inicio de sesión para estudiantes.
    - loginCoordinator: Maneja el inicio de sesión para coordinadores.
    - loginAdmin: Maneja el inicio de sesión para administradores.
    - meAdmin: Devuelve la información del administrador autenticado, incluyendo detalles del usuario y del administrador.*/
    
class AuthController extends Controller {
    public function loginStudent(LoginStudentRequest $request, StudentLogin $service) {
        $data = $service->login($request->validated());
        return response()->json($data, 200);
    }
    public function loginCoordinator(LoginCoordinatorRequest $request, CoordinatorLogin $service) {
        $data = $service->login($request->validated());
        return response()->json($data, 200);
    }
    public function loginAdmin(LoginAdminRequest $request, AdminLogin $service) {
        $data = $service->login($request->validated());
        return response()->json($data, 200);
    }

    public function meAdmin(Request $request) {
        $user = $request->user()->load('admin');
        $admin = $user->admin;

        if (!$admin) {
            return response()->json(['message' => 'Administrador no encontrado'], 404);
        }

        return response()->json([
            'user' => [
                'id'    => (int)$user->id,
                'name'  => (string)$user->name,
                'email' => (string)$user->email,
            ],
            'admin' => [
                'id'          => (int)$admin->id,
                'user_id'     => (int)$admin->user_id,
                'name'        => trim((string)($admin->nombre ?? '')) !== ''
                    ? trim($admin->nombre . ' ' . ($admin->apellidos ?? ''))
                    : (string)$user->name,
                'first_name'  => $admin->nombre ?? null,
                'last_name'   => $admin->apellidos ?? null,
            ],
        ], 200);
    }
}
