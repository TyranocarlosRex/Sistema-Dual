import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import AnnouncementsPanel from "../Shared/AnnouncementsPanel";
import { APP_ROUTES } from "../../routes";

const CoordinatorHome = () => {
  const navigate = useNavigate();
  const [coordinator, setCoordinator] = useState(null);
  const [userEmail, setUserEmail] = useState("");
  const [stats, setStats] = useState({
    students: 0,
    activeProcesses: 0,
    pendingDocuments: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      setIsLoading(false);
      return;
    }

    axios
      .get("/api/coordinator/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(({ data }) => {
        if (data?.coordinator) {
          setCoordinator(data.coordinator);
        }

        if (data?.user) {
          setUserEmail(data.user.email ?? "");
        }

        if (data?.stats) {
          setStats({
            students: Number(data.stats.students ?? 0),
            activeProcesses: Number(data.stats.activeProcesses ?? 0),
            pendingDocuments: Number(data.stats.pendingDocuments ?? 0),
          });
        }
      })
      .catch((error) => console.error("Error al cargar datos:", error))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="p-6 text-center">
        <p>Cargando informacion del coordinador...</p>
      </div>
    );
  }

  if (!coordinator) {
    return (
      <div className="p-6 text-center">
        <p>No se pudo cargar la informacion del coordinador.</p>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div
        className="rounded-4 text-white p-4 mb-4 d-flex justify-content-between align-items-center flex-wrap gap-3 shadow-lg"
        style={{
          background: "linear-gradient(135deg, #0ea5e9 0%, #0f172a 100%)",
        }}
      >
        <div>
          <p className="text-uppercase small mb-1" style={{ letterSpacing: "0.08em", opacity: 0.8 }}>
            Panel coordinador
          </p>
          <h1 className="h4 mb-1">
            Hola, {coordinator.Nombre || "Coordinador"}
          </h1>
          <div style={{ opacity: 0.95, maxWidth: "520px" }}>
            Gestiona estudiantes, documentos y reportes de tu carrera desde un solo lugar.
          </div>
        </div>
        <div className="text-end">
          <span className="badge bg-white text-dark px-3 py-2">Coordinador</span>
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
              <h5 className="mb-0">Accesos rapidos</h5>
              <span className="text-muted small">Modulos clave</span>
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
                      onClick={() => navigate(APP_ROUTES.coordinator.users)}
                    >
                      Abrir
                    </button>
                  </div>
                </div>
                <div className="col-12 col-md-6">
                  <div className="border rounded p-3 h-100">
                    <p className="text-muted small mb-1">Reportes</p>
                    <h6 className="mb-2">Entregas y validacion</h6>
                    <p className="text-secondary small mb-3">
                      Valida reportes enviados y descarga archivos.
                    </p>
                    <button
                      className="btn btn-outline-primary btn-sm"
                      onClick={() => navigate(APP_ROUTES.coordinator.tracking)}
                    >
                      Abrir
                    </button>
                  </div>
                </div>
                <div className="col-12 col-md-6">
                  <div className="border rounded p-3 h-100">
                    <p className="text-muted small mb-1">Documentos</p>
                    <h6 className="mb-2">Gestion documental</h6>
                    <p className="text-secondary small mb-3">
                      Consulta y gestiona evidencias requeridas a tus estudiantes.
                    </p>
                    <button
                      className="btn btn-outline-primary btn-sm"
                      onClick={() => navigate(APP_ROUTES.coordinator.pending)}
                    >
                      Abrir
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-4 d-flex flex-column gap-3">
          <AnnouncementsPanel
            title="Anuncios para coordinadores"
            emptyMessage="No hay anuncios nuevos."
            maxItems={4}
            compact
          />

          <div className="card">
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
                <label className="form-label text-muted mb-1">Telefono</label>
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
                <li className="mb-2">- Revisa entregas recientes cada semana.</li>
                <li className="mb-2">- Valida documentos pendientes de tu carrera.</li>
                <li className="mb-2">- Da seguimiento a procesos activos.</li>
                <li className="mb-0">- Manten actualizada la lista de estudiantes.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoordinatorHome;
