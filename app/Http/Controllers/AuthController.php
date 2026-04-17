<?php
namespace App\Http\Controllers;
use App\Http\Requests\Auth\LoginStudentRequest;
use App\Http\Requests\Auth\LoginCoordinatorRequest;
use App\Http\Requests\Auth\LoginAdminRequest;
use App\Http\Controllers\Concerns\ResolvesPeriodContext;
use App\Models\Student;
use App\Models\StudentPeriod;
use App\Models\Submission;
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
    use ResolvesPeriodContext;

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

    public function meCoordinator(Request $request)
    {
        $user = $request->user()->load('coordinator');
        $coordinator = $user->coordinator;

        if (!$coordinator) {
            return response()->json(['message' => 'Coordinador no encontrado'], 404);
        }

        $career = mb_strtolower(trim((string) ($coordinator->Carrera ?? '')));
        if ($career === '') {
            return response()->json(['message' => 'El coordinador no tiene carrera asignada.'], 403);
        }

        $period = $this->resolvePeriodFromRequest($request);

        $studentsQuery = Student::query();

        if ($period) {
            $studentsQuery->whereHas('periodAssignments', function ($q) use ($period, $career) {
                $q->where('periodo_id', $period->id)
                    ->whereRaw('LOWER(Carrera) = ?', [$career]);
            });
        } else {
            $studentsQuery->whereRaw('LOWER(Carrera) = ?', [$career]);
        }

        $studentsCount = (clone $studentsQuery)->count();

        $activeProcesses = $period
            ? StudentPeriod::query()
                ->where('periodo_id', $period->id)
                ->whereRaw('LOWER(Carrera) = ?', [$career])
                ->whereRaw('LOWER(Estatus) = ?', ['activo'])
                ->count()
            : 0;

        $pendingDocuments = Submission::query()
            ->whereNotNull('report_id')
            ->where('status', 'enviado')
            ->when($period, function ($q) use ($period) {
                $q->whereHas('report', function ($qq) use ($period) {
                    $qq->where('periodo_id', $period->id);
                });
            })
            ->whereHas('student.periodAssignments', function ($q) use ($career, $period) {
                if ($period) {
                    $q->where('periodo_id', $period->id);
                }

                $q->whereRaw('LOWER(Carrera) = ?', [$career]);
            })
            ->count();

        return response()->json([
            'user' => [
                'id' => (int) $user->id,
                'name' => (string) $user->name,
                'email' => (string) $user->email,
            ],
            'coordinator' => $coordinator,
            'period' => $period ? [
                'id' => (int) $period->id,
                'codigo' => (string) $period->codigo,
                'estatus' => (string) $period->estatus,
            ] : null,
            'stats' => [
                'students' => $studentsCount,
                'activeProcesses' => $activeProcesses,
                'pendingDocuments' => $pendingDocuments,
            ],
        ], 200);
    }
}
