export const USERS = {
    admin: {
        email: 'administrativo@gmail.com',
        password: '1234',
    },
    coordinator: {
        email: 'coordinador@gmail.com',
        password: '1234',
    },
    student: {
        noControl: '22330406',
        password: '1234',
    },
};

const adminUser = {
    id: 900,
    name: 'Administrativo E2E',
    email: USERS.admin.email,
};

const coordinatorUser = {
    id: 901,
    name: 'Coordinador E2E',
    email: USERS.coordinator.email,
};

const studentUser = {
    id: 902,
    name: 'Estudiante E2E',
    email: 'estudiante@gmail.com',
};

const admin = {
    id: 1,
    name: 'Administrativo E2E',
    first_name: 'Administrativo',
};

const coordinator = {
    id: 2,
    Nombre: 'Coordinador',
    Apellidos: 'E2E',
    Correo: USERS.coordinator.email,
    Carrera: 'Ingenieria en Sistemas Computacionales',
};

const student = {
    id: 1,
    Nombre: 'Carlos',
    Apellidos: 'Perez',
    No_control: USERS.student.noControl,
    Correo: 'estudiante@gmail.com',
    Correo_institucional: 'estudiante@tec.test',
    Carrera: 'Ingenieria en Sistemas Computacionales',
    Semestre: 8,
    Telefono: '',
    Direccion: '',
    Estatus: 'Activo',
    Empresa: 'Sistemas del Norte',
    Numero_convenio: 'CV-2026-001',
};

export function createMockState() {
    const reports = [
        {
            id: 101,
            evidence_id: 11,
            titulo: 'Reporte bimestral 1',
            descripcion: 'Formato de avance del primer bimestre.',
            tipo: 'programa',
            has_attachment: true,
            attachment_original_name: 'formato-reporte.pdf',
            submissions: [],
        },
        {
            id: 102,
            evidence_id: 11,
            titulo: 'Reporte bimestral 2',
            descripcion: 'Seguimiento del segundo bimestre.',
            tipo: 'programa',
            has_attachment: false,
            submissions: [
                {
                    id: 501,
                    report_id: 102,
                    student_id: student.id,
                    status: 'enviado',
                    original_name: 'reporte-b2.pdf',
                    calificacion: null,
                    feedback: '',
                },
            ],
        },
    ];

    const evidences = [
        {
            id: 11,
            titulo: 'Reportes bimestrales',
            tipo: 'programa',
            descripcion: 'Entregables del programa dual.',
            fecha_limite: '2026-07-10',
            reports: reports.map((report) => ({ ...report })),
        },
        {
            id: 12,
            titulo: 'Inscripcion',
            tipo: 'inscripcion',
            descripcion: 'Documentos de inicio del programa.',
            fecha_limite: '2026-06-10',
            reports: [],
        },
    ];

    return {
        admin: { ...admin },
        coordinator: { ...coordinator },
        student: { ...student },
        students: [
            {
                ...student,
                periodo: { id: 1, codigo: '2026-1' },
                assigned_reports_count: 2,
                submitted_reports_count: 1,
                progress_percent: 50,
            },
            {
                id: 2,
                Nombre: 'Ana',
                Apellidos: 'Lopez',
                No_control: '22330077',
                Correo: 'ana@example.test',
                Carrera: 'Ingenieria Industrial',
                Semestre: 7,
                Estatus: 'Inactivo',
                periodo: { id: 1, codigo: '2026-1' },
                assigned_reports_count: 1,
                submitted_reports_count: 0,
                progress_percent: 0,
            },
        ],
        coordinators: [{ ...coordinator }],
        periods: [
            {
                id: 1,
                codigo: '2026-1',
                anio: 2026,
                numero: 1,
                estatus: 'activo',
                fecha_inicio: '2026-01-15',
                fecha_fin: '2026-06-30',
                fecha_cierre: null,
                students_count: 2,
                active_students_count: 1,
                inactive_students_count: 1,
                dropped_students_count: 0,
                reports_count: 2,
                submissions_count: 1,
                created_at: '2026-01-10T10:00:00Z',
            },
            {
                id: 2,
                codigo: '2025-2',
                anio: 2025,
                numero: 2,
                estatus: 'cerrado',
                fecha_inicio: '2025-08-15',
                fecha_fin: '2025-12-15',
                fecha_cierre: '2025-12-20',
                students_count: 3,
                active_students_count: 2,
                inactive_students_count: 0,
                dropped_students_count: 1,
                reports_count: 4,
                submissions_count: 8,
                created_at: '2025-08-01T10:00:00Z',
            },
        ],
        evidences,
        reports,
        submissions: [
            {
                id: 501,
                report_id: 102,
                report: { id: 102, titulo: 'Reporte bimestral 2', evidence: { titulo: 'Reportes bimestrales' } },
                student: { ...student },
                status: 'enviado',
                original_name: 'reporte-b2.pdf',
                calificacion: null,
                feedback: '',
                created_at: '2026-05-20T10:00:00Z',
            },
        ],
        historicalSubmissions: [
            {
                id: 502,
                report_id: 91,
                periodo_id: 2,
                report: {
                    id: 91,
                    titulo: 'Plan de actividades anterior',
                    descripcion: 'Formato de avance del periodo anterior.',
                    evidence: {
                        id: 11,
                        titulo: 'Reportes bimestrales',
                        tipo: 'programa',
                        descripcion: 'Entregables del programa dual.',
                    },
                    period: { id: 2, codigo: '2025-2' },
                },
                period: { id: 2, codigo: '2025-2' },
                student: { ...student },
                status: 'aceptado',
                original_name: 'plan-periodo-anterior.pdf',
                calificacion: 95,
                feedback: '',
                created_at: '2025-11-20T10:00:00Z',
            },
            {
                id: 503,
                report_id: 92,
                periodo_id: 2,
                report: {
                    id: 92,
                    titulo: 'Cierre anterior',
                    descripcion: 'Entrega final del periodo anterior.',
                    evidence: {
                        id: 11,
                        titulo: 'Reportes bimestrales',
                        tipo: 'programa',
                        descripcion: 'Entregables del programa dual.',
                    },
                    period: { id: 2, codigo: '2025-2' },
                },
                period: { id: 2, codigo: '2025-2' },
                student: { ...student },
                status: 'aceptado',
                original_name: 'cierre-periodo-anterior.pdf',
                calificacion: 98,
                feedback: '',
                created_at: '2025-12-10T10:00:00Z',
            },
        ],
        documents: [
            {
                id: 31,
                titulo: 'Carta de presentacion E2E',
                descripcion: 'Plantilla base para empresas.',
                header_html: '<p>Instituto Tecnologico</p>',
                body_html: '<p>Alumno: {alumno_nombre}</p>',
                footer_html: '<p>Educacion Dual</p>',
                source_filename: 'carta.txt',
                source_extension: 'txt',
                lines: 2,
                characters: 90,
                placeholders: ['alumno_nombre'],
                updated_at: '2026-05-20T10:00:00Z',
            },
        ],
        advertisements: [
            {
                id: 71,
                titulo: 'Convocatoria dual',
                mensaje: 'Revisar fechas del periodo activo.',
                target_role: 'student',
                target_carrera: null,
                visible_from: null,
                attachment_path: null,
                created_at: '2026-05-19T10:00:00Z',
            },
        ],
        nextIds: {
            evidence: 100,
            report: 200,
            period: 300,
            document: 400,
            advertisement: 500,
            submission: 600,
        },
        calls: [],
    };
}

export async function seedSession(page, role) {
    const session = buildSession(role);

    await page.addInitScript(({ activeSession }) => {
        localStorage.clear();
        localStorage.setItem('token', activeSession.token);
        localStorage.setItem('user', JSON.stringify(activeSession.user));
        localStorage.setItem(activeSession.role, JSON.stringify(activeSession.profile));
    }, { activeSession: session });
}

export async function mockSystemApi(page, state = createMockState()) {
    await page.route('**/api/**', async (route) => {
        const request = route.request();
        const method = request.method();
        const url = new URL(request.url());
        const path = url.pathname;

        state.calls.push({ method, path, search: url.search, body: request.postData() });

        if (path === '/api/logout' && method === 'POST') {
            return json(route, { message: 'Sesion cerrada' });
        }

        if (path.startsWith('/api/auth/login/') && method === 'POST') {
            return handleLogin(route, request, path);
        }

        if (path === '/api/admin/me' && method === 'GET') {
            return json(route, { user: adminUser, admin: state.admin });
        }

        if (path === '/api/coordinator/me' && method === 'GET') {
            return json(route, {
                user: coordinatorUser,
                coordinator: state.coordinator,
                stats: {
                    students: 2,
                    activeProcesses: 1,
                    pendingDocuments: 1,
                },
            });
        }

        if (path === '/api/student/me' && method === 'GET') {
            return json(route, { user: studentUser, student: state.student });
        }

        if (path === '/api/student/me' && method === 'PATCH') {
            const body = parseJsonBody(request);
            state.student = {
                ...state.student,
                Telefono: body.telefono ?? state.student.Telefono,
                Direccion: body.direccion ?? state.student.Direccion,
            };
            return json(route, { student: state.student });
        }

        if (path === '/api/student/evidences' && method === 'GET') {
            return json(route, state.evidences);
        }

        if (path === '/api/student/submissions/history' && method === 'GET') {
            return json(route, state.historicalSubmissions);
        }

        if (/^\/api\/student\/submissions\/\d+\/download$/.test(path) && method === 'GET') {
            const id = Number(path.match(/\d+/)?.[0]);
            const submission = state.historicalSubmissions.find((item) => Number(item.id) === id);
            return pdf(route, submission?.original_name || 'entrega-anterior.pdf');
        }

        if (/^\/api\/student\/reports\/\d+\/attachment$/.test(path) && method === 'GET') {
            return pdf(route, 'formato-reporte.pdf');
        }

        if (/^\/api\/student\/reports\/\d+\/submit$/.test(path) && method === 'POST') {
            const reportId = Number(path.match(/\d+/)?.[0]);
            const raw = request.postData() ?? '';

            if (raw.includes('evidencia.txt')) {
                return json(route, { message: 'El archivo debe ser PDF y pesar maximo 4 MB.' }, 422);
            }

            const submission = {
                id: state.nextIds.submission++,
                report_id: reportId,
                student_id: state.student.id,
                status: 'enviado',
                original_name: raw.includes('evidencia-final.pdf') ? 'evidencia-final.pdf' : 'reporte.pdf',
                calificacion: null,
                feedback: '',
            };

            upsertSubmission(state, submission);
            return json(route, submission, 201);
        }

        if (path === '/api/students' && method === 'GET') {
            return json(route, { data: state.students, total: state.students.length });
        }

        if (path === '/api/coordinators' && method === 'GET') {
            return json(route, { data: state.coordinators, total: state.coordinators.length });
        }

        if (path === '/api/coordinators' && method === 'POST') {
            const created = {
                id: state.coordinators.length + 10,
                Nombre: 'Nuevo',
                Apellidos: 'Coordinador',
                Correo: 'nuevo.coordinador@example.test',
                Carrera: 'Ingenieria en Sistemas Computacionales',
            };
            state.coordinators.push(created);
            return json(route, created, 201);
        }

        if (/^\/api\/coordinators\/\d+$/.test(path) && method === 'DELETE') {
            const id = Number(path.split('/').pop());
            state.coordinators = state.coordinators.filter((item) => Number(item.id) !== id);
            return json(route, { message: 'Coordinador eliminado' });
        }

        if (/^\/api\/students\/\d+\/estatus$/.test(path) && method === 'PATCH') {
            const id = Number(path.match(/\d+/)?.[0]);
            const body = parseJsonBody(request);
            const nextStatus = body.estatus ?? 'Activo';
            state.students = state.students.map((item) =>
                Number(item.id) === id
                    ? {
                          ...item,
                          Estatus: nextStatus,
                          estatus: nextStatus,
                          Empresa: body.empresa ?? item.Empresa,
                          Numero_convenio: body.numero_convenio ?? item.Numero_convenio,
                          Motivo_baja: body.motivo_baja ?? item.Motivo_baja,
                      }
                    : item
            );
            return json(route, { data: state.students.find((item) => Number(item.id) === id) });
        }

        if (/^\/api\/students\/\d+\/details$/.test(path) && method === 'GET') {
            const id = Number(path.match(/\d+/)?.[0]);
            const selectedStudent = state.students.find((item) => Number(item.id) === id) ?? state.students[0];
            return json(route, {
                period: state.periods[0],
                student: selectedStudent,
                documents: {
                    spaces: state.evidences,
                    sent: state.submissions,
                    missing: [
                        {
                            id: 102,
                            titulo: 'Reporte bimestral 1',
                            evidence: { titulo: 'Reportes bimestrales' },
                        },
                    ],
                },
            });
        }

        if (path === '/api/admin/report-submissions' && method === 'GET') {
            return json(route, state.submissions);
        }

        if (path === '/api/coordinator/report-submissions' && method === 'GET') {
            return json(route, state.submissions);
        }

        if (/^\/api\/(?:admin|coordinator)\/report-submissions\/\d+$/.test(path) && method === 'PATCH') {
            const id = Number(path.match(/\d+/)?.[0]);
            const body = parseJsonBody(request);
            state.submissions = state.submissions.map((item) =>
                Number(item.id) === id ? { ...item, ...body } : item
            );
            return json(route, state.submissions.find((item) => Number(item.id) === id));
        }

        if (/^\/api\/(?:admin|coordinator)\/report-submissions\/\d+\/download$/.test(path) && method === 'GET') {
            return pdf(route, 'entrega-estudiante.pdf');
        }

        if (path === '/api/evidences' && method === 'GET') {
            return json(route, state.evidences);
        }

        if (path === '/api/evidences' && method === 'POST') {
            const body = parseJsonBody(request);
            const created = {
                id: state.nextIds.evidence++,
                titulo: body.titulo || 'Evidencia E2E',
                tipo: body.tipo || 'inscripcion',
                descripcion: body.descripcion || '',
                fecha_limite: body.fecha_limite || null,
                reports: [],
            };
            state.evidences.push(created);
            return json(route, created, 201);
        }

        if (/^\/api\/evidences\/\d+$/.test(path) && method === 'PUT') {
            const id = Number(path.split('/').pop());
            const body = parseJsonBody(request);
            state.evidences = state.evidences.map((item) =>
                Number(item.id) === id ? { ...item, ...body } : item
            );
            return json(route, state.evidences.find((item) => Number(item.id) === id));
        }

        if (/^\/api\/evidences\/\d+$/.test(path) && method === 'DELETE') {
            const id = Number(path.split('/').pop());
            state.evidences = state.evidences.filter((item) => Number(item.id) !== id);
            return json(route, { message: 'Espacio eliminado.' });
        }

        if (path === '/api/reports' && method === 'GET') {
            const evidenceId = url.searchParams.get('evidence_id');
            const reports = evidenceId
                ? state.reports.filter((report) => String(report.evidence_id) === String(evidenceId))
                : state.reports;
            return json(route, reports);
        }

        if (path === '/api/reports' && method === 'POST') {
            const raw = request.postData() ?? '';
            const created = {
                id: state.nextIds.report++,
                evidence_id: Number(readMultipartValue(raw, 'evidence_id')) || state.evidences[0]?.id,
                titulo: readMultipartValue(raw, 'titulo') || 'Reporte E2E',
                descripcion: readMultipartValue(raw, 'descripcion') || '',
                tipo: readMultipartValue(raw, 'tipo') || 'programa',
                has_attachment: raw.includes('filename='),
                submissions: [],
            };
            state.reports.push(created);
            state.evidences = state.evidences.map((item) =>
                Number(item.id) === Number(created.evidence_id)
                    ? { ...item, reports: [...(item.reports || []), created] }
                    : item
            );
            return json(route, created, 201);
        }

        if (/^\/api\/reports\/\d+$/.test(path) && method === 'POST') {
            const id = Number(path.split('/').pop());
            const raw = request.postData() ?? '';
            const updated = {
                titulo: readMultipartValue(raw, 'titulo') || 'Reporte actualizado E2E',
                descripcion: readMultipartValue(raw, 'descripcion') || '',
                tipo: readMultipartValue(raw, 'tipo') || 'programa',
            };
            state.reports = state.reports.map((report) =>
                Number(report.id) === id ? { ...report, ...updated } : report
            );
            state.evidences = state.evidences.map((evidence) => ({
                ...evidence,
                reports: (evidence.reports || []).map((report) =>
                    Number(report.id) === id ? { ...report, ...updated } : report
                ),
            }));
            return json(route, state.reports.find((report) => Number(report.id) === id));
        }

        if (/^\/api\/reports\/\d+$/.test(path) && method === 'DELETE') {
            const id = Number(path.split('/').pop());
            state.reports = state.reports.filter((report) => Number(report.id) !== id);
            state.evidences = state.evidences.map((evidence) => ({
                ...evidence,
                reports: (evidence.reports || []).filter((report) => Number(report.id) !== id),
            }));
            return json(route, { message: 'Reporte eliminado.' });
        }

        if (path === '/api/periods' && method === 'GET') {
            return json(route, state.periods);
        }

        if (path === '/api/periods' && method === 'POST') {
            const body = parseJsonBody(request);
            const created = {
                id: state.nextIds.period++,
                codigo: `${body.anio}-${body.numero}`,
                anio: Number(body.anio),
                numero: Number(body.numero),
                estatus: body.estatus || 'borrador',
                fecha_inicio: body.fecha_inicio,
                fecha_fin: body.fecha_fin,
                students_count: body.clonar_estudiantes_desde_periodo_id ? 2 : 0,
                active_students_count: body.clonar_estudiantes_desde_periodo_id ? 1 : 0,
                inactive_students_count: 0,
                dropped_students_count: 0,
                reports_count: 0,
                submissions_count: 0,
                created_at: '2026-05-26T10:00:00Z',
            };
            state.periods.push(created);
            return json(route, created, 201);
        }

        if (/^\/api\/periods\/\d+$/.test(path) && method === 'PUT') {
            const id = Number(path.split('/').pop());
            const body = parseJsonBody(request);
            state.periods = state.periods.map((period) =>
                Number(period.id) === id
                    ? { ...period, ...body, codigo: `${body.anio}-${body.numero}` }
                    : period
            );
            return json(route, state.periods.find((period) => Number(period.id) === id));
        }

        if (/^\/api\/periods\/\d+\/activate$/.test(path) && method === 'POST') {
            const id = Number(path.match(/\d+/)?.[0]);
            state.periods = state.periods.map((period) => ({
                ...period,
                estatus: Number(period.id) === id ? 'activo' : period.estatus === 'activo' ? 'borrador' : period.estatus,
            }));
            return json(route, state.periods.find((period) => Number(period.id) === id));
        }

        if (/^\/api\/periods\/\d+\/close$/.test(path) && method === 'POST') {
            const id = Number(path.match(/\d+/)?.[0]);
            state.periods = state.periods.map((period) =>
                Number(period.id) === id ? { ...period, estatus: 'cerrado', fecha_cierre: '2026-05-26' } : period
            );
            return json(route, state.periods.find((period) => Number(period.id) === id));
        }

        if (/^\/api\/periods\/\d+\/statistics$/.test(path) && method === 'GET') {
            const id = Number(path.match(/\d+/)?.[0]);
            const period = state.periods.find((item) => Number(item.id) === id) ?? state.periods[0];
            return json(route, {
                period,
                summary: {
                    alumnos: period.students_count ?? 0,
                    ingresos: 1,
                    activos: period.active_students_count ?? 0,
                    inactivos: period.inactive_students_count ?? 0,
                    bajas: period.dropped_students_count ?? 0,
                    reportes: period.reports_count ?? 0,
                    entregas: period.submissions_count ?? 0,
                },
                baja_reasons: [{ motivo: 'Cambio de programa', total: 1 }],
                careers: [{ carrera: 'Ingenieria en Sistemas Computacionales', total: 2 }],
                submissions_by_status: [{ status: 'enviado', total: 1 }],
                companies: [{ empresa: 'Sistemas del Norte', total: 1 }],
            });
        }

        if (path === '/api/documents' && method === 'GET') {
            return json(route, state.documents);
        }

        if (path === '/api/document-imports' && method === 'POST') {
            const raw = request.postData() ?? '';
            if (raw.includes('plantilla.exe')) {
                return json(route, { message: 'Formato no soportado para importacion.' }, 422);
            }

            return json(route, {
                filename: 'plantilla.txt',
                extension: 'txt',
                text: 'Carta importada para {alumno_nombre}',
                header_html: '<p>Instituto Tecnologico</p>',
                body_html: '<p>Carta importada para {alumno_nombre}</p>',
                footer_html: '<p>Educacion Dual</p>',
                characters: 38,
                lines: 1,
            });
        }

        if (path === '/api/documents' && method === 'POST') {
            const body = parseJsonBody(request);
            const created = {
                id: state.nextIds.document++,
                ...body,
                lines: 1,
                characters: 80,
                placeholders: ['alumno_nombre'],
                updated_at: '2026-05-26T10:00:00Z',
            };
            state.documents.push(created);
            return json(route, created, 201);
        }

        if (/^\/api\/documents\/\d+$/.test(path) && method === 'PUT') {
            const id = Number(path.split('/').pop());
            const body = parseJsonBody(request);
            state.documents = state.documents.map((document) =>
                Number(document.id) === id ? { ...document, ...body } : document
            );
            return json(route, state.documents.find((document) => Number(document.id) === id));
        }

        if (/^\/api\/documents\/\d+$/.test(path) && method === 'DELETE') {
            const id = Number(path.split('/').pop());
            state.documents = state.documents.filter((document) => Number(document.id) !== id);
            return json(route, { message: 'Documento eliminado' });
        }

        if (path === '/api/document-generations/options' && method === 'GET') {
            return json(route, {
                period: state.periods[0],
                students: [
                    {
                        id: state.student.id,
                        nombre_completo: `${state.student.Nombre} ${state.student.Apellidos}`,
                        no_control: state.student.No_control,
                        carrera: state.student.Carrera,
                        semestre: state.student.Semestre,
                    },
                ],
                students_total: 1,
                careers: ['Ingenieria en Sistemas Computacionales'],
            });
        }

        if (/^\/api\/documents\/\d+\/generate$/.test(path) && method === 'POST') {
            return json(route, {
                generated_count: 1,
                period: state.periods[0],
                documents: [
                    {
                        filename: 'carta-carlos-perez.html',
                        pdf_filename: 'carta-carlos-perez.pdf',
                        html: '<p>Carta generada para Carlos Perez</p>',
                        student: {
                            id: state.student.id,
                            nombre_completo: `${state.student.Nombre} ${state.student.Apellidos}`,
                            no_control: state.student.No_control,
                            carrera: state.student.Carrera,
                            semestre: state.student.Semestre,
                        },
                        unresolved_placeholders: [],
                    },
                ],
            });
        }

        if (/^\/api\/documents\/\d+\/download-pdf$/.test(path) && method === 'POST') {
            return pdf(route, 'carta-carlos-perez.pdf');
        }

        if (path === '/api/advertisements' && method === 'GET') {
            return json(route, state.advertisements);
        }

        if (path === '/api/advertisements' && method === 'POST') {
            const raw = request.postData() ?? '';
            const created = {
                id: state.nextIds.advertisement++,
                titulo: readMultipartValue(raw, 'titulo') || 'Aviso E2E',
                mensaje: readMultipartValue(raw, 'mensaje') || 'Mensaje de sistema',
                target_role: readMultipartValue(raw, 'target_role') || 'all',
                target_carrera: readMultipartValue(raw, 'target_carrera') || null,
                visible_from: readMultipartValue(raw, 'visible_from') || null,
                attachment_path: raw.includes('filename=') ? 'anuncios/aviso.pdf' : null,
                created_at: '2026-05-26T10:00:00Z',
            };
            state.advertisements.unshift(created);
            return json(route, created, 201);
        }

        return json(route, { message: `Mock E2E sin ruta para ${method} ${path}` }, 404);
    });

    return state;
}

export async function expectNoHorizontalOverflow(page) {
    const overflow = await page.evaluate(() => {
        const root = document.documentElement;
        return root.scrollWidth - window.innerWidth;
    });

    if (overflow > 2) {
        throw new Error(`La pantalla tiene overflow horizontal de ${overflow}px.`);
    }
}

function buildSession(role) {
    if (role === 'admin') {
        return {
            role,
            token: 'e2e-admin-token',
            user: adminUser,
            profile: admin,
        };
    }

    if (role === 'coordinator') {
        return {
            role,
            token: 'e2e-coordinator-token',
            user: coordinatorUser,
            profile: coordinator,
        };
    }

    return {
        role: 'student',
        token: 'e2e-student-token',
        user: studentUser,
        profile: student,
    };
}

function handleLogin(route, request, path) {
    const body = parseJsonBody(request);

    if (body.password !== '1234') {
        return json(route, { message: 'Credenciales invalidas' }, 401);
    }

    if (path.endsWith('/admin')) {
        return json(route, {
            token: 'e2e-admin-token',
            access_token: 'e2e-admin-token',
            abilities: ['admin'],
            user: adminUser,
            admin,
        });
    }

    if (path.endsWith('/coordinator')) {
        return json(route, {
            token: 'e2e-coordinator-token',
            access_token: 'e2e-coordinator-token',
            abilities: ['coordinator'],
            user: coordinatorUser,
            coordinator,
        });
    }

    return json(route, {
        token: 'e2e-student-token',
        access_token: 'e2e-student-token',
        abilities: ['student'],
        user: studentUser,
        student,
    });
}

function parseJsonBody(request) {
    try {
        return request.postDataJSON();
    } catch {
        return {};
    }
}

function json(route, body, status = 200) {
    return route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify(body),
    });
}

function pdf(route, filename) {
    return route.fulfill({
        status: 200,
        headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${filename}"`,
        },
        body: '%PDF-1.4\n% E2E fixture\n',
    });
}

function readMultipartValue(raw, name) {
    const pattern = new RegExp(`name="${name}"\\r?\\n\\r?\\n([\\s\\S]*?)\\r?\\n--`);
    const match = raw.match(pattern);
    return match ? match[1].trim() : '';
}

function upsertSubmission(state, submission) {
    state.submissions = [
        ...state.submissions.filter((item) => Number(item.report_id) !== Number(submission.report_id)),
        {
            ...submission,
            report: state.reports.find((report) => Number(report.id) === Number(submission.report_id)),
            student: state.student,
            created_at: '2026-05-26T10:00:00Z',
        },
    ];

    state.evidences = state.evidences.map((evidence) => ({
        ...evidence,
        reports: (evidence.reports || []).map((report) =>
            Number(report.id) === Number(submission.report_id)
                ? { ...report, submissions: [submission] }
                : report
        ),
    }));
}
