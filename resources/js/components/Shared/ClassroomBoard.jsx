import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { getApiErrorMessage } from "../../utils/errorMessages";

const ROLE_LABELS = {
  all: "Todos",
  student: "Estudiantes",
  coordinator: "Coordinadores",
  admin: "Administradores",
};

const formatDateTime = (value) => {
  if (!value) return "";
  const date =
    typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? new Date(`${value}T00:00:00`)
      : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" });
};

const toTimestamp = (value) => {
  if (!value) return null;
  const date =
    typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? new Date(`${value}T00:00:00`)
      : new Date(value);
  const time = date.getTime();
  return Number.isNaN(time) ? null : time;
};

const nextReportLabel = (reports = []) => {
  if ((reports || []).length === 0) return "Sin reportes";
  const conFecha = (reports || []).filter((r) => r.fecha_limite);
  if (conFecha.length === 0) return "Sin fecha limite";
  const sorted = [...conFecha].sort((a, b) => toTimestamp(a.fecha_limite) - toTimestamp(b.fecha_limite));
  const primero = sorted[0];
  return `${primero.titulo} - limite ${primero.fecha_limite}`;
};

const submissionTime = (submission) => {
  const value = submission?.created_at || submission?.updated_at;
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
};

const latestSubmissionForReport = (report) => {
  const submissions = Array.isArray(report?.submissions) ? report.submissions : [];
  if (submissions.length === 0) return null;

  return [...submissions].sort((a, b) => submissionTime(b) - submissionTime(a))[0];
};

const evidenceProgress = (reports = []) => {
  const submitted = (reports || []).filter((report) => latestSubmissionForReport(report));
  const latestSubmission = submitted
    .map((report) => latestSubmissionForReport(report))
    .sort((a, b) => submissionTime(b) - submissionTime(a))[0] || null;

  return {
    submitted: submitted.length,
    total: (reports || []).length,
    latestSubmission,
  };
};

export default function ClassroomBoard({
  evidences = [],
  loadingEvidences = false,
  evidencesError = "",
  onOpenEvidence,
}) {
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
      } catch (err) {
        setAnnouncementsError(getApiErrorMessage(err, "No pudimos cargar los anuncios. Actualiza la pagina e intenta de nuevo."));
      } finally {
        setLoadingAnnouncements(false);
      }
    };
    fetchAnnouncements();
  }, []);

  const hasAnnouncements = announcements.length > 0;
  const hasEvidences = evidences.length > 0;
  const timelineIsLoading = loadingAnnouncements || loadingEvidences;

  const timelineItems = useMemo(() => {
    const combined = [];

    announcements.forEach((a) => {
      const dateValue = a.created_at || a.visible_from;
      combined.push({
        id: `announcement-${a.id ?? a.titulo}`,
        kind: "announcement",
        title: a.titulo,
        description: a.mensaje,
        dateValue,
        timestamp: toTimestamp(dateValue),
        meta: {
          role: a.target_role,
          carrera: a.target_carrera,
          visibleFrom: a.visible_from,
          attachment: a.attachment_path,
        },
      });
    });

    evidences.forEach((ev) => {
      const dateValue = ev.created_at || ev.updated_at;
      combined.push({
        id: `evidence-${ev.id}`,
        kind: "evidence",
        title: ev.titulo,
        description: ev.descripcion,
        dateValue,
        timestamp: toTimestamp(dateValue),
        meta: {
          id: ev.id,
          tipo: ev.tipo,
          reports: ev.reports || [],
        },
      });
    });

    return combined.sort((a, b) => (b.timestamp ?? -Infinity) - (a.timestamp ?? -Infinity));
  }, [announcements, evidences]);

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

  const timelineView = (
    <>
      {announcementsError && <div className="alert alert-danger py-2 mb-0">Anuncios: {announcementsError}</div>}
      {evidencesError && <div className="alert alert-danger py-2 mb-0 mt-2">Evidencias: {evidencesError}</div>}

      {!announcementsError && !evidencesError && timelineIsLoading && (
        <div className="text-muted small">Cargando anuncios y evidencias...</div>
      )}

      {!timelineIsLoading && timelineItems.length === 0 && (
        <div className="text-muted small">No hay anuncios ni evidencias recientes.</div>
      )}

      {!timelineIsLoading && timelineItems.length > 0 && (
        <div className="d-grid gap-3">
          {timelineItems.map((item) => (
            <div key={item.id} className="border rounded p-3 bg-white">
              <div className="d-flex justify-content-between align-items-start gap-2 flex-wrap">
                <div className="d-flex flex-wrap align-items-center gap-2">
                  <span
                    className={`badge ${
                      item.kind === "announcement" ? "bg-primary-subtle text-primary" : "bg-success-subtle text-success"
                    }`}
                  >
                    {item.kind === "announcement" ? "Anuncio" : "Evidencia"}
                  </span>

                  {item.kind === "announcement" ? (
                    <>
                      <span className="badge bg-secondary-subtle text-secondary">
                        {ROLE_LABELS[item.meta.role] || item.meta.role || "Todos"}
                      </span>
                      {item.meta.carrera && <span className="badge bg-light text-secondary">{item.meta.carrera}</span>}
                      {item.meta.visibleFrom && (
                        <span className="badge bg-light text-secondary">
                          Disponible desde {formatDateTime(item.meta.visibleFrom)}
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="badge bg-light text-secondary">
                      {item.meta.tipo === "inscripcion"
                        ? "Inscripcion"
                        : item.meta.tipo === "programa"
                        ? "Programa"
                        : item.meta.tipo || "Evidencia"}
                    </span>
                  )}
                </div>

                <span className="text-muted small">
                  {formatDateTime(item.dateValue) || "Fecha no disponible"}
                </span>
              </div>

              <div className="fw-semibold mt-1">{item.title}</div>
              {item.description && (
                <p className="text-muted small mb-2" style={{ whiteSpace: "pre-line" }}>
                  {item.description}
                </p>
              )}

              {item.kind === "announcement" && item.meta.attachment && (
                <a
                  href={`/storage/${item.meta.attachment}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm btn-outline-primary"
                >
                  Ver adjunto
                </a>
              )}

              {item.kind === "evidence" && (
                <div className="d-flex flex-wrap gap-2 align-items-center">
                  {(() => {
                    const progress = evidenceProgress(item.meta.reports || []);

                    return (
                      <>
                        <span className="text-muted small">
                          {progress.submitted} de {progress.total} entregados - {nextReportLabel(item.meta.reports || [])}
                        </span>
                        {progress.latestSubmission && (
                          <span className="badge bg-success-subtle text-success">
                            {progress.latestSubmission.original_name || "Archivo enviado"}
                          </span>
                        )}
                      </>
                    );
                  })()}
                  {onOpenEvidence && (
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-success"
                      onClick={() => onOpenEvidence(item.meta.id)}
                    >
                      Abrir evidencia
                    </button>
                  )}
                </div>
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
          {evidences.map((ev) => {
            const progress = evidenceProgress(ev.reports || []);

            return (
              <div key={ev.id} className="border rounded p-3 bg-white">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <h6 className="mb-1">{ev.titulo}</h6>
                    {ev.descripcion && <p className="text-muted small mb-2">{ev.descripcion}</p>}
                    <div className="text-muted small">
                      {progress.submitted} de {progress.total} entregados - {nextReportLabel(ev.reports || [])}
                    </div>
                    {progress.latestSubmission && (
                      <div className="small mt-1">
                        <strong>Ultimo archivo: </strong>
                        {progress.latestSubmission.original_name || "Archivo enviado"}
                      </div>
                    )}
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
            );
          })}
        </div>
      )}
    </>
  );

  return (
    <div className="card shadow-sm border-0">
      <div className="card-header bg-light d-flex align-items-center gap-3">
        <h6 className="mb-0">Anuncios y evidencias</h6>
      </div>
      <div className="card-body">
        {timelineView}
      </div>
    </div>
  );
}
