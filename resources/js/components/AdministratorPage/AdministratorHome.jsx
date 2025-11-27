import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const safeJSON = (str, fallback = null) => {
  try {
    if (!str || str === 'null') return fallback;
    return JSON.parse(str);
  } catch {
    return fallback;
  }
};

const AdministratorHome = () => {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(() => {
    const raw = localStorage.getItem('admin');
    return safeJSON(raw, null);
  });

  const [userEmail, setUserEmail] = useState(() => {
    const rawUser = localStorage.getItem('user');
    const userObj = safeJSON(rawUser, null);
    return userObj?.email ?? '';
  });

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
          localStorage.setItem('admin', JSON.stringify(data.admin));
        }
        if (data?.user?.email) {
          setUserEmail(data.user.email);
          localStorage.setItem('user', JSON.stringify(data.user));
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const moduleCards = useMemo(
    () => [
      {
        title: 'Usuarios',
        description:
          'Registra nuevos coordinadores, ajusta el estatus de estudiantes y revisa su información de contacto.',
        action: () => navigate('/administrator-users'),
        badge: 'Gestión',
      },
      {
        title: 'Procesos duales',
        description:
          'Dale seguimiento a los avances, valida entregables y asegura la trazabilidad de cada proceso.',
        action: () => navigate('/administrator-tracking'),
        badge: 'Seguimiento',
      },
      {
        title: 'Evidencias y avisos',
        description:
          'Consulta y publica comunicados, revisa documentos y confirma las evidencias de los equipos.',
        action: () => navigate('/administrator-evidence'),
        badge: 'Publicaciones',
      },
    ],
    [navigate]
  );

  const operationalNotes = useMemo(
    () => [
      {
        label: 'Matrícula',
        hint: 'Verifica altas y bajas de usuarios antes de iniciar un nuevo ciclo.',
      },
      {
        label: 'Procesos activos',
        hint: 'Confirma que cada proyecto tenga evidencias recientes y responsables asignados.',
      },
      {
        label: 'Validaciones',
        hint: 'Revisa los documentos pendientes para evitar retrasos en la certificación.',
      },
      {
        label: 'Comunicación',
        hint: 'Publica avisos clave en evidencias para mantener informados a los equipos.',
      },
    ],
    []
  );

  if (isLoading) {
    return (
      <div className="p-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
        <p className="mt-3 mb-0">Preparando tu panel de administrador</p>
      </div>
    );
  }

  if (!admin) {
    return (
      <div className="p-5 text-center bg-white rounded shadow-sm">
        <p className="mb-2">No encontramos tu sesión de administrador.</p>
        <button className="btn btn-primary btn-sm" onClick={() => navigate('/login-admin')}>
          Volver a iniciar sesión
        </button>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="bg-white rounded shadow-sm p-4 mb-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
        <div>
          <p className="text-muted mb-1">Panel de administración</p>
          <h1 className="h4 mb-2">Bienvenido, {admin.name}</h1>
          <div className="text-secondary">Controla usuarios, seguimiento y publicaciones del modelo dual.</div>
        </div>
        <div className="text-end">
          <span className="badge text-bg-primary px-3 py-2">Acceso administrador</span>
        </div>
      </div>

      <div className="row g-3 mb-4">
        {operationalNotes.map((note) => (
          <div className="col-12 col-md-6 col-lg-3" key={note.label}>
            <div className="border rounded p-3 h-100 bg-light">
              <p className="text-muted mb-1">{note.label}</p>
              <small className="text-secondary d-block">{note.hint}</small>
            </div>
          </div>
        ))}
      </div>
        
      <div className="row g-3">
        <div className="col-12 col-lg-8">
          <div className="bg-white rounded shadow-sm p-3">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h2 className="h5 mb-0">Módulos principales</h2>
              <span className="text-muted small">Accesos directos</span>
            </div>

            <div className="row g-3">
              {moduleCards.map((item) => (
                <div className="col-12 col-md-6" key={item.title}>
                  <div className="border rounded p-3 h-100">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <span className="badge text-bg-secondary">{item.badge}</span>
                    </div>
                    <h3 className="h6">{item.title}</h3>
                    <p className="text-secondary small mb-3">{item.description}</p>
                    <button className="btn btn-outline-primary btn-sm" onClick={item.action}>
                      Abrir módulo
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-4">
          <div className="bg-white rounded shadow-sm p-3 mb-3">
            <h2 className="h6 mb-3">Tus datos</h2>
            <div className="mb-3">
              <label className="form-label text-muted mb-1">Nombre</label>
              <div className="form-control form-control-sm">{admin.name || 'Administrador'}</div>
            </div>
            <div className="mb-3">
              <label className="form-label text-muted mb-1">Correo</label>
              <div className="form-control form-control-sm">{userEmail || 'No especificado'}</div>
            </div>
            <div>
              <label className="form-label text-muted mb-1">Rol</label>
              <div className="form-control form-control-sm">Administrador general</div>
            </div>
          </div>

          <div className="bg-white rounded shadow-sm p-3">
            <h2 className="h6 mb-2">Indicaciones rápidas</h2>
            <ul className="list-unstyled mb-0 small text-secondary">
              <li className="mb-2">• Actualiza usuarios antes de compartir accesos.</li>
              <li className="mb-2">• Confirma evidencias nuevas cada semana.</li>
              <li className="mb-2">• Programa reportes ejecutivos antes del cierre.</li>
              <li className="mb-2">• Usa los accesos directos para navegar más rápido.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdministratorHome;
