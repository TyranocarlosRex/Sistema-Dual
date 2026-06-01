import { expect, test } from '@playwright/test';
import {
    USERS,
    createMockState,
    mockSystemApi,
    seedSession,
} from './support/system-fixtures';

test.describe('Plan de pruebas de sistema CP-SIS', () => {
    let state;

    test.beforeEach(async ({ page }) => {
        state = createMockState();
        await mockSystemApi(page, state);
    });

    test('CP-SIS-01,02,03,23,24 - autenticacion por rol, error, persistencia, restriccion y logout', async ({ page }) => {
        await page.goto('/login-admin');

        const adminForm = page.locator('form.login-form');
        await adminForm.locator('input[type="text"]').fill(USERS.admin.email);
        await adminForm.locator('input[type="password"]').fill('incorrecta');
        await adminForm.getByRole('button', { name: 'Entrar' }).click();
        await expect(page.getByRole('alert')).toContainText('No pudimos iniciar sesion');

        await adminForm.locator('input[type="password"]').fill(USERS.admin.password);
        await adminForm.getByRole('button', { name: 'Entrar' }).click();
        await expect(page).toHaveURL(/\/administrador\/inicio$/);
        await expect(page.getByText(/Panel administrador/i).first()).toBeVisible();

        await page.reload();
        await expect(page).toHaveURL(/\/administrador\/inicio$/);
        await expect(page.getByRole('heading', { name: /Hola, Administrativo E2E/i })).toBeVisible();

        await page.goto('/estudiante/inicio');
        await expect(page).toHaveURL(/\/login-student$/);

        await page.goto('/administrador/inicio');
        await page.getByRole('button', { name: /Administrativo E2E/i }).click();
        await page.getByRole('button', { name: 'Cerrar sesion' }).click();
        await expect(page).toHaveURL(/\/login-student$/);

        await page.evaluate(() => localStorage.clear());
        await page.goto('/login-student');
        const studentForm = page.locator('form.login-form');
        await studentForm.locator('input[type="text"]').fill(USERS.student.noControl);
        await studentForm.locator('input[type="password"]').fill(USERS.student.password);
        await studentForm.getByRole('button', { name: 'Entrar' }).click();
        await expect(page).toHaveURL(/\/estudiante\/inicio$/);
        await expect(page.getByText(/Panel estudiante/i).first()).toBeVisible();

        await page.evaluate(() => localStorage.clear());
        await page.goto('/login-coordinator');
        const coordinatorForm = page.locator('form.login-form');
        await coordinatorForm.locator('input[type="text"]').fill(USERS.coordinator.email);
        await coordinatorForm.locator('input[type="password"]').fill(USERS.coordinator.password);
        await coordinatorForm.getByRole('button', { name: 'Entrar' }).click();
        await expect(page).toHaveURL(/\/coordinador\/inicio$/);
        await expect(page.getByText(/Panel coordinador/i).first()).toBeVisible();
    });

    test('CP-SIS-04,05,06,22,26 - administrador lista usuarios, cambia estatus, ve detalle y navega modulos', async ({ page }) => {
        await seedSession(page, 'admin');
        await page.goto('/administrador/usuarios');

        await expect(page.getByText('Usuarios - Estudiantes')).toBeVisible();
        await expect(page.getByRole('heading', { name: /Gestiona usuarios y estados/i })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Actualizar lista' })).toBeVisible();
        await expect(page.getByText(USERS.student.noControl)).toBeVisible();
        await expect(page.getByText('Carlos')).toBeVisible();

        await page.getByRole('button', { name: 'Baja' }).first().click();
        await expect(page.getByText(/Registrar baja/i)).toBeVisible();
        await page.getByPlaceholder('Describe el motivo de la baja').fill('Cambio de programa');
        await page.getByRole('button', { name: 'Confirmar' }).click();
        await expect(page.getByText('Baja').first()).toBeVisible();

        await page.getByRole('button', { name: 'Ver' }).first().click();
        await expect(page).toHaveURL(/\/administrador\/estudiantes\/1$/);
        await expect(page.getByText(/Datos generales/i)).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Evidencias enviadas' })).toBeVisible();

        await page.goto('/administrador/usuarios');
        await page.getByRole('button', { name: 'Coordinadores' }).click();
        await expect(page.getByText('Usuarios - Coordinadores')).toBeVisible();
        await expect(page.getByText(USERS.coordinator.email)).toBeVisible();

        await page.getByRole('link', { name: 'Periodos' }).click();
        await expect(page).toHaveURL(/\/administrador\/periodos$/);
        await page.getByRole('link', { name: 'Documentos' }).click();
        await expect(page).toHaveURL(/\/administrador\/documentos$/);
    });

    test('CP-SIS-07,09,11,13,25,27 - estudiante edita perfil, consulta evidencias, descarga y entrega archivo', async ({ page }) => {
        await seedSession(page, 'student');
        await page.goto('/estudiante/inicio');

        await expect(page.getByRole('heading', { name: /Datos de contacto/i })).toBeVisible();
        await page.getByPlaceholder('Ej. 6141234567').fill('6141234567');
        await page
            .getByPlaceholder('Calle, numero, colonia, ciudad y referencias si hacen falta')
            .fill('Av. Universidad 123');
        await page.getByRole('button', { name: 'Guardar datos' }).click();
        await expect(page.getByText('Perfil actualizado', { exact: true })).toBeVisible();

        await page.goto('/estudiante/evidencias');
        await expect(page.getByRole('heading', { name: /Mis evidencias/i })).toBeVisible();
        await expect(page.getByText('Reportes bimestrales')).toBeVisible();
        await page.getByRole('button', { name: 'Abrir evidencia' }).first().click();
        await expect(page.getByRole('heading', { name: /Mis reportes - Reportes bimestrales/i })).toBeVisible();

        await expect(page.getByRole('button', { name: 'Enviar archivo' })).toBeDisabled();

        const downloadPromise = page.waitForEvent('download');
        await page.getByRole('button', { name: 'Descargar reporte' }).click();
        const download = await downloadPromise;
        expect(download.suggestedFilename()).toBe('formato-reporte.pdf');

        const fileInput = page.locator('input[type="file"]').first();
        await fileInput.setInputFiles({
            name: 'evidencia.txt',
            mimeType: 'text/plain',
            buffer: Buffer.from('archivo no valido'),
        });
        await page.getByRole('button', { name: 'Enviar archivo' }).click();
        await expect(page.getByText(/El archivo debe ser PDF/i).first()).toBeVisible();

        await fileInput.setInputFiles({
            name: 'evidencia-final.pdf',
            mimeType: 'application/pdf',
            buffer: Buffer.from('%PDF-1.4 e2e'),
        });
        await page.getByRole('button', { name: 'Enviar archivo' }).click();
        await expect(page.getByText(/Entrega enviada/i)).toBeVisible();
        await expect(page.getByText('evidencia-final.pdf')).toBeVisible();
    });

    test('CP-SIS-08,10 - administrador crea, edita y elimina espacios de evidencia y reportes', async ({ page }) => {
        await seedSession(page, 'admin');
        await page.goto('/administrador/evidencias');

        await expect(page.getByRole('heading', { name: /Espacios de evidencias/i })).toBeVisible();
        await page.getByRole('button', { name: 'Nuevo espacio' }).click();
        await page.getByPlaceholder('Ej. Inscripcion, Reportes bimestrales').fill('Evidencia final E2E');
        await page.getByPlaceholder('Describe que documentos iran en este espacio').fill('Documentos finales del ciclo.');
        await page.getByRole('button', { name: 'Guardar espacio' }).click();
        await expect(page.getByText(/Espacio creado correctamente/i)).toBeVisible();
        await expect(page.getByText('Evidencia final E2E')).toBeVisible();

        await page.getByRole('button', { name: 'Agregar reporte' }).last().click();
        await expect(page.getByRole('heading', { name: /Agregar reporte/i })).toBeVisible();
        await page.locator('input[name="titulo"]').fill('Reporte E2E');
        await page.locator('textarea[name="descripcion"]').fill('Reporte de prueba de sistema.');
        await page.locator('input[name="fecha_limite"]').fill('2026-06-20');
        await page.getByRole('button', { name: 'Crear reporte' }).click();
        await expect(page.getByText(/Reporte creado correctamente/i)).toBeVisible();
        await expect(page.getByText('Reporte E2E', { exact: true })).toBeVisible();

        const reportCard = page.locator('.border.rounded.p-3.bg-white').filter({
            has: page.locator('.fw-semibold', { hasText: /^Reporte E2E$/ }),
        });
        await reportCard.getByRole('button', { name: 'Editar' }).click();
        await page.locator('input[name="titulo"]').fill('Reporte E2E actualizado');
        await page.getByRole('button', { name: 'Guardar cambios' }).click();
        await expect(page.getByText(/Reporte actualizado correctamente/i)).toBeVisible();
        await expect(page.getByText('Reporte E2E actualizado', { exact: true })).toBeVisible();

        page.once('dialog', (dialog) => dialog.accept());
        await page
            .locator('.border.rounded.p-3.bg-white')
            .filter({ has: page.locator('.fw-semibold', { hasText: /^Reporte E2E actualizado$/ }) })
            .getByRole('button', { name: 'Eliminar' })
            .click();
        await expect(page.getByText(/Reporte eliminado/i)).toBeVisible();
    });

    test('CP-SIS-14,15,16,17 - documentos importa, rechaza archivo invalido, guarda plantilla y genera PDF', async ({ page }) => {
        await seedSession(page, 'admin');
        await page.goto('/administrador/documentos');

        await expect(page.getByRole('heading', { name: /Biblioteca de documentos/i })).toBeVisible();
        await expect(page.getByText('Carta de presentacion E2E')).toBeVisible();

        await page.getByRole('button', { name: 'Nuevo documento' }).first().click();
        const importInput = page.locator('input[type="file"]').first();
        await importInput.setInputFiles({
            name: 'plantilla.exe',
            mimeType: 'application/octet-stream',
            buffer: Buffer.from('no valido'),
        });
        await page.getByRole('button', { name: 'Importar documento' }).click();
        await expect(page.getByText(/Formato no soportado/i).first()).toBeVisible();

        await importInput.setInputFiles({
            name: 'plantilla.txt',
            mimeType: 'text/plain',
            buffer: Buffer.from('Carta importada para {alumno_nombre}'),
        });
        await page.getByRole('button', { name: 'Importar documento' }).click();
        await expect(page.getByText(/Vista previa estructurada/i)).toBeVisible();
        await page.getByPlaceholder('Ej. Carta de presentacion base').fill('Plantilla E2E');
        await page.getByRole('button', { name: 'Guardar documento' }).click();
        await expect(page.getByText(/Documento guardado correctamente/i)).toBeVisible();
        await expect(page.getByText('Plantilla E2E')).toBeVisible();

        await page
            .locator('.border.rounded.p-3')
            .filter({ hasText: 'Carta de presentacion E2E' })
            .getByRole('button', { name: 'Generar' })
            .click();
        await expect(page.getByRole('heading', { name: /Generar documento membretado/i })).toBeVisible();
        await expect(page.getByText(/1 alumno\(s\) encontrados/i)).toBeVisible();
        await Promise.all([
            page.waitForResponse((response) =>
                response.url().includes('/api/documents/31/generate') &&
                response.request().method() === 'POST'
            ),
            page.getByRole('button', { name: 'Generar documentos' }).click(),
        ]);
        await expect(page.getByText(/Resultados generados/i)).toBeVisible();

        const pdfPromise = page.waitForEvent('download');
        await page.getByRole('button', { name: 'Descargar PDF' }).click();
        const pdfDownload = await pdfPromise;
        expect(pdfDownload.suggestedFilename()).toBe('carta-carlos-perez.pdf');
    });

    test('CP-SIS-18,19,20 - periodos crea con clonacion, activa y consulta estadisticas', async ({ page }) => {
        await seedSession(page, 'admin');
        await page.goto('/administrador/periodos');

        await expect(page.getByRole('heading', { name: /Organiza ciclos/i })).toBeVisible();
        await expect(page.locator('h2').filter({ hasText: '2026-1' })).toBeVisible();

        await page.getByRole('button', { name: 'Nuevo periodo' }).click();
        await page.locator('input[name="anio"]').fill('2027');
        await page.locator('select[name="numero"]').selectOption('1');
        await page.locator('select[name="estatus"]').selectOption('borrador');
        await page.locator('select[name="clonar_estudiantes_desde_periodo_id"]').selectOption('1');
        await page.locator('input[name="fecha_inicio"]').fill('2027-01-15');
        await page.locator('input[name="fecha_fin"]').fill('2027-06-30');
        await page.getByRole('button', { name: 'Crear periodo' }).click();
        await expect(page.getByText(/Periodo creado correctamente/i)).toBeVisible();
        await expect(page.locator('h2').filter({ hasText: '2027-1' })).toBeVisible();

        const newPeriodCard = page.locator('.card').filter({ hasText: '2027-1' });
        await newPeriodCard.getByRole('button', { name: 'Activar' }).click();
        await expect(page.getByText(/Periodo 2027-1 activado/i)).toBeVisible();

        await newPeriodCard.getByRole('button', { name: 'Ver estadisticas' }).click();
        const statsModal = page.locator('.position-fixed').filter({ hasText: 'Estadisticas del periodo' });
        await expect(statsModal.locator('h2').filter({ hasText: '2027-1' })).toBeVisible();
        await expect(statsModal.getByRole('heading', { name: 'Lectura rapida' })).toBeVisible();
    });

    test('CP-SIS-21 - administrador publica y filtra anuncios', async ({ page }) => {
        await seedSession(page, 'admin');
        await page.goto('/administrador/anuncios');

        await expect(page.getByRole('heading', { name: /Anuncios del administrador/i })).toBeVisible();
        await expect(page.getByText('Convocatoria dual')).toBeVisible();

        const form = page.locator('form').first();
        await form.locator('input[type="text"]').first().fill('Aviso E2E');
        await form.locator('textarea').fill('Mensaje publicado desde prueba de sistema.');
        await form.locator('select').selectOption('student');
        await form.getByPlaceholder('Ej. Sistemas, Industrial').fill('Ingenieria en Sistemas Computacionales');
        await form.locator('input[type="file"]').setInputFiles({
            name: 'aviso.pdf',
            mimeType: 'application/pdf',
            buffer: Buffer.from('%PDF-1.4 aviso'),
        });
        await form.getByRole('button', { name: 'Publicar anuncio' }).click();
        await expect(page.getByText(/Anuncio creado correctamente/i)).toBeVisible();
        await expect(page.getByText('Aviso E2E')).toBeVisible();

        await page.getByPlaceholder('Buscar titulo o mensaje').fill('Aviso E2E');
        await expect(page.getByText('Mensaje publicado desde prueba de sistema.')).toBeVisible();
    });

    test('CP-SIS-28 - vistas principales funcionan en escritorio y movil', async ({ page }) => {
        await seedSession(page, 'admin');

        for (const viewport of [
            { width: 1366, height: 768 },
            { width: 390, height: 844 },
        ]) {
            await page.setViewportSize(viewport);
            await page.goto('/administrador/inicio');
            await expect(page.getByText(/Panel administrador/i).first()).toBeVisible();
            await expect(page.getByRole('heading', { name: /Hola, Administrativo E2E/i })).toBeVisible();

            await page.goto('/administrador/usuarios');
            await expect(page.getByText(/Gestiona usuarios y estados/i)).toBeVisible();
            await expect(page.getByRole('button', { name: 'Buscar' })).toBeVisible();
        }
    });
});
