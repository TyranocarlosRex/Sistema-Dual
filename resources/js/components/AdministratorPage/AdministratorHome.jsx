import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { APP_ROUTES } from '../../routes';

const AdministratorHome = () => {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  const [userEmail, setUserEmail] = useState('');

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsLoading(false);
      return;
    }

    axios
      .get('/api/admin/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(({ data }) => {
        if (data?.admin) {
          setAdmin(data.admin);
        }
        if (data?.user?.email) {
          setUserEmail(data.user.email);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const moduleCards = useMemo(
    () => [
      {
        title: 'Periodos',
        description:
          'Crea nuevos ciclos, activa el periodo vigente y conserva historicos cerrados para consulta.',
        action: () => navigate(APP_ROUTES.admin.periods),
        badge: 'Ciclos',
      },
      {
        title: 'Usuarios',
        description:
          'Registra nuevos coordinadores, ajusta el estatus de estudiantes y revisa su información de contacto.',
        action: () => navigate(APP_ROUTES.admin.users),
        badge: 'Gestión',
      },
      {
        title: 'Procesos duales',
        description:
          'Dale seguimiento a los avances, valida entregables y asegura la trazabilidad de cada proceso.',
        action: () => navigate(APP_ROUTES.admin.tracking),
        badge: 'Seguimiento',
      },
      {
        title: 'Evidencias y avisos',
        description:
          'Consulta y publica comunicados, revisa documentos y confirma las evidencias de los equipos.',
        action: () => navigate(APP_ROUTES.admin.evidences),
        badge: 'Publicaciones',
      },
      {
        title: 'Documentos y plantillas',
        description:
          'Crea documentos en blanco, importa formatos base y guardalos para volver a editarlos o reutilizarlos.',
        action: () => navigate(APP_ROUTES.admin.documents),
        badge: 'Documentos',
      },
    ],
    [navigate]
  );

  if (isLoading) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center" style={{ padding: '4rem 1rem' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
        <p className="mt-3 mb-0 text-muted">Preparando tu panel de administrador…</p>
      </div>
    );
  }

  if (!admin) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center text-center" style={{ padding: '4rem 1.5rem' }}>
        <div className="bg-white rounded-4 shadow-sm p-4" style={{ maxWidth: '420px' }}>
          <h2 className="h5 mb-2">Sesión no encontrada</h2>
          <p className="mb-3 text-muted">Vuelve a iniciar sesión para continuar con la administración.</p>
          <button className="btn btn-primary" onClick={() => navigate(APP_ROUTES.auth.adminLogin)}>
            Volver a iniciar sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-4" style={{ background: '#f4f6fb', minHeight: '100%' }}>
      <div className="container-fluid" style={{ maxWidth: '1200px' }}>
        <section
          className="rounded-4 mb-4 text-white"
          style={{
            background: 'linear-gradient(135deg, #2563eb 0%, #1e3a8a 100%)',
            padding: '2.25rem',
            boxShadow: '0 20px 45px -30px rgba(37, 99, 235, 0.8)',
          }}
        >
          <p className="text-uppercase small mb-2" style={{ letterSpacing: '0.1em', opacity: 0.7 }}>
            Panel administrador
          </p>
          <h1 className="h3 mb-2">Hola, {admin.name}</h1>
          <p className="mb-0" style={{ maxWidth: '520px', opacity: 0.85 }}>
            Organiza usuarios, gestiona procesos duales y controla la comunicación desde una sola vista.
          </p>
        </section>

        <div className="row g-3">
          <div className="col-12 col-lg-8">
            <section
              className="rounded-4 h-100"
              style={{
                background: '#ffffff',
                padding: '1.75rem',
                border: '1px solid #e2e8f0',
                boxShadow: '0 20px 45px -30px rgba(15, 23, 42, 0.5)',
              }}
            >
              <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                <h2 className="h5 mb-0">Módulos principales</h2>
                <span className="text-muted small">Accesos directos</span>
              </div>

              <div className="row g-3">
                {moduleCards.map((item) => (
                  <div className="col-12 col-md-6" key={item.title}>
                    <div
                      className="rounded-4 h-100 d-flex flex-column"
                      style={{
                        border: '1px solid #e2e8f0',
                        padding: '1.25rem',
                        background: '#f9fbff',
                        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.boxShadow = '0 16px 30px -24px rgba(37, 99, 235, 0.6)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <span className="badge bg-primary mb-2" style={{ alignSelf: 'flex-start' }}>
                        {item.badge}
                      </span>
                      <h3 className="h6 mb-2">{item.title}</h3>
                      <p className="text-muted small flex-grow-1">{item.description}</p>
                      <button className="btn btn-outline-primary btn-sm mt-2 align-self-start" onClick={item.action}>
                        Abrir módulo
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="col-12 col-lg-4">
            <div className="d-grid gap-3">
              <section
                className="rounded-4"
                style={{
                  background: '#ffffff',
                  padding: '1.5rem',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 15px 30px -24px rgba(15, 23, 42, 0.5)',
                }}
              >
                <h2 className="h6 mb-3">Tu perfil</h2>
                <div className="mb-3">
                  <p className="text-uppercase small mb-1" style={{ color: '#94a3b8', letterSpacing: '0.08em' }}>
                    Nombre
                  </p>
                  <div className="rounded-3 px-3 py-2" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    {admin.name || 'Administrador'}
                  </div>
                </div>
                <div className="mb-3">
                  <p className="text-uppercase small mb-1" style={{ color: '#94a3b8', letterSpacing: '0.08em' }}>
                    Correo
                  </p>
                  <div className="rounded-3 px-3 py-2" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    {userEmail || 'No especificado'}
                  </div>
                </div>
                <div>
                  <p className="text-uppercase small mb-1" style={{ color: '#94a3b8', letterSpacing: '0.08em' }}>
                    Rol
                  </p>
                  <div className="rounded-3 px-3 py-2" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    Administrador general
                  </div>
                </div>
              </section>

              <section
                className="rounded-4"
                style={{
                  background: '#ffffff',
                  padding: '1.5rem',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 15px 30px -24px rgba(15, 23, 42, 0.45)',
                }}
              >
                <h2 className="h6 mb-3">Indicaciones rápidas</h2>
                <ul className="list-unstyled d-grid gap-2 small mb-0" style={{ color: '#475569' }}>
                  <li>Actualiza usuarios antes de compartir accesos.</li>
                  <li>Confirma evidencias nuevas cada semana.</li>
                  <li>Programa reportes ejecutivos antes del cierre.</li>
                  <li>Usa los accesos directos para navegar más rápido.</li>
                </ul>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdministratorHome;
