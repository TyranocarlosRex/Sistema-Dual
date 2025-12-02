import React, { useEffect, useState } from "react";
import axios from "axios";

const ROLE_LABELS = {
  all: "Todos",
  student: "Estudiantes",
  coordinator: "Coordinadores",
  admin: "Administradores",
};

const formatDateTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" });
};

const nextReportLabel = (reports = []) => {
  const conFecha = (reports || []).filter((r) => r.fecha_limite);
  if (conFecha.length === 0) return "Sin fecha limite";
  const sorted = [...conFecha].sort((a, b) => new Date(a.fecha_limite) - new Date(b.fecha_limite));
  const primero = sorted[0];
  return `${primero.titulo} - limite ${primero.fecha_limite}`;
};

export default function ClassroomBoard({
  evidences = [],
  loadingEvidences = false,
  evidencesError = "",
  onOpenEvidence,
}) {
  const [tab, setTab] = useState("todo");
  const [announcements, setAnnouncements] = useState([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);
  const [announcementsError, setAnnouncementsError] = useState("");

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        setAnnouncementsError("");
        const token = localStorage.getItem("token");
        if (!token) {
          setAnnouncementsError("Necesitas iniciar sesion para ver los anuncios.");
          return;
        }
        const { data } = await axios.get("/api/advertisements", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAnnouncements(Array.isArray(data) ? data : []);
      } catch {
        setAnnouncementsError("No se pudieron cargar los anuncios.");
      } finally {
        setLoadingAnnouncements(false);
      }
    };
    fetchAnnouncements();
  }, []);

  const hasAnnouncements = announcements.length > 0;
  const hasEvidences = evidences.length > 0;

  const announcementsView = (
    <>
      {announcementsError && <div className="alert alert-danger py-2 mb-0">{announcementsError}</div>}
      {!announcementsError && loadingAnnouncements && <div className="text-muted small">Cargando anuncios...</div>}
      {!announcementsError && !loadingAnnouncements && !hasAnnouncements && (
        <div className="text-muted small">No hay anuncios nuevos.</div>
      )}
      {!announcementsError && !loadingAnnouncements && hasAnnouncements && (
        <div className="d-grid gap-3">
          {announcements.slice(0, 5).map((a) => (
            <div key={a.id ?? a.titulo} className="border rounded p-3 bg-white">
              <div className="d-flex justify-content-between align-items-start gap-2">
                <div className="d-flex flex-wrap gap-1 align-items-center">
                  <span className="badge bg-primary-subtle text-primary text-uppercase" style={{ letterSpacing: "0.05em" }}>
                    {ROLE_LABELS[a.target_role] || a.target_role || "Todos"}
                  </span>
                  {a.target_carrera && <span className="badge bg-light text-secondary">{a.target_carrera}</span>}
                  <span className="badge bg-secondary-subtle text-secondary">
                    {a.visible_from ? `Desde ${formatDateTime(a.visible_from)}` : "Disponible ya"}
                  </span>
                </div>
                {a.created_at && <span className="text-muted small">{formatDateTime(a.created_at)}</span>}
              </div>
              <h6 className="mt-2 mb-1">{a.titulo}</h6>
              <p className="mb-2 text-muted small" style={{ whiteSpace: "pre-line" }}>
                {a.mensaje}
              </p>
              {a.attachment_path && (
                <a
                  href={`/storage/${a.attachment_path}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm btn-outline-primary"
                >
                  Ver adjunto
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );

  const evidencesView = (
    <>
      {evidencesError && <div className="alert alert-danger py-2 mb-0">{evidencesError}</div>}
      {!evidencesError && loadingEvidences && <div className="text-muted small">Cargando evidencias...</div>}
      {!evidencesError && !loadingEvidences && !hasEvidences && (
        <div className="text-muted small">Por el momento no hay evidencias configuradas.</div>
      )}
      {!evidencesError && !loadingEvidences && hasEvidences && (
        <div className="d-grid gap-3">
          {evidences.map((ev) => (
            <div key={ev.id} className="border rounded p-3 bg-white">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h6 className="mb-1">{ev.titulo}</h6>
                  {ev.descripcion && <p className="text-muted small mb-2">{ev.descripcion}</p>}
                  <div className="text-muted small">
                    {ev.reports ? ev.reports.length : 0} reportes - {nextReportLabel(ev.reports || [])}
                  </div>
                </div>
                {onOpenEvidence && (
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-success"
                    onClick={() => onOpenEvidence(ev.id)}
                  >
                    Abrir
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );

  return (
    <div className="card shadow-sm border-0">
      <div className="card-header bg-light d-flex align-items-center gap-3">
        <div>
          <h6 className="mb-0">Anuncios y evidencias</h6>
        </div>
        <div className="ms-auto d-flex gap-1">
          <button
            type="button"
            className={`btn btn-sm ${tab === "todo" ? "btn-primary" : "btn-outline-primary"}`}
            onClick={() => setTab("todo")}
          >
            Todo
          </button>
          <button
            type="button"
            className={`btn btn-sm ${tab === "anuncios" ? "btn-primary" : "btn-outline-primary"}`}
            onClick={() => setTab("anuncios")}
          >
            Anuncios
          </button>
          <button
            type="button"
            className={`btn btn-sm ${tab === "evidencias" ? "btn-primary" : "btn-outline-primary"}`}
            onClick={() => setTab("evidencias")}
          >
            Evidencias
          </button>
        </div>
      </div>
      <div className="card-body">
        {tab === "todo" ? (
          <div className="row g-3">
            <div className="col-12 col-lg-6">
              <h6 className="mb-2">Anuncios</h6>
              {announcementsView}
            </div>
            <div className="col-12 col-lg-6">
              <h6 className="mb-2">Evidencias</h6>
              {evidencesView}
            </div>
          </div>
        ) : tab === "anuncios" ? (
          announcementsView
        ) : (
          evidencesView
        )}
      </div>
    </div>
  );
}
