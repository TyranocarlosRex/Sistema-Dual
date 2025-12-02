<?php
namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\Submission;
use App\Models\Report;
use Illuminate\Http\Request;

class StudentDetailsController extends Controller
{
    public function show(Request $request, Student $student)
    {
        // Cargar relaciones básicas del alumno
        $student->load(['user', 'candidate']);

        // 1) Submissions del estudiante con su Report y Evidence
        $submissions = Submission::with(['report.evidence'])
            ->where('student_id', $student->id)
            ->get();

        // 2) Todos los reports (tareas/documentos) que existen en el sistema
        $allReports = Report::with('evidence')->get();

        // 3) IDs de reports que YA tienen submission de este estudiante
        $submittedReportIds = $submissions->pluck('report_id')->unique();

        // 4) Reports faltantes = allReports - submittedReportIds
        $pendingReports = $allReports->whereNotIn('id', $submittedReportIds);

        return response()->json([
            'student' => [
                'id'                   => $student->id,
                'Nombre'               => $student->Nombre,
                'Apellidos'            => $student->Apellidos,
                'No_control'           => $student->No_control,
                'Carrera'              => $student->Carrera,
                'Semestre'             => $student->Semestre,
                'Estatus'              => $student->Estatus,
                'Correo_institucional' => $student->Correo_institucional,
                'Direccion'            => $student->Direccion,
                'Telefono'             => $student->Telefono,
                'user' => $student->user ? [
                    'id'    => $student->user->id,
                    'name'  => $student->user->name,
                    'email' => $student->user->email,
                    'role'  => $student->user->role,
                ] : null,
                'candidate' => $student->candidate ? [
                    'id'             => $student->candidate->id,
                    'origen'         => $student->candidate->origen,
                    'first_login_at' => $student->candidate->first_login_at,
                    'last_login_at'  => $student->candidate->last_login_at,
                ] : null,
            ],

            'documents' => [
                // Documentos ENVIADOS por este estudiante
                'sent' => $submissions->map(function ($sub) {
                    return [
                        'id'            => $sub->id,
                        'status'        => $sub->status,       // enviado / aceptado / rechazado...
                        'feedback'      => $sub->feedback,
                        'calificacion'  => $sub->calificacion,
                        'file_path'     => $sub->file_path,
                        'original_name' => $sub->original_name,
                        'submitted_at'  => $sub->created_at,

                        'report' => $sub->report ? [
                            'id'           => $sub->report->id,
                            'titulo'       => $sub->report->titulo,
                            'descripcion'  => $sub->report->descripcion,
                            'fecha_limite' => $sub->report->fecha_limite,
                            'has_attachment'   => $sub->report->has_attachment,
                            'attachment_path'  => $sub->report->attachment_path,
                            'evidence' => $sub->report->evidence ? [
                                'id'        => $sub->report->evidence->id,
                                'titulo'    => $sub->report->evidence->titulo,
                                'tipo'      => $sub->report->evidence->tipo,
                            ] : null,
                        ] : null,
                    ];
                })->values(),

                // Documentos/Reportes PENDIENTES (no tienen submission del alumno)
                'missing' => $pendingReports->map(function ($rep) {
                    return [
                        'id'           => $rep->id,
                        'titulo'       => $rep->titulo,
                        'descripcion'  => $rep->descripcion,
                        'fecha_limite' => $rep->fecha_limite,
                        'evidence' => $rep->evidence ? [
                            'id'     => $rep->evidence->id,
                            'titulo' => $rep->evidence->titulo,
                            'tipo'   => $rep->evidence->tipo,
                        ] : null,
                    ];
                })->values(),
            ],
        ]);
    }
}
