<?php


use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\Api\StudentIndexController;
use App\Http\Controllers\Api\CoordinatorIndexController;

Route::prefix('auth')->group(function () {
    Route::post('/login/student', [AuthController::class, 'loginStudent']);
    Route::post('/login/coordinator', [AuthController::class, 'loginCoordinator']);
    Route::post('/login/admin', [AuthController::class, 'loginAdmin']);
});

// (Opcional) grupos por rol si luego agregas más rutas por rol
Route::middleware(['auth:sanctum','ability:student'])->group(function () {
    // rutas exclusivas de estudiante...
});

Route::middleware(['auth:sanctum','ability:coordinator'])->group(function () {
    // rutas exclusivas de coordinador...
});

Route::middleware(['auth:sanctum','ability:admin'])->group(function () {
    // rutas exclusivas de admin...
});

Route::get('/students', [StudentIndexController::class, 'index']);
Route::patch('/students/{student}/estatus', [StudentIndexController::class, 'updateEstatus']);
Route::get('/coordinators', [CoordinatorIndexController::class, 'index']);