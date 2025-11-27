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

  const quickLinks = useMemo(
    () => [
      {
        title: 'Gestión de usuarios',
        description: 'Administra cuentas de coordinadores y estudiantes desde un mismo lugar.',
        action: () => navigate('/administrator-users'),
        badge: 'Usuarios',
      },
      {
        title: 'Seguimiento de procesos',
        description: 'Supervisa avances, validaciones y estatus de los proyectos duales.',
        action: () => navigate('/administrator-tracking'),
        badge: 'Seguimiento',
      },
      {
        title: 'Publicaciones y evidencias',
        description: 'Centraliza anuncios institucionales y los entregables de los equipos.',
        action: () => navigate('/administrator-evidence'),
        badge: 'Evidencias',
      },
      {
        title: 'Reportes ejecutivos',
        description: 'Genera reportes consolidados para la toma de decisiones.',
        action: () => navigate('/administrator-report'),
        badge: 'Reportes',
      },
    ],
    [navigate]
  );

  const statusCards = useMemo(
    () => [
      {
        label: 'Usuarios activos',
        value: 128,
        hint: 'suma coordinadores y estudiantes con acceso vigente.',
      },
      {
        label: 'Procesos en seguimiento',
        value: 36,
        hint: 'proyectos duales con evidencias registradas.',
      },
      {
        label: 'Documentos por revisar',
        value: 14,
        hint: 'formatos pendientes de validación administrativa.',
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
    return <div className="p-6"> </div>;
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
        {statusCards.map((card) => (
          <div className="col-12 col-md-4" key={card.label}>
            <div className="border rounded p-3 h-100 bg-light">
              <p className="text-muted mb-1">{card.label}</p>
              <div className="h3 mb-1">{card.value}</div>
              <small className="text-secondary">{card.hint}</small>
            </div>
          </div>
        ))}
      </div>

      <div className="row g-3">
        <div className="col-12 col-lg-8">
          <div className="bg-white rounded shadow-sm p-3">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h2 className="h5 mb-0">Atajos recomendados</h2>
              <span className="text-muted small">Rutas clave de administración</span>
            </div>

            <div className="row g-3">
              {quickLinks.map((item) => (
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
            <h2 className="h6 mb-2">Resumen operativo</h2>
            <ul className="list-unstyled mb-0 small text-secondary">
              <li className="mb-2">• Mantén actualizada la matrícula desde "Usuarios".</li>
              <li className="mb-2">• Revisa la trazabilidad de procesos en "Seguimiento".</li>
              <li className="mb-2">• Publica comunicados y verifica evidencias recientes.</li>
              <li className="mb-2">• Descarga reportes ejecutivos antes de cierres de periodo.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdministratorHome;
