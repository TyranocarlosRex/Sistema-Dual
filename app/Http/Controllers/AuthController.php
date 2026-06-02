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
use App\Support\AuthSessionCookie;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthController extends Controller {
    use ResolvesPeriodContext;

    public function loginStudent(LoginStudentRequest $request, StudentLogin $service) {
        $data = $service->login($request->validated());
        return $this->loginResponse($data);
    }
    public function loginCoordinator(LoginCoordinatorRequest $request, CoordinatorLogin $service) {
        $data = $service->login($request->validated());
        return $this->loginResponse($data);
    }
    public function loginAdmin(LoginAdminRequest $request, AdminLogin $service) {
        $data = $service->login($request->validated());
        return $this->loginResponse($data);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()?->currentAccessToken()?->delete();

        return response()
            ->json(['message' => 'Sesion cerrada'], 200)
            ->cookie(AuthSessionCookie::forget());
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

    private function loginResponse(array $data): JsonResponse
    {
        $token = (string) ($data['access_token'] ?? $data['token'] ?? '');
        $response = response()->json($data, 200);

        return $token === ''
            ? $response
            : $response->cookie(AuthSessionCookie::make($token));
    }
}
