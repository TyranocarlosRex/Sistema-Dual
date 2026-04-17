<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\Api\StudentIndexController;
use App\Http\Controllers\Api\CoordinatorIndexController;
use App\Http\Controllers\AdminControllers\PeriodController;
use App\Http\Controllers\AdminControllers\ReportController;
use App\Http\Controllers\AdminControllers\EvidenceController;
use App\Http\Controllers\AdminControllers\DocumentImportController;
use App\Http\Controllers\AdminControllers\DocumentTemplateGenerationController;
use App\Http\Controllers\AdminControllers\DocumentTemplateController;
use App\Http\Controllers\SubmissionController;
use App\Http\Controllers\AdminControllers\AdvertisementController;
use App\Http\Controllers\StudentDetailsController;
/*En este archivo se definen las rutas de la API para la aplicaciÃƒÆ’Ã‚Â³n.
 Se organizan en grupos segÃƒÆ’Ã‚Âºn el rol del usuario (estudiante, coordinador, admin) y se 
 aplican middleware de autenticaciÃƒÆ’Ã‚Â³n y autorizaciÃƒÆ’Ã‚Â³n para proteger las rutas.
 Cada ruta estÃƒÆ’Ã‚Â¡ asociada a un controlador especÃƒÆ’Ã‚Â­fico que maneja la lÃƒÆ’Ã‚Â³gica de la solicitud. P
 or ejemplo, las rutas de autenticaciÃƒÆ’Ã‚Â³n permiten a los usuarios iniciar sesiÃƒÆ’Ã‚Â³n, mientras que 
 las rutas de estudiantes, coordinadores y admin permiten acceder a funcionalidades especÃƒÆ’Ã‚Â­ficas
  segÃƒÆ’Ã‚Âºn el rol del usuario.*/
Route::prefix('auth')->group(function () {
    Route::post('/login/student', [AuthController::class, 'loginStudent']);
    Route::post('/login/coordinator', [AuthController::class, 'loginCoordinator']);
    Route::post('/login/admin', [AuthController::class, 'loginAdmin']);
});

// Estudiante
Route::middleware(['auth:sanctum', 'abilities:student'])->group(function () {

    Route::get('/student/me', [StudentDetailsController::class, 'me']);
    Route::patch('/student/me', [StudentDetailsController::class, 'updateOwnProfile']);
    Route::get('/student/evidences', [EvidenceController::class, 'indexForStudent']);
    Route::get('/student/reports', [ReportController::class, 'indexForStudent']);
    Route::get('/student/reports/{report}/attachment', [ReportController::class, 'downloadAttachment']);
    Route::post('/student/reports/{report}/submit',[SubmissionController::class, 'storeForStudent']);
});

// Coordinador (y admin puede ver detalles de estudiantes)
Route::middleware(['auth:sanctum', 'ability:coordinator,admin'])->group(function () {
    Route::get('/coordinator/report-submissions',[SubmissionController::class, 'indexForStaff']);
    Route::get('/coordinator/report-submissions/{submission}/download',[SubmissionController::class, 'download']);
    Route::patch('/coordinator/report-submissions/{submission}',[SubmissionController::class, 'updateStatus']);
    Route::get('/students/{student}/details', [StudentDetailsController::class, 'show']);
});
// Admin generico
Route::middleware(['auth:sanctum', 'abilities:admin'])->group(function () {
    Route::get('/admin/me', [AuthController::class, 'meAdmin']);
});

Route::middleware(['auth:sanctum', 'abilities:coordinator'])->group(function () {
    Route::get('/coordinator/me', [AuthController::class, 'meCoordinator']);
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

    Route::post('/document-imports', [DocumentImportController::class, 'store']);
    Route::get('/document-generations/options', [DocumentTemplateGenerationController::class, 'options']);
    Route::get('/documents', [DocumentTemplateController::class, 'index']);
    Route::post('/documents', [DocumentTemplateController::class, 'store']);
    Route::get('/documents/{document}', [DocumentTemplateController::class, 'show']);
    Route::put('/documents/{document}', [DocumentTemplateController::class, 'update']);
    Route::delete('/documents/{document}', [DocumentTemplateController::class, 'destroy']);
    Route::post('/documents/{document}/generate', [DocumentTemplateGenerationController::class, 'generate']);
    Route::post('/documents/{document}/download-pdf', [DocumentTemplateGenerationController::class, 'downloadPdf']);

    Route::get('/periods', [PeriodController::class, 'index']);
    Route::get('/periods/{period}', [PeriodController::class, 'show']);
    Route::get('/periods/{period}/statistics', [PeriodController::class, 'statistics']);
    Route::post('/periods', [PeriodController::class, 'store']);
    Route::put('/periods/{period}', [PeriodController::class, 'update']);
    Route::post('/periods/{period}/activate', [PeriodController::class, 'activate']);
    Route::post('/periods/{period}/close', [PeriodController::class, 'close']);
    Route::post('/periods/{period}/students/sync', [PeriodController::class, 'syncStudents']);
    Route::post('/periods/{period}/students/clone', [PeriodController::class, 'cloneStudents']);

    Route::get('/admin/report-submissions',[SubmissionController::class, 'indexForStaff']);
    Route::get('/admin/report-submissions/{submission}/download',[SubmissionController::class, 'download']);
    Route::patch('/admin/report-submissions/{submission}',[SubmissionController::class, 'updateStatus']);

});
// Anuncios: lectura para cualquier rol autenticado, publicaciÃƒÆ’Ã‚Â³n para admin/coordinador
Route::middleware(['auth:sanctum', 'ability:admin,coordinator'])->post(
    '/advertisements',
    [AdvertisementController::class, 'store']
);




