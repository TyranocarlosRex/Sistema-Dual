<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\Api\StudentIndexController;
use App\Http\Controllers\Api\CoordinatorIndexController;
use App\Http\Controllers\ReportController;

Route::prefix('auth')->group(function () {
    Route::post('/login/student', [AuthController::class, 'loginStudent']);
    Route::post('/login/coordinator', [AuthController::class, 'loginCoordinator']);
    Route::post('/login/admin', [AuthController::class, 'loginAdmin']);
});

// Estudiante
Route::middleware(['auth:sanctum', 'abilities:student'])->group(function () {
    // rutas exclusivas de estudiante...
});

// Coordinador
Route::middleware(['auth:sanctum', 'abilities:coordinator'])->group(function () {
    // rutas exclusivas de coordinador...
});

// Admin (otras rutas de admin si las agregas después)
Route::middleware(['auth:sanctum', 'abilities:admin'])->group(function () {
    // rutas exclusivas de admin...
});

Route::middleware(['auth:sanctum', 'abilities:admin'])->group(function () {

    // Index protegidos
    Route::get('/students', [StudentIndexController::class, 'index']);
    Route::patch('/students/{student}/estatus', [StudentIndexController::class, 'updateEstatus']);
    Route::get('/coordinators', [CoordinatorIndexController::class, 'index']);

    // Reportes
    Route::get('/reports', [ReportController::class, 'index']);
    Route::post('/reports', [ReportController::class, 'store']);
    Route::get('/reports/{report}/attachment', [ReportController::class, 'downloadAttachment']);
});