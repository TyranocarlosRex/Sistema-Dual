import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { parseDownloadFilename } from "../../../utils/downloadFilename";

const HERO_STYLE = {
  background: "linear-gradient(135deg, #2563eb 0%, #1e293b 100%)",
  color: "#fff",
  borderRadius: "20px",
  padding: "24px 28px",
  boxShadow: "0 24px 54px -35px rgba(37, 99, 235, 0.7)",
};

export default function AdministratorTracking() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submissions, setSubmissions] = useState([]);
  const [subsLoading, setSubsLoading] = useState(true);
  const [subsError, setSubsError] = useState("");
  const [feedback, setFeedback] = useState({});
  const [grades, setGrades] = useState({});
  const [updatingId, setUpdatingId] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);

  const [filterCarrera, setFilterCarrera] = useState("todos");
  const [filterEstatus, setFilterEstatus] = useState("todos");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("token");
        const res = await axios.get("/api/students", {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
          params: { per_page: 200, rol: "student" },
          withCredentials: true,
        });

        const data = Array.isArray(res.data?.data) ? res.data.data : res.data;
        setStudents(data || []);
      } catch (err) {
        console.error("Error cargando estudiantes:", err);
        setError("No se pudieron cargar los estudiantes.");
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        setSubsLoading(true);
        setSubsError("");

        const token = localStorage.getItem("token");
        const { data } = await axios.get("/api/admin/report-submissions", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const list = data ?? [];
        setSubmissions(list);

        const initialGrades = {};
        list.forEach((s) => {
          if (s.calificacion !== undefined && s.calificacion !== null) {
            initialGrades[s.id] = s.calificacion;
          }
        });
        setGrades(initialGrades);
      } catch (err) {
        console.error("Error cargando entregas:", err);
        setSubsError("No se pudieron cargar las entregas.");
      } finally {
        setSubsLoading(false);
      }
    };

    fetchSubmissions();
  }, []);

  const getCarrera = (s) => s.carrera ?? s.Carrera ?? s.career ?? "Sin carrera";
  const getEstatus = (s) => s.estatus ?? s.Estatus ?? s.status ?? "Sin estatus";
  const getNombreCompleto = (s) => {
    const nombre = s.Nombre ?? s.nombre ?? s.name ?? "";
    const apellidos = s.Apellidos ?? s.apellidos ?? s.last_name ?? "";
    return `${nombre} ${apellidos}`.trim() || "Sin nombre";
  };
  const getNoControl = (s) => s.No_control ?? s.no_control ?? s.noControl ?? "";
  const getPeriodo = (s) => {
    const period = s.periodo ?? s.Periodo ?? s.period ?? null;

    if (!period) return "-";
    if (typeof period === "string" || typeof period === "number") return String(period);
    if (typeof period === "object") {
      return period.codigo ?? period.nombre ?? period.name ?? String(period.id ?? "-");
    }

    return "-";
  };
  const getStatusKey = (s) => String(getEstatus(s) || "").trim().toLowerCase();

  const carreras = useMemo(() => {
    const set = new Set();
    students.forEach((s) => set.add(getCarrera(s)));
    return Array.from(set);
  }, [students]);

  const estados = useMemo(() => {
    const set = new Set();
    students.forEach((s) => set.add(getEstatus(s)));
    return Array.from(set);
  }, [students]);

  const filteredStudents = useMemo(() => {
    const searchLower = search.toLowerCase();
    return students.filter((s) => {
      const carrera = getCarrera(s);
      const estatus = getEstatus(s);
      const nombre = getNombreCompleto(s);
      const noCtrl = getNoControl(s);

      if (filterCarrera !== "todos" && carrera !== filterCarrera) return false;
      if (filterEstatus !== "todos" && estatus !== filterEstatus) return false;
      if (searchLower) {
        const texto = `${nombre} ${noCtrl}`.toLowerCase();
        if (!texto.includes(searchLower)) return false;
      }
      return true;
    });
  }, [students, filterCarrera, filterEstatus, search]);

  const totalFiltrados = filteredStudents.length;

  const estudiantesPorCarrera = useMemo(() => {
    const counts = {};
    filteredStudents.forEach((s) => {
      const carrera = getCarrera(s);
      counts[carrera] = (counts[carrera] || 0) + 1;
    });
    return counts;
  }, [filteredStudents]);

  const estudiantesPorEstatus = useMemo(() => {
    const counts = {};
    filteredStudents.forEach((s) => {
      const estatus = getEstatus(s);
      counts[estatus] = (counts[estatus] || 0) + 1;
    });
    return counts;
  }, [filteredStudents]);

  const getProgreso = (s) => {
    const value = Number(s.progress_percent ?? 0);
    if (!Number.isFinite(value)) return 0;
    return Math.max(0, Math.min(100, Math.round(value)));
  };

  const handleStatusChange = async (submissionId, status) => {
    try {
      setUpdatingId(submissionId);
      const token = localStorage.getItem("token");
      const gradeValue = grades[submissionId];
      const payload = {
        status: status ?? submissions.find((s) => s.id === submissionId)?.status,
        feedback: feedback[submissionId] || "",
        calificacion: gradeValue === "" || gradeValue === undefined ? null : gradeValue,
      };

      const { data } = await axios.patch(
        `/api/admin/report-submissions/${submissionId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === submissionId
            ? {
                ...s,
                status: payload.status ?? s.status,
                feedback: payload.feedback,
                calificacion: payload.calificacion,
                ...data,
              }
            : s
        )
      );
      setFeedback((prev) => ({ ...prev, [submissionId]: "" }));
      setGrades((prev) => ({ ...prev, [submissionId]: payload.calificacion ?? "" }));
    } catch (err) {
      console.error(err);
      alert("No se pudo actualizar el estado.");
    } finally {
      setUpdatingId(null);
    }
  };

  const closePreview = () => {
    if (previewFile?.url) {
      window.URL.revokeObjectURL(previewFile.url);
    }
    setPreviewFile(null);
  };

  const previewSubmission = async (submission) => {
    try {
      setDownloadingId(submission.id);
      const token = localStorage.getItem("token");

      const { data, headers } = await axios.get(
        `/api/admin/report-submissions/${submission.id}/download`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "blob",
        }
      );

      const filename = parseDownloadFilename(
        headers,
        submission.original_name || `entrega-${submission.id}`
      );

      const blob = new Blob([data], { type: headers["content-type"] || "application/octet-stream" });
      const url = window.URL.createObjectURL(blob);
      setPreviewFile({ url, name: filename });
    } catch (err) {
      console.error(err);
      alert("No se pudo previsualizar el archivo.");
    } finally {
      setDownloadingId(null);
    }
  };

  const downloadSubmission = async (submission) => {
    try {
      setDownloadingId(submission.id);
      const token = localStorage.getItem("token");

      const { data, headers } = await axios.get(
        `/api/admin/report-submissions/${submission.id}/download`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "blob",
        }
      );

      const filename = parseDownloadFilename(
        headers,
        submission.original_name || `entrega-${submission.id}`
      );

      const blob = new Blob([data], { type: headers["content-type"] || "application/octet-stream" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("No se pudo descargar el archivo.");
    } finally {
      setDownloadingId(null);
    }
  };

  const resumen = useMemo(() => {
    const total = filteredStudents.length;
    const activos = filteredStudents.filter((s) => getStatusKey(s) === "activo").length;
    const inactivos = filteredStudents.filter((s) => getStatusKey(s) === "inactivo").length;
    const bajas = filteredStudents.filter((s) => getStatusKey(s) === "baja").length;
    return { total, activos, inactivos, bajas };
  }, [filteredStudents]);

  return (
    <>
      <div className="p-3 p-md-4" style={{ background: "#f5f7fb", minHeight: "100vh" }}>
        <div className="container-fluid" style={{ maxWidth: "1200px" }}>
        <section style={HERO_STYLE} className="mb-4">
          <p className="text-uppercase small mb-1" style={{ letterSpacing: "0.08em", opacity: 0.85 }}>
            Seguimiento de estudiantes
          </p>
          <div className="d-flex flex-wrap align-items-center gap-3">
            <div>
              <h1 className="h4 mb-1">Visualiza avance y entregas</h1>
              <p className="mb-0" style={{ maxWidth: "540px", opacity: 0.9 }}>
                Filtra por carrera o estatus, revisa progreso y gestiona los reportes enviados desde un solo panel.
              </p>
            </div>
            <div className="ms-auto d-flex gap-2">
              <button
                className="btn btn-light btn-sm"
                type="button"
                onClick={() => window.location.reload()}
              >
                Refrescar
              </button>
            </div>
          </div>
        </section>

        <div className="row g-3 mb-3">
          <div className="col-12 col-md-3">
            <div className="card shadow-sm border-0 h-100">
              <div className="card-body">
                <p className="text-muted small mb-1">Total filtrado</p>
                <h4 className="mb-0">{resumen.total}</h4>
              </div>
            </div>
          </div>
          <div className="col-12 col-md-3">
            <div className="card shadow-sm border-0 h-100">
              <div className="card-body">
                <p className="text-muted small mb-1">Activos</p>
                <h4 className="mb-0 text-success">{resumen.activos}</h4>
              </div>
            </div>
          </div>
          <div className="col-12 col-md-3">
            <div className="card shadow-sm border-0 h-100">
              <div className="card-body">
                <p className="text-muted small mb-1">Inactivos</p>
                <h4 className="mb-0 text-danger">{resumen.inactivos}</h4>
              </div>
            </div>
          </div>
          <div className="col-12 col-md-3">
            <div className="card shadow-sm border-0 h-100">
              <div className="card-body">
                <p className="text-muted small mb-1">Bajas</p>
                <h4 className="mb-0 text-warning">{resumen.bajas}</h4>
              </div>
            </div>
          </div>
        </div>

        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body">
            <div className="row g-3 align-items-end">
              <div className="col-md-4">
                <label className="form-label">Buscar</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Nombre o No. de control"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Carrera</label>
                <select
                  className="form-select"
                  value={filterCarrera}
                  onChange={(e) => setFilterCarrera(e.target.value)}
                >
                  <option value="todos">Todas</option>
                  {carreras.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label">Estatus</label>
                <select
                  className="form-select"
                  value={filterEstatus}
                  onChange={(e) => setFilterEstatus(e.target.value)}
                >
                  <option value="todos">Todos</option>
                  {estados.map((e) => (
                    <option key={e} value={e}>
                      {e}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-md-6 mb-3">
            <div className="card h-100 shadow-sm border-0">
              <div className="card-header bg-light d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Estudiantes por carrera</h5>
                <span className="badge bg-secondary">{totalFiltrados}</span>
              </div>
              <div className="card-body">
                {carreras.length === 0 && (
                  <p className="text-muted mb-0">No hay estudiantes registrados.</p>
                )}
                {carreras.length > 0 &&
                  carreras.map((carrera, index) => {
                    const cantidad = estudiantesPorCarrera[carrera] || 0;
                    const porcentaje = totalFiltrados
                      ? Math.round((cantidad / totalFiltrados) * 100)
                      : 0;
                    return (
                      <div key={carrera} className="mb-3">
                        <div className="d-flex justify-content-between mb-1">
                          <span className="small">{carrera}</span>
                          <span className="small fw-bold">
                            {cantidad} ({porcentaje}%)
                          </span>
                        </div>
                        <div className="progress" style={{ height: "8px" }}>
                          <div
                            className="progress-bar"
                            role="progressbar"
                            style={{
                              width: `${porcentaje}%`,
                              backgroundColor: `hsl(${index * 60}, 70%, 50%)`,
                            }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>

          <div className="col-md-6 mb-3">
            <div className="card h-100 shadow-sm border-0">
              <div className="card-header bg-light">
                <h5 className="mb-0">Estatus de estudiantes</h5>
              </div>
              <div className="card-body">
                {estados.length === 0 && (
                  <p className="text-muted mb-0">No hay estatus registrados.</p>
                )}
                {estados.length > 0 && (
                  <ul className="list-group list-group-flush">
                    {estados.map((estado) => (
                      <li
                        key={estado}
                        className="list-group-item d-flex justify-content-between align-items-center px-0"
                      >
                        <span className="text-truncate" title={estado}>
                          {estado}
                        </span>
                        <span className="badge bg-primary rounded-pill">
                          {estudiantesPorEstatus[estado] || 0}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          <div className="col-12 mb-3">
            <div className="card shadow-sm border-0">
              <div className="card-header bg-light d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Progreso de estudiantes</h5>
                <span className="text-muted small">Mostrando {Math.min(totalFiltrados, 20)} de {totalFiltrados}</span>
              </div>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Estudiante</th>
                        <th>No. Control</th>
                        <th>Carrera</th>
                        <th>Periodo</th>
                        <th>Progreso</th>
                        <th>Estado</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.length === 0 && (
                        <tr>
                          <td colSpan={6} className="text-center text-muted">
                            No hay estudiantes que coincidan con los filtros.
                          </td>
                        </tr>
                      )}

                      {filteredStudents.slice(0, 20).map((s) => {
                        const nombre = getNombreCompleto(s);
                        const noCtrl = getNoControl(s);
                        const carrera = getCarrera(s);
                        const periodo = getPeriodo(s);
                        const estatus = getEstatus(s);
                        const progreso = getProgreso(s);
                        const statusKey = getStatusKey(s);

                        let estadoClass = "secondary";
                        if (statusKey === "activo") estadoClass = "success";
                        else if (statusKey === "baja") estadoClass = "warning text-dark";
                        else if (/egresado/i.test(estatus)) estadoClass = "primary";
                        else if (/proceso/i.test(estatus)) estadoClass = "info";

                        const studentId = s.id ?? s.student_id ?? s.studentId;

                        return (
                          <tr key={s.id || `${nombre}-${noCtrl}`}>
                            <td>{nombre}</td>
                            <td>{noCtrl}</td>
                            <td>{carrera}</td>
                            <td>{periodo}</td>
                            <td>
                              <div className="d-flex align-items-center">
                                <div className="progress flex-grow-1 me-2" style={{ height: "6px" }}>
                                  <div
                                    className={`progress-bar bg-${
                                      progreso < 30 ? "danger" : progreso < 70 ? "warning" : "success"
                                    }`}
                                    role="progressbar"
                                    style={{ width: `${progreso}%` }}
                                  ></div>
                                </div>
                                <small className="text-muted">{progreso}%</small>
                              </div>
                            </td>
                            <td>
                              <span className={`badge bg-${estadoClass}`}>{estatus}</span>
                            </td>
                            <td>
                              <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => navigate(`/administrator/students/${studentId || ""}`)}
                                disabled={!studentId}
                              >
                                Ver detalle
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card shadow-sm border-0 mt-4">
          <div className="card-header bg-light d-flex justify-content-between align-items-center">
            <div>
              <p className="text-muted mb-0 small">Revision de entregas</p>
              <h5 className="mb-0">Reportes enviados por estudiantes</h5>
            </div>
            <small className="text-muted">
              {subsLoading ? "Cargando..." : `${submissions.length} registros`}
            </small>
          </div>
          <div className="card-body p-0">
            {subsError && (
              <div className="alert alert-danger m-3 mb-0 py-2">{subsError}</div>
            )}

            {subsLoading ? (
              <div className="p-3 text-center text-muted">Cargando...</div>
            ) : submissions.length === 0 ? (
              <div className="p-3 text-center text-muted">Sin entregas aun.</div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Reporte</th>
                      <th>Estudiante</th>
                      <th>Fecha</th>
                      <th>Archivo</th>
                      <th>Estado</th>
                      <th>Calificacion</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.map((sub) => {
                      const student = sub.student || {};
                      const report = sub.report || {};
                      const evidence = report.evidence || {};
                      const submissionPeriod = report.period || {};
                      const estado = sub.status || "enviado";
                      const badge = estado === "aceptado" ? "success" : estado === "rechazado" ? "danger" : "warning";

                      return (
                        <tr key={sub.id}>
                          <td>
                            <div className="fw-semibold">
                              {report.titulo || `Entrega #${sub.id}`}
                            </div>
                            <div className="small text-muted">
                              Reporte
                              {submissionPeriod?.codigo ? ` - ${submissionPeriod.codigo}` : ""}
                            </div>
                          </td>
                          <td>
                            <div className="fw-semibold">{student.Nombre || ""} {student.Apellidos || ""}</div>
                            <div className="small text-muted">{student.No_control || student.id || ""}</div>
                          </td>
                          <td className="small text-muted">
                            {sub.created_at ? new Date(sub.created_at).toLocaleString() : "N/D"}
                          </td>
                          <td>
                          <div className="small">{sub.original_name || "Archivo enviado"}</div>
                          <div className="d-flex flex-wrap gap-2 mt-1">
                            <button
                              className="btn btn-sm btn-outline-secondary"
                              onClick={() => previewSubmission(sub)}
                                disabled={downloadingId === sub.id}
                              >
                                {downloadingId === sub.id ? "Abriendo..." : "Ver"}
                              </button>
                              <button
                                className="btn btn-sm btn-outline-primary mt-1"
                              onClick={() => downloadSubmission(sub)}
                              disabled={downloadingId === sub.id}
                            >
                              {downloadingId === sub.id ? "Descargando..." : "Descargar"}
                            </button>
                          </div>
                          </td>
                          <td>
                            <span className={`badge text-bg-${badge}`}>{estado}</span>
                          </td>
                          <td style={{ minWidth: "140px" }}>
                            <input
                              type="number"
                              className="form-control form-control-sm"
                              placeholder="0 - 100"
                              min="0"
                              max="100"
                              step="0.5"
                              value={
                                grades[sub.id] === undefined ? "" : grades[sub.id]
                              }
                              onChange={(e) =>
                                setGrades((prev) => ({
                                  ...prev,
                                  [sub.id]: e.target.value === "" ? "" : Number(e.target.value),
                                }))
                              }
                            />
                          </td>
                          <td className="d-flex flex-wrap gap-2">
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              placeholder="Feedback (opcional)"
                              value={feedback[sub.id] || ""}
                              onChange={(e) =>
                                setFeedback((prev) => ({ ...prev, [sub.id]: e.target.value }))
                              }
                              style={{ minWidth: "180px" }}
                            />
                            <button
                              className="btn btn-sm btn-outline-success"
                              disabled={updatingId === sub.id}
                              onClick={() => handleStatusChange(sub.id, "aceptado")}
                            >
                              Aceptar
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              disabled={updatingId === sub.id}
                              onClick={() => handleStatusChange(sub.id, "rechazado")}
                            >
                              Rechazar
                            </button>
                            <button
                              className="btn btn-sm btn-primary"
                              disabled={updatingId === sub.id}
                              onClick={() => handleStatusChange(sub.id, sub.status)}
                            >
                              Guardar
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
      </div>

      {previewFile && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100"
          style={{ background: "rgba(0,0,0,0.65)", zIndex: 1050 }}
          onClick={closePreview}
        >
          <div
            className="position-absolute top-50 start-50 translate-middle bg-white rounded shadow-lg"
            style={{ width: "90%", maxWidth: "960px", height: "80vh", padding: "1rem" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="d-flex justify-content-between align-items-center mb-2">
              <div>
                <h5 className="mb-0">Previsualizar archivo</h5>
                <small className="text-muted">{previewFile.name}</small>
              </div>
              <button className="btn btn-sm btn-outline-secondary" onClick={closePreview}>
                Cerrar
              </button>
            </div>
            <div className="h-100 border rounded overflow-hidden">
              <iframe
                title="preview"
                src={previewFile.url}
                style={{ border: "none", width: "100%", height: "100%" }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
