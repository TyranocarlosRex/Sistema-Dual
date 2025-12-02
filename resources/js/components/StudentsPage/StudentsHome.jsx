import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const safeJSON = (str, fallback = null) => {
  try {
    return str ? JSON.parse(str) : fallback;
  } catch {
    return fallback;
  }
};

const LABEL_TIPO = {
  inscripcion: "Inscripcion",
  programa: "Programa (reportes del programa)",
};

const StudentsHome = () => {
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const user = safeJSON(localStorage.getItem("user"));
  const student = safeJSON(localStorage.getItem("student"));
  const displayName = `${student?.Nombre ?? ""} ${student?.Apellidos ?? ""}`.trim() || student?.name || user?.name || "Estudiante";

  const [evidences, setEvidences] = useState([]);
  const [loadingEvidences, setLoadingEvidences] = useState(true);
  const [evidencesError, setEvidencesError] = useState("");

  const totalEvidences = evidences.length;
  const totalReports = evidences.reduce(
    (acc, ev) => acc + (ev.reports ? ev.reports.length : 0),
    0
  );

  const upcomingReports = evidences
    .flatMap((ev) =>
      (ev.reports || []).map((rep) => ({
        evidenceId: ev.id,
        evidenceTitle: ev.titulo,
        ...rep,
      }))
    )
    .filter((rep) => rep.fecha_limite)
    .sort(
      (a, b) => new Date(a.fecha_limite).getTime() - new Date(b.fecha_limite).getTime()
    )
    .slice(0, 3);

  const nextReport = upcomingReports[0];

  const handleOpenNextReport = () => {
    if (nextReport?.evidenceId) {
      navigate(`/student-report?evidence=${nextReport.evidenceId}`);
    } else if (evidences[0]?.id) {
      navigate(`/student-report?evidence=${evidences[0].id}`);
    }
  };

  if (!token) {
    return (
      <div className="p-6">
        No has iniciado sesion.
        <div className="mt-3">
          <button
            className="px-3 py-2 border rounded"
            onClick={() => navigate("/login-student")}
          >
            Ir al login
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return <div className="p-6">Cargando usuario...</div>;
  }

  if (!student) {
    return <div className="p-6">No se encontro informacion de estudiante.</div>;
  }

  useEffect(() => {
    const fetchEvidences = async () => {
      try {
        setLoadingEvidences(true);
        setEvidencesError("");
        const res = await axios.get("/api/student/evidences", {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
          withCredentials: true,
        });
        setEvidences(res.data);
      } catch (err) {
        setEvidencesError("No se pudieron cargar las evidencias.");
      } finally {
        setLoadingEvidences(false);
      }
    };

    fetchEvidences();
  }, [token]);

  const getProximoReporte = (reports) => {
    if (!reports || reports.length === 0) return "-";

    const conFecha = reports.filter((r) => r.fecha_limite);
    if (conFecha.length === 0) return "-";

    const sorted = [...conFecha].sort(
      (a, b) => new Date(a.fecha_limite) - new Date(b.fecha_limite)
    );

    const primero = sorted[0];
    return `${primero.fecha_limite} (${primero.titulo})`;
  };

  return (
    <div className="p-4 p-md-5" style={{ background: "#f5f7fb", minHeight: "100vh" }}>
      <div className="container-lg" style={{ maxWidth: "1100px" }}>
        <section
          className="rounded-4 text-white shadow-lg"
          style={{
            background: "linear-gradient(135deg, #22c55e 0%, #15803d 100%)",
            padding: "2rem",
          }}
        >
          <p className="text-uppercase small mb-1" style={{ letterSpacing: "0.08em", opacity: 0.8 }}>
            Panel estudiante
          </p>
          <h1 className="h4 mb-2">Hola, {displayName}</h1>
          <p className="mb-0" style={{ maxWidth: "520px", opacity: 0.95 }}>
            Consulta tus espacios de evidencia, entrega reportes a tiempo y sigue tu avance en el programa dual.
          </p>
        </section>

        <div className="row g-3 mt-3 mb-1">
          <div className="col-12 col-md-4">
            <div className="card h-100 shadow-sm border-0">
              <div className="card-body">
                <p className="text-muted small mb-1">Evidencias activas</p>
                <h4 className="mb-0">{totalEvidences}</h4>
              </div>
            </div>
          </div>
          <div className="col-12 col-md-4">
            <div className="card h-100 shadow-sm border-0">
              <div className="card-body">
                <p className="text-muted small mb-1">Reportes totales</p>
                <h4 className="mb-0">{totalReports}</h4>
              </div>
            </div>
          </div>
          <div className="col-12 col-md-4">
            <div className="card h-100 shadow-sm border-0">
              <div className="card-body d-flex flex-column">
                <p className="text-muted small mb-1">Proximo entregable</p>
                {nextReport ? (
                  <>
                    <div className="fw-semibold">{nextReport.titulo}</div>
                    <div className="small text-muted">Limite: {nextReport.fecha_limite}</div>
                  </>
                ) : (
                  <div className="text-muted">Sin pendientes fechados</div>
                )}
                <button
                  type="button"
                  className="btn btn-outline-success btn-sm mt-2 align-self-start"
                  onClick={handleOpenNextReport}
                  disabled={!evidences.length}
                >
                  Abrir reporte
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="card border-0 shadow-sm mb-3">
          <div className="card-body d-flex flex-wrap gap-2">
            <button
              className="btn btn-success"
              type="button"
              onClick={() =>
                evidences[0]?.id
                  ? navigate(`/student-report?evidence=${evidences[0].id}`)
                  : navigate("/student-report")
              }
            >
              Subir evidencia
            </button>
            <button
              className="btn btn-outline-success"
              type="button"
              onClick={handleOpenNextReport}
              disabled={!evidences.length}
            >
              Ver siguiente entrega
            </button>
            <button
              className="btn btn-light"
              type="button"
              onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" })}
            >
              Revisar lista completa
            </button>
          </div>
        </div>

        <h2 className="text-2xl">Evidencias del programa</h2>

        {loadingEvidences && (
          <p className="text-sm text-gray-500">Cargando evidencias...</p>
        )}

        {evidencesError && !loadingEvidences && (
          <p className="text-sm text-danger">{evidencesError}</p>
        )}

        {!loadingEvidences && !evidencesError && evidences.length === 0 && (
          <p className="text-sm text-gray-500">Por el momento no hay evidencias configuradas.</p>
        )}

        <div className="row g-3">
          {evidences.map((ev) => {
            const totalReportsByEvidence = ev.reports ? ev.reports.length : 0;
            const proximo = getProximoReporte(ev.reports || []);

            return (
              <div key={ev.id} className="col-12 col-md-6">
                <div className="card h-100 shadow-sm border-0">
                  <div className="card-header bg-light d-flex justify-content-between align-items-center">
                    <h3 className="h6 mb-0">{ev.titulo}</h3>
                    <span className="badge bg-success-subtle text-success">
                      {LABEL_TIPO[ev.tipo] || ev.tipo}
                    </span>
                  </div>

                  <div className="card-body">
                    {ev.descripcion && (
                      <p className="mb-2 text-muted small">{ev.descripcion}</p>
                    )}

                    <p className="mb-1">
                      <span className="fw-semibold">Total de reportes: </span>
                      {totalReportsByEvidence}
                    </p>

                    <p className="mb-1">
                      <span className="fw-semibold">Proximo reporte: </span>
                      {proximo}
                    </p>

                    {totalReportsByEvidence > 0 && (
                      <div className="mt-3">
                        <p className="fw-semibold small mb-1">Reportes en este espacio</p>
                        <ul className="list-unstyled mb-0">
                          {ev.reports.slice(0, 3).map((rep) => (
                            <li key={rep.id} className="small text-muted">
                              {rep.titulo}
                              {rep.fecha_limite && (
                                <span className="text-secondary"> — limite: {rep.fecha_limite}</span>
                              )}
                            </li>
                          ))}
                          {totalReportsByEvidence > 3 && (
                            <li className="text-secondary small">
                              … y {totalReportsByEvidence - 3} mas
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="card-footer bg-transparent border-0">
                    <button
                      type="button"
                      className="btn btn-outline-success btn-sm"
                      onClick={() => navigate(`/student-report?evidence=${ev.id}`)}
                    >
                      Ver detalles
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default StudentsHome;
