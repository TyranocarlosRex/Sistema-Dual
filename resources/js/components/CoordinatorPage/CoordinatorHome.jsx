import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const CoordinatorHome = () => {
  const navigate = useNavigate();
  const [coordinator, setCoordinator] = useState(() => {
    const raw = localStorage.getItem('coordinator');
    return raw ? JSON.parse(raw) : null;
  });

  const [userEmail, setUserEmail] = useState(() => {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u).email : '';
  });

  const [stats, setStats] = useState({
    students: 0,
    activeProcesses: 0,
    pendingDocuments: 0
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    axios.get('/api/coordinator/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then(({ data }) => {
      if (data?.coordinator) {
        setCoordinator(data.coordinator);
        localStorage.setItem('coordinator', JSON.stringify(data.coordinator));
      }
      if (data?.user?.email) {
        setUserEmail(data.user.email);
        localStorage.setItem('user', JSON.stringify(data.user));
      }
    })
    .catch(error => console.error('Error al cargar datos:', error));

    setStats({
      students: 45,
      activeProcesses: 12,
      pendingDocuments: 7
    });
  }, []);

  if (!coordinator) {
    return (
      <div className="p-6 text-center">
        <p>Cargando información del coordinador...</p>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="bg-white rounded shadow-sm p-4 mb-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
        <div>
          <p className="text-muted mb-1 small">Panel de coordinador</p>
          <h1 className="h4 mb-1">
            Bienvenido, {coordinator.Nombre || "Coordinador"}
          </h1>
          <div className="text-secondary">
            Gestiona estudiantes, documentos y reportes de tu carrera.
          </div>
        </div>
        <div className="text-end">
          <span className="badge text-bg-success px-3 py-2">Coordinador</span>
        </div>
      </div>

      <div className="row g-3 mb-3">
        <div className="col-12 col-md-4">
          <div className="border rounded p-3 h-100 bg-light">
            <p className="text-muted mb-1 small">Estudiantes</p>
            <div className="h4 mb-0">{stats.students}</div>
            <small className="text-secondary">Asignados a tu carrera</small>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="border rounded p-3 h-100 bg-light">
            <p className="text-muted mb-1 small">Procesos activos</p>
            <div className="h4 mb-0">{stats.activeProcesses}</div>
            <small className="text-secondary">Seguimiento en curso</small>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="border rounded p-3 h-100 bg-light">
            <p className="text-muted mb-1 small">Documentos pendientes</p>
            <div className="h4 mb-0">{stats.pendingDocuments}</div>
            <small className="text-secondary">Por validar</small>
          </div>
        </div>
      </div>

      <div className="row g-3">
        <div className="col-12 col-lg-8">
          <div className="card h-100">
            <div className="card-header bg-light d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Accesos rápidos</h5>
              <span className="text-muted small">Módulos clave</span>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-12 col-md-6">
                  <div className="border rounded p-3 h-100">
                    <p className="text-muted small mb-1">Estudiantes</p>
                    <h6 className="mb-2">Lista y seguimiento</h6>
                    <p className="text-secondary small mb-3">
                      Revisa alumnos de tu carrera y su estado en el programa.
                    </p>
                    <button
                      className="btn btn-outline-primary btn-sm"
                      onClick={() => navigate("/coordinator-users")}
                    >
                      Abrir
                    </button>
                  </div>
                </div>
                <div className="col-12 col-md-6">
                  <div className="border rounded p-3 h-100">
                    <p className="text-muted small mb-1">Reportes</p>
                    <h6 className="mb-2">Entregas y validación</h6>
                    <p className="text-secondary small mb-3">
                      Valida reportes enviados y descarga archivos.
                    </p>
                    <button
                      className="btn btn-outline-primary btn-sm"
                      onClick={() => navigate("/coordinator-reports")}
                    >
                      Abrir
                    </button>
                  </div>
                </div>
                <div className="col-12 col-md-6">
                  <div className="border rounded p-3 h-100">
                    <p className="text-muted small mb-1">Documentos</p>
                    <h6 className="mb-2">Gestión documental</h6>
                    <p className="text-secondary small mb-3">
                      Consulta y gestiona evidencias requeridas a tus estudiantes.
                    </p>
                    <button
                      className="btn btn-outline-primary btn-sm"
                      onClick={() => navigate("/coordinator-documents/gestion")}
                    >
                      Abrir
                    </button>
                  </div>
                </div>
                <div className="col-12 col-md-6">
                  <div className="border rounded p-3 h-100">
                    <p className="text-muted small mb-1">Procesos</p>
                    <h6 className="mb-2">Avance de proyectos</h6>
                    <p className="text-secondary small mb-3">
                      Da seguimiento a los proyectos duales activos.
                    </p>
                    <button
                      className="btn btn-outline-primary btn-sm"
                      onClick={() => navigate("/procesos")}
                    >
                      Abrir
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-4">
          <div className="card mb-3">
            <div className="card-header bg-light">
              <h6 className="mb-0">Tus datos</h6>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label className="form-label text-muted mb-1">Nombre</label>
                <div className="form-control form-control-sm">
                  {coordinator.Nombre || "Coordinador"}
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label text-muted mb-1">Correo</label>
                <div className="form-control form-control-sm">
                  {userEmail || "No especificado"}
                </div>
              </div>
              <div>
                <label className="form-label text-muted mb-1">Teléfono</label>
                <div className="form-control form-control-sm">
                  {coordinator.Telefono || "No especificado"}
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header bg-light">
              <h6 className="mb-0">Recordatorios</h6>
            </div>
            <div className="card-body">
              <ul className="list-unstyled mb-0 text-secondary small">
                <li className="mb-2">• Revisa entregas recientes cada semana.</li>
                <li className="mb-2">• Valida documentos pendientes de tu carrera.</li>
                <li className="mb-2">• Da seguimiento a procesos activos.</li>
                <li className="mb-0">• Mantén actualizada la lista de estudiantes.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoordinatorHome;
