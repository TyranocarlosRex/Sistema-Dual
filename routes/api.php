<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\Api\StudentIndexController;
use App\Http\Controllers\Api\CoordinatorIndexController;
use App\Http\Controllers\AdminControllers\ReportController;
use App\Http\Controllers\AdminControllers\EvidenceController;
use App\Http\Controllers\SubmissionController;
use App\Http\Controllers\AdminControllers\AdvertisementController;
use App\Http\Controllers\StudentDetailsController;

Route::prefix('auth')->group(function () {
    Route::post('/login/student', [AuthController::class, 'loginStudent']);
    Route::post('/login/coordinator', [AuthController::class, 'loginCoordinator']);
    Route::post('/login/admin', [AuthController::class, 'loginAdmin']);
});

// Estudiante
Route::middleware(['auth:sanctum', 'abilities:student'])->group(function () {

    Route::get('/student/evidences', [EvidenceController::class, 'indexForStudent']);
    Route::get('/student/reports', [ReportController::class, 'indexForStudent']);
    Route::get('/student/reports/{report}/attachment', [ReportController::class, 'downloadAttachment']);
    Route::post('/student/reports/{report}/submit',[SubmissionController::class, 'storeForStudent']);
});

// Coordinador
Route::middleware(['auth:sanctum', 'abilities:coordinator'])->group(function () {
    Route::get('/coordinator/report-submissions',[SubmissionController::class, 'indexForStaff']);
    Route::get('/coordinator/report-submissions/{submission}/download',[SubmissionController::class, 'download']);
    Route::patch('/coordinator/report-submissions/{submission}',[SubmissionController::class, 'updateStatus']);
    Route::get('/students/{student}/details', [StudentDetailsController::class, 'show']);
});

// Admin generico
Route::middleware(['auth:sanctum', 'abilities:admin'])->group(function () {
    Route::get('/admin/me', [AuthController::class, 'meAdmin']);
});

// Rutas comunes autenticadas
Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('/students', [StudentIndexController::class, 'index']); 
    Route::patch('/students/{student}/estatus', [StudentIndexController::class, 'updateEstatus']); 
    Route::get('/coordinators', [CoordinatorIndexController::class, 'index']);
    Route::get('/advertisements', [AdvertisementController::class, 'index']);
});

// Admin: evidences y reports
Route::middleware(['auth:sanctum', 'abilities:admin'])->group(function () {
    // Espacios (evidences)
    Route::get('/evidences', [EvidenceController::class, 'index']);
    Route::post('/evidences', [EvidenceController::class, 'store']);
    Route::get('/evidences/{evidence}', [EvidenceController::class, 'show']);
    Route::put('/evidences/{evidence}', [EvidenceController::class, 'update']);
    Route::delete('/evidences/{evidence}', [EvidenceController::class, 'destroy']);

    // Reportes (asignaciones)
    Route::get('/reports', [ReportController::class, 'index']);
    Route::post('/reports', [ReportController::class, 'store']);
    Route::put('/reports/{report}', [ReportController::class, 'update']);
    Route::delete('/reports/{report}', [ReportController::class, 'destroy']);
    Route::get('/reports/{report}/attachment', [ReportController::class, 'downloadAttachment']);

    Route::get('/admin/report-submissions',[SubmissionController::class, 'indexForStaff']);
    Route::get('/admin/report-submissions/{submission}/download',[SubmissionController::class, 'download']);
    Route::patch('/admin/report-submissions/{submission}',[SubmissionController::class, 'updateStatus']);

});

// Anuncios: lectura para cualquier rol autenticado, publicación para admin/coordinador
Route::middleware(['auth:sanctum', 'ability:admin,coordinator'])->post(
    '/advertisements',
    [AdvertisementController::class, 'store']
);
