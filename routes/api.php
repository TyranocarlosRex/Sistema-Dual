<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\Api\StudentIndexController;
use App\Http\Controllers\Api\CoordinatorIndexController;
use App\Http\Controllers\AdminControllers\ReportController;
use App\Http\Controllers\AdminControllers\EvidenceController;

Route::prefix('auth')->group(function () {
    Route::post('/login/student', [AuthController::class, 'loginStudent']);
    Route::post('/login/coordinator', [AuthController::class, 'loginCoordinator']);
    Route::post('/login/admin', [AuthController::class, 'loginAdmin']);
});

// Estudiante
Route::middleware(['auth:sanctum', 'abilities:student'])->group(function () {

    // 👇 RUTAS EXCLUSIVAS PARA ALUMNO
    Route::get('/student/evidences', [EvidenceController::class, 'indexForStudent']);

    // si ya tenías estas en otro lado, tráetelas aquí
    Route::get('/student/reports', [ReportController::class, 'indexForStudent']);
    Route::get('/student/reports/{report}/attachment', [ReportController::class, 'downloadAttachment']);
});

// Coordinador
Route::middleware(['auth:sanctum', 'abilities:coordinator'])->group(function () {
    // rutas exclusivas de coordinador...
});

// Admin genérico (si lo necesitas)
Route::middleware(['auth:sanctum', 'abilities:admin'])->group(function () {
    // rutas exclusivas de admin que NO son evidences/reports
});

// Rutas comunes autenticadas
Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('/students', [StudentIndexController::class, 'index']); 
    Route::patch('/students/{student}/estatus', [StudentIndexController::class, 'updateEstatus']); 
    Route::get('/coordinators', [CoordinatorIndexController::class, 'index']);
});

// Admin: gestión de evidences y reports
Route::middleware(['auth:sanctum', 'abilities:admin'])->group(function () {
    // Espacios (evidences) – SOLO admin
    Route::get('/evidences', [EvidenceController::class, 'index']);
    Route::post('/evidences', [EvidenceController::class, 'store']);
    Route::get('/evidences/{evidence}', [EvidenceController::class, 'show']);
    Route::put('/evidences/{evidence}', [EvidenceController::class, 'update']);
    Route::delete('/evidences/{evidence}', [EvidenceController::class, 'destroy']);

    // Reportes (asignaciones) – SOLO admin
    Route::get('/reports', [ReportController::class, 'index']);
    Route::post('/reports', [ReportController::class, 'store']);
    Route::put('/reports/{report}', [ReportController::class, 'update']);
    Route::get('/reports/{report}/attachment', [ReportController::class, 'downloadAttachment']);
});