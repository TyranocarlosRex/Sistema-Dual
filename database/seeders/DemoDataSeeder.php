<?php

namespace Database\Seeders;

use App\Models\Period;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class DemoDataSeeder extends Seeder
{
    private const PASSWORD = 'password';

    public function run(): void
    {
        DB::transaction(function (): void {
            $now = now();

            $admin = $this->upsertUser('Admin Dual', 'admin@dual.test', 'admin', $now);
            $industrialCoordinator = $this->upsertUser(
                'Coordinador Industrial',
                'coordinador.industrial@dual.test',
                'coordinator',
                $now
            );
            $systemsCoordinator = $this->upsertUser(
                'Coordinador Sistemas',
                'coordinador.sistemas@dual.test',
                'coordinator',
                $now
            );
            $activeStudentUser = $this->upsertUser('Maria Lopez', 'maria.lopez@dual.test', 'student', $now);
            $inactiveStudentUser = $this->upsertUser('Jose Martinez', 'jose.martinez@dual.test', 'student', $now);
            $systemsStudentUser = $this->upsertUser('Sofia Garcia', 'sofia.garcia@dual.test', 'student', $now);
            $droppedStudentUser = $this->upsertUser('Luis Hernandez', 'luis.hernandez@dual.test', 'student', $now);

            $this->upsertAdmin($admin, $now);
            $this->upsertCoordinator(
                $industrialCoordinator,
                'Coordinador',
                'Industrial',
                'Ingenieria Industrial',
                $now
            );
            $this->upsertCoordinator(
                $systemsCoordinator,
                'Coordinador',
                'Sistemas',
                'Ingenieria en Sistemas Computacionales',
                $now
            );

            $activeStudentId = $this->upsertStudent($activeStudentUser, [
                'Nombre' => 'Maria',
                'Apellidos' => 'Lopez',
                'No_control' => 22010001,
                'Semestre' => 8,
                'Direccion' => 'Av. Tecnologico 100',
                'Telefono' => '6621000001',
                'Correo_institucional' => '22010001@tec.test',
                'Carrera' => 'Ingenieria Industrial',
            ], $now);

            $inactiveStudentId = $this->upsertStudent($inactiveStudentUser, [
                'Nombre' => 'Jose',
                'Apellidos' => 'Martinez',
                'No_control' => 22010002,
                'Semestre' => 7,
                'Direccion' => 'Calle Universidad 25',
                'Telefono' => '6621000002',
                'Correo_institucional' => '22010002@tec.test',
                'Carrera' => 'Ingenieria Industrial',
            ], $now);

            $systemsStudentId = $this->upsertStudent($systemsStudentUser, [
                'Nombre' => 'Sofia',
                'Apellidos' => 'Garcia',
                'No_control' => 22010003,
                'Semestre' => 9,
                'Direccion' => 'Calle Software 12',
                'Telefono' => '6621000003',
                'Correo_institucional' => '22010003@tec.test',
                'Carrera' => 'Ingenieria en Sistemas Computacionales',
            ], $now);

            $droppedStudentId = $this->upsertStudent($droppedStudentUser, [
                'Nombre' => 'Luis',
                'Apellidos' => 'Hernandez',
                'No_control' => 22010004,
                'Semestre' => 8,
                'Direccion' => 'Calle Norte 40',
                'Telefono' => '6621000004',
                'Correo_institucional' => '22010004@tec.test',
                'Carrera' => 'Ingenieria Industrial',
            ], $now);

            $closedPeriod = Period::query()->updateOrCreate(
                ['codigo' => '2025-2'],
                [
                    'anio' => 2025,
                    'numero' => 2,
                    'estatus' => Period::ESTATUS_CERRADO,
                    'fecha_inicio' => '2025-08-15',
                    'fecha_fin' => '2025-12-15',
                    'fecha_cierre' => '2025-12-20 18:00:00',
                ]
            );

            $activePeriod = Period::query()->updateOrCreate(
                ['codigo' => '2026-1'],
                [
                    'anio' => 2026,
                    'numero' => 1,
                    'estatus' => Period::ESTATUS_ACTIVO,
                    'fecha_inicio' => '2026-01-15',
                    'fecha_fin' => '2026-06-30',
                    'fecha_cierre' => null,
                ]
            );

            Period::query()->updateOrCreate(
                ['codigo' => '2026-2'],
                [
                    'anio' => 2026,
                    'numero' => 2,
                    'estatus' => Period::ESTATUS_BORRADOR,
                    'fecha_inicio' => '2026-08-15',
                    'fecha_fin' => '2026-12-15',
                    'fecha_cierre' => null,
                ]
            );

            $this->upsertStudentPeriod($activeStudentId, $closedPeriod->id, [
                'Estatus' => 'Activo',
                'Semestre' => 7,
                'Carrera' => 'Ingenieria Industrial',
                'Empresa' => 'Manufactura Norte',
                'Numero_convenio' => 'CV-2025-042',
                'Fecha_alta' => '2025-08-20',
                'Fecha_cierre' => '2025-12-20 18:00:00',
                'Primer_login_at' => '2025-08-21 09:10:00',
                'Ultimo_login_at' => '2025-12-10 17:30:00',
                'Origen_login' => 'login',
            ], $now);

            $this->upsertStudentPeriod($activeStudentId, $activePeriod->id, [
                'Estatus' => 'Activo',
                'Semestre' => 8,
                'Carrera' => 'Ingenieria Industrial',
                'Empresa' => 'Manufactura Norte',
                'Numero_convenio' => 'CV-2026-001',
                'Fecha_alta' => '2026-01-20',
                'Primer_login_at' => '2026-01-21 08:15:00',
                'Ultimo_login_at' => $now,
                'Origen_login' => 'login',
            ], $now);

            $this->upsertStudentPeriod($inactiveStudentId, $activePeriod->id, [
                'Estatus' => 'Inactivo',
                'Semestre' => 7,
                'Carrera' => 'Ingenieria Industrial',
                'Empresa' => null,
                'Numero_convenio' => null,
                'Fecha_alta' => '2026-01-20',
            ], $now);

            $this->upsertStudentPeriod($systemsStudentId, $activePeriod->id, [
                'Estatus' => 'Activo',
                'Semestre' => 9,
                'Carrera' => 'Ingenieria en Sistemas Computacionales',
                'Empresa' => 'Soluciones Digitales del Norte',
                'Numero_convenio' => 'CV-2026-014',
                'Fecha_alta' => '2026-01-22',
                'Primer_login_at' => '2026-01-22 10:00:00',
                'Ultimo_login_at' => $now,
                'Origen_login' => 'login',
            ], $now);

            $this->upsertStudentPeriod($droppedStudentId, $activePeriod->id, [
                'Estatus' => 'Baja',
                'Semestre' => 8,
                'Carrera' => 'Ingenieria Industrial',
                'Empresa' => 'Manufactura Norte',
                'Numero_convenio' => 'CV-2026-009',
                'Motivo_baja' => 'Cambio de residencia',
                'Fecha_baja' => '2026-03-10',
                'Fecha_alta' => '2026-01-20',
            ], $now);

            $inscriptionEvidenceId = $this->upsertEvidence([
                'titulo' => 'Documentos de inscripcion',
                'descripcion' => 'Documentos base para abrir el expediente del alumno.',
                'fecha_limite' => '2026-02-15',
                'tipo' => 'inscripcion',
                'is_active' => true,
                'preserve_submissions_between_periods' => false,
                'created_by' => $admin->id,
            ], $now);

            $programEvidenceId = $this->upsertEvidence([
                'titulo' => 'Seguimiento de programa dual',
                'descripcion' => 'Entregas periodicas del programa dual.',
                'fecha_limite' => '2026-05-30',
                'tipo' => 'programa',
                'is_active' => true,
                'preserve_submissions_between_periods' => true,
                'created_by' => $admin->id,
            ], $now);

            $inscriptionReportId = $this->upsertReport([
                'evidence_id' => $inscriptionEvidenceId,
                'periodo_id' => $activePeriod->id,
                'titulo' => 'Solicitud de inscripcion dual',
                'descripcion' => 'Subir solicitud firmada, INE y kardex actualizado.',
                'has_attachment' => false,
                'attachment_path' => null,
                'created_by' => $admin->id,
            ], $now);

            $currentMonthlyReportId = $this->upsertReport([
                'evidence_id' => $programEvidenceId,
                'periodo_id' => $activePeriod->id,
                'titulo' => 'Reporte mensual 1',
                'descripcion' => 'Describir actividades realizadas durante el primer mes.',
                'has_attachment' => false,
                'attachment_path' => null,
                'created_by' => $admin->id,
            ], $now);

            $companyEvaluationReportId = $this->upsertReport([
                'evidence_id' => $programEvidenceId,
                'periodo_id' => $activePeriod->id,
                'titulo' => 'Evaluacion de empresa',
                'descripcion' => 'Formato de evaluacion emitido por la empresa.',
                'has_attachment' => false,
                'attachment_path' => null,
                'created_by' => $admin->id,
            ], $now);

            $previousMonthlyReportId = $this->upsertReport([
                'evidence_id' => $programEvidenceId,
                'periodo_id' => $closedPeriod->id,
                'titulo' => 'Reporte mensual 1',
                'descripcion' => 'Reporte historico para validar continuidad entre periodos.',
                'has_attachment' => false,
                'attachment_path' => null,
                'created_by' => $admin->id,
            ], $now);

            $this->upsertSubmission($previousMonthlyReportId, $activeStudentId, [
                'evidence_id' => $programEvidenceId,
                'periodo_id' => $closedPeriod->id,
                'file_path' => 'submissions/demo/reporte-mensual-1-2025-22010001.pdf',
                'original_name' => 'reporte-mensual-1-2025.pdf',
                'status' => 'aceptado',
                'feedback' => 'Entrega completa del periodo anterior.',
                'calificacion' => '95.00',
            ], $now);

            $this->upsertSubmission($inscriptionReportId, $activeStudentId, [
                'evidence_id' => $inscriptionEvidenceId,
                'periodo_id' => $activePeriod->id,
                'file_path' => 'submissions/demo/solicitud-inscripcion-22010001.pdf',
                'original_name' => 'solicitud-inscripcion.pdf',
                'status' => 'aceptado',
                'feedback' => 'Documentos validados.',
                'calificacion' => '100.00',
            ], $now);

            $this->upsertSubmission($currentMonthlyReportId, $activeStudentId, [
                'evidence_id' => $programEvidenceId,
                'periodo_id' => $activePeriod->id,
                'file_path' => 'submissions/demo/reporte-mensual-1-22010001.pdf',
                'original_name' => 'reporte-mensual-1.pdf',
                'status' => 'enviado',
                'feedback' => null,
                'calificacion' => null,
            ], $now);

            $this->upsertSubmission($companyEvaluationReportId, $systemsStudentId, [
                'evidence_id' => $programEvidenceId,
                'periodo_id' => $activePeriod->id,
                'file_path' => 'submissions/demo/evaluacion-empresa-22010003.pdf',
                'original_name' => 'evaluacion-empresa.pdf',
                'status' => 'rechazado',
                'feedback' => 'Falta firma del asesor externo.',
                'calificacion' => '70.00',
            ], $now);

            $templateId = $this->upsertDocumentTemplate($admin->id, $now);

            $this->upsertReportGeneratedAttachment($inscriptionReportId, $activeStudentId, $templateId, [
                'periodo_id' => $activePeriod->id,
                'file_path' => 'generated/demo/carta-compromiso-22010001.pdf',
                'original_name' => 'carta-compromiso-22010001.pdf',
                'created_by' => $admin->id,
            ], $now);

            $this->upsertAdvertisement([
                'titulo' => 'Bienvenida al periodo 2026-1',
                'mensaje' => 'El periodo activo ya esta disponible. Revisen sus evidencias pendientes.',
                'target_role' => 'all',
                'target_carrera' => null,
                'visible_from' => $now->copy()->subDays(5),
                'attachment_path' => null,
                'created_by' => $admin->id,
            ], $now);

            $this->upsertAdvertisement([
                'titulo' => 'Revision de convenios Industrial',
                'mensaje' => 'Los alumnos de Ingenieria Industrial deben confirmar empresa y numero de convenio.',
                'target_role' => 'student',
                'target_carrera' => 'Ingenieria Industrial',
                'visible_from' => $now->copy()->subDay(),
                'attachment_path' => null,
                'created_by' => $admin->id,
            ], $now);
        });
    }

    private function upsertUser(string $name, string $email, string $role, Carbon $now): User
    {
        DB::table('users')->updateOrInsert(
            ['email' => $email],
            [
                'name' => $name,
                'email_verified_at' => $now,
                'password' => Hash::make(self::PASSWORD),
                'role' => $role,
                'created_at' => $now,
                'updated_at' => $now,
            ]
        );

        return User::query()->where('email', $email)->firstOrFail();
    }

    private function upsertAdmin(User $user, Carbon $now): void
    {
        DB::table('admins')->updateOrInsert(
            ['user_id' => $user->id],
            [
                'nombre' => 'Admin',
                'apellidos' => 'Dual',
                'created_at' => $now,
                'updated_at' => $now,
            ]
        );
    }

    private function upsertCoordinator(
        User $user,
        string $nombre,
        string $apellidos,
        string $carrera,
        Carbon $now
    ): void {
        DB::table('coordinators')->updateOrInsert(
            ['user_id' => $user->id],
            [
                'Nombre' => $nombre,
                'Apellidos' => $apellidos,
                'Carrera' => $carrera,
                'created_at' => $now,
                'updated_at' => $now,
            ]
        );
    }

    /**
     * @param array{
     *     Nombre: string,
     *     Apellidos: string,
     *     No_control: int,
     *     Semestre: int,
     *     Direccion: string,
     *     Telefono: string,
     *     Correo_institucional: string,
     *     Carrera: string
     * } $data
     */
    private function upsertStudent(User $user, array $data, Carbon $now): int
    {
        DB::table('students')->updateOrInsert(
            ['No_control' => $data['No_control']],
            [
                'user_id' => $user->id,
                'Nombre' => $data['Nombre'],
                'Apellidos' => $data['Apellidos'],
                'Semestre' => $data['Semestre'],
                'Direccion' => $data['Direccion'],
                'Telefono' => $data['Telefono'],
                'Correo_institucional' => $data['Correo_institucional'],
                'Carrera' => $data['Carrera'],
                'created_at' => $now,
                'updated_at' => $now,
            ]
        );

        return (int) DB::table('students')
            ->where('No_control', $data['No_control'])
            ->value('id');
    }

    /**
     * @param array<string, mixed> $data
     */
    private function upsertStudentPeriod(int $studentId, int $periodId, array $data, Carbon $now): void
    {
        DB::table('students_period')->updateOrInsert(
            [
                'student_id' => $studentId,
                'periodo_id' => $periodId,
            ],
            [
                'Estatus' => $data['Estatus'],
                'Semestre' => $data['Semestre'],
                'Carrera' => $data['Carrera'],
                'Empresa' => $data['Empresa'] ?? null,
                'Numero_convenio' => $data['Numero_convenio'] ?? null,
                'Motivo_baja' => $data['Motivo_baja'] ?? null,
                'Fecha_baja' => $data['Fecha_baja'] ?? null,
                'Fecha_alta' => $data['Fecha_alta'] ?? null,
                'Fecha_cierre' => $data['Fecha_cierre'] ?? null,
                'Primer_login_at' => $data['Primer_login_at'] ?? null,
                'Ultimo_login_at' => $data['Ultimo_login_at'] ?? null,
                'Origen_login' => $data['Origen_login'] ?? null,
                'created_at' => $now,
                'updated_at' => $now,
            ]
        );
    }

    /**
     * @param array<string, mixed> $data
     */
    private function upsertEvidence(array $data, Carbon $now): int
    {
        DB::table('evidences')->updateOrInsert(
            ['titulo' => $data['titulo']],
            [
                'descripcion' => $data['descripcion'],
                'fecha_limite' => $data['fecha_limite'],
                'attachment_path' => $data['attachment_path'] ?? null,
                'tipo' => $data['tipo'],
                'is_active' => $data['is_active'],
                'preserve_submissions_between_periods' => $data['preserve_submissions_between_periods'],
                'created_by' => $data['created_by'],
                'created_at' => $now,
                'updated_at' => $now,
            ]
        );

        return (int) DB::table('evidences')
            ->where('titulo', $data['titulo'])
            ->value('id');
    }

    /**
     * @param array<string, mixed> $data
     */
    private function upsertReport(array $data, Carbon $now): int
    {
        DB::table('reports')->updateOrInsert(
            [
                'periodo_id' => $data['periodo_id'],
                'titulo' => $data['titulo'],
            ],
            [
                'evidence_id' => $data['evidence_id'],
                'descripcion' => $data['descripcion'],
                'has_attachment' => $data['has_attachment'],
                'attachment_path' => $data['attachment_path'],
                'created_by' => $data['created_by'],
                'created_at' => $now,
                'updated_at' => $now,
            ]
        );

        return (int) DB::table('reports')
            ->where('periodo_id', $data['periodo_id'])
            ->where('titulo', $data['titulo'])
            ->value('id');
    }

    /**
     * @param array<string, mixed> $data
     */
    private function upsertSubmission(int $reportId, int $studentId, array $data, Carbon $now): void
    {
        DB::table('submissions')->updateOrInsert(
            [
                'report_id' => $reportId,
                'student_id' => $studentId,
            ],
            [
                'evidence_id' => $data['evidence_id'],
                'periodo_id' => $data['periodo_id'],
                'file_path' => $data['file_path'],
                'original_name' => $data['original_name'],
                'status' => $data['status'],
                'feedback' => $data['feedback'],
                'calificacion' => $data['calificacion'],
                'created_at' => $now,
                'updated_at' => $now,
            ]
        );
    }

    private function upsertDocumentTemplate(int $adminUserId, Carbon $now): int
    {
        $title = 'Carta compromiso dual';

        DB::table('document_templates')->updateOrInsert(
            ['titulo' => $title],
            [
                'descripcion' => 'Plantilla demo para generar carta compromiso por alumno.',
                'header_html' => '<p><strong>Programa Dual</strong></p>',
                'body_html' => '<p>Por medio de la presente, {alumno_nombre_completo} con numero de control {alumno_no_control} participa en el periodo {periodo_codigo} en la empresa {asignacion_empresa}.</p>',
                'footer_html' => '<p>Generado el {fecha_actual}</p>',
                'plain_text' => "Carta compromiso\nAlumno: {alumno_nombre_completo}\nNo. control: {alumno_no_control}\nEmpresa: {asignacion_empresa}",
                'source_filename' => 'carta-compromiso-demo.html',
                'source_extension' => 'html',
                'placeholders' => json_encode([
                    'alumno_nombre_completo',
                    'alumno_no_control',
                    'periodo_codigo',
                    'asignacion_empresa',
                    'fecha_actual',
                ]),
                'created_by' => $adminUserId,
                'updated_by' => $adminUserId,
                'created_at' => $now,
                'updated_at' => $now,
            ]
        );

        return (int) DB::table('document_templates')
            ->where('titulo', $title)
            ->value('id');
    }

    /**
     * @param array<string, mixed> $data
     */
    private function upsertReportGeneratedAttachment(
        int $reportId,
        int $studentId,
        int $templateId,
        array $data,
        Carbon $now
    ): void {
        DB::table('report_generated_attachments')->updateOrInsert(
            [
                'report_id' => $reportId,
                'student_id' => $studentId,
                'document_template_id' => $templateId,
            ],
            [
                'periodo_id' => $data['periodo_id'],
                'file_path' => $data['file_path'],
                'original_name' => $data['original_name'],
                'created_by' => $data['created_by'],
                'created_at' => $now,
                'updated_at' => $now,
            ]
        );
    }

    /**
     * @param array<string, mixed> $data
     */
    private function upsertAdvertisement(array $data, Carbon $now): void
    {
        DB::table('advertisements')->updateOrInsert(
            ['titulo' => $data['titulo']],
            [
                'mensaje' => $data['mensaje'],
                'target_role' => $data['target_role'],
                'target_carrera' => $data['target_carrera'],
                'visible_from' => $data['visible_from'],
                'attachment_path' => $data['attachment_path'],
                'created_by' => $data['created_by'],
                'created_at' => $now,
                'updated_at' => $now,
            ]
        );
    }
}
