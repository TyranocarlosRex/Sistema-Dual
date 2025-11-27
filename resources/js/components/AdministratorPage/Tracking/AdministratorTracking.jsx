import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

export default function CoordinatorReports() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [submissions, setSubmissions] = useState([]);
  const [subsLoading, setSubsLoading] = useState(true);
  const [subsError, setSubsError] = useState("");
  const [feedback, setFeedback] = useState({});
  const [updatingId, setUpdatingId] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  // filtros
  const [filterCarrera, setFilterCarrera] = useState("todos");
  const [filterEstatus, setFilterEstatus] = useState("todos");
  const [search, setSearch]               = useState("");

  // cargar estudiantes reales del backend
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
          // si tu backend usa paginación, puedes pedir más por página:
          params: {
            per_page: 200,
            rol: "student",
          },
          withCredentials: true,
        });

        // si tu endpoint regresa { data: [...] } (paginado):
        const data = Array.isArray(res.data?.data) ? res.data.data : res.data;

        setStudents(data);
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

        setSubmissions(data ?? []);
      } catch (err) {
        console.error("Error cargando entregas:", err);
        setSubsError("No se pudieron cargar las entregas.");
      } finally {
        setSubsLoading(false);
      }
    };

    fetchSubmissions();
  }, []);

  // helpers para leer campos con nombres distintos
  const getCarrera = (s) =>
    s.carrera ?? s.Carrera ?? s.career ?? "Sin carrera";

  const getEstatus = (s) =>
    s.estatus ?? s.Estatus ?? s.status ?? "Sin estatus";

  const getNombreCompleto = (s) => {
    const nombre   = s.Nombre ?? s.nombre ?? s.name ?? "";
    const apellidos = s.Apellidos ?? s.apellidos ?? s.last_name ?? "";
    return `${nombre} ${apellidos}`.trim() || "Sin nombre";
  };

  const getNoControl = (s) =>
    s.No_control ?? s.no_control ?? s.noControl ?? "";

  const getPeriodo = (s) =>
    s.periodo ?? s.Periodo ?? s.period ?? "—";

  // carreras únicas (para el filtro y el card)
  const carreras = useMemo(() => {
    const set = new Set();
    students.forEach((s) => set.add(getCarrera(s)));
    return Array.from(set);
  }, [students]);

  // estatus únicos (para filtros / métricas)
  const estados = useMemo(() => {
    const set = new Set();
    students.forEach((s) => set.add(getEstatus(s)));
    return Array.from(set);
  }, [students]);

  // aplicar filtros + búsqueda
  const filteredStudents = useMemo(() => {
    const searchLower = search.toLowerCase();

    return students.filter((s) => {
      const carrera = getCarrera(s);
      const estatus = getEstatus(s);
      const nombre  = getNombreCompleto(s);
      const noCtrl  = getNoControl(s);

      if (filterCarrera !== "todos" && carrera !== filterCarrera) {
        return false;
      }

      if (filterEstatus !== "todos" && estatus !== filterEstatus) {
        return false;
      }

      if (searchLower) {
        const texto = `${nombre} ${noCtrl}`.toLowerCase();
        if (!texto.includes(searchLower)) return false;
      }

      return true;
    });
  }, [students, filterCarrera, filterEstatus, search]);

  const totalFiltrados = filteredStudents.length;

  // datos para "Estudiantes por carrera" (usando SOLO filtrados)
  const estudiantesPorCarrera = useMemo(() => {
    const counts = {};
    filteredStudents.forEach((s) => {
      const carrera = getCarrera(s);
      counts[carrera] = (counts[carrera] || 0) + 1;
    });
    return counts;
  }, [filteredStudents]);

  // distribución por estatus (card "Estatus de estudiantes")
  const estudiantesPorEstatus = useMemo(() => {
    const counts = {};
    filteredStudents.forEach((s) => {
      const estatus = getEstatus(s);
      counts[estatus] = (counts[estatus] || 0) + 1;
    });
    return counts;
  }, [filteredStudents]);

  // función simple para "progreso" mientras no tengas un campo real
  const getProgreso = (s) => {
    // algo determinista para que no cambie a cada render
    const base = Number(s.id ?? 0);
    return (base * 17) % 101; // 0 - 100
  };

  const handleStatusChange = async (submissionId, status) => {
    try {
      setUpdatingId(submissionId);
      const token = localStorage.getItem("token");
      await axios.patch(
        `/api/admin/report-submissions/${submissionId}`,
        { status, feedback: feedback[submissionId] || "" },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSubmissions((prev) =>
        prev.map((s) => (s.id === submissionId ? { ...s, status } : s))
      );
      setFeedback((prev) => ({ ...prev, [submissionId]: "" }));
    } catch (err) {
      console.error(err);
      alert("No se pudo actualizar el estado.");
    } finally {
      setUpdatingId(null);
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

      const disposition = headers["content-disposition"] || "";
      const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/i);
      const rawName = match ? match[1] : null;
      const filename = rawName
        ? rawName.replace(/['"]/g, "")
        : submission.original_name || `entrega-${submission.id}`;

      const blob = new Blob([data]);
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

  return (
    <div className="container-fluid mt-4">
      <div className="card">
        <div className="card-header bg-white border-bottom-0 d-flex justify-content-between align-items-center">
          <h4 className="mb-0">Seguimiento de estudiantes</h4>

          {/* Filtros principales */}
          <div className="d-flex gap-2">
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="Buscar por nombre o No. de control..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ minWidth: "220px" }}
            />

            <select
              className="form-select form-select-sm"
              value={filterCarrera}
              onChange={(e) => setFilterCarrera(e.target.value)}
            >
              <option value="todos">Todas las carreras</option>
              {carreras.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <select
              className="form-select form-select-sm"
              value={filterEstatus}
              onChange={(e) => setFilterEstatus(e.target.value)}
            >
              <option value="todos">Todos los estatus</option>
              {estados.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="card-body">
          {loading && <p className="text-muted">Cargando estudiantes…</p>}
          {error && (
            <div className="alert alert-danger py-2 mb-3">
              {error}
            </div>
          )}

          {!loading && !error && (
            <div className="row">
              {/* Estudiantes por carrera (usando datos filtrados) */}
              <div className="col-md-6 mb-4">
                <div className="card h-100 border">
                  <div className="card-header bg-light d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">Estudiantes por Carrera</h5>
                    <span className="badge bg-secondary">
                      {totalFiltrados} estudiante(s)
                    </span>
                  </div>
                  <div className="card-body">
                    {carreras.length === 0 && (
                      <p className="text-muted mb-0">
                        No hay estudiantes registrados.
                      </p>
                    )}

                    {carreras.length > 0 &&
                      carreras.map((carrera, index) => {
                        const cantidad = estudiantesPorCarrera[carrera] || 0;
                        const porcentaje =
                          totalFiltrados > 0
                            ? Math.round((cantidad / totalFiltrados) * 100)
                            : 0;

                        return (
                          <div key={index} className="mb-3">
                            <div className="d-flex justify-content-between mb-1">
                              <span className="small">{carrera}</span>
                              <span className="small fw-bold">
                                {cantidad} ({porcentaje}%)
                              </span>
                            </div>
                            <div
                              className="progress"
                              style={{ height: "8px" }}
                            >
                              <div
                                className="progress-bar"
                                role="progressbar"
                                style={{
                                  width: `${porcentaje}%`,
                                  backgroundColor: `hsl(${
                                    index * 90
                                  }, 70%, 50%)`,
                                }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>

              {/* Distribución por estatus (en vez de números random) */}
              <div className="col-md-6 mb-4">
                <div className="card h-100 border">
                  <div className="card-header bg-light">
                    <h5 className="mb-0">Estatus de estudiantes</h5>
                  </div>
                  <div className="card-body">
                    {estados.length === 0 && (
                      <p className="text-muted mb-0">
                        No hay estatus registrados.
                      </p>
                    )}

                    {estados.length > 0 && (
                      <ul className="list-group list-group-flush">
                        {estados.map((estado, index) => {
                          const cantidad = estudiantesPorEstatus[estado] || 0;
                          return (
                            <li
                              key={index}
                              className="list-group-item d-flex justify-content-between align-items-center px-0"
                            >
                              <span className="text-truncate" title={estado}>
                                {estado}
                              </span>
                              <span className="badge bg-primary rounded-pill">
                                {cantidad}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </div>
              </div>

              {/* Progreso de estudiantes (tabla con datos filtrados) */}
              <div className="col-12">
                <div className="card border">
                  <div className="card-header bg-light d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">Progreso de Estudiantes</h5>
                    <span className="text-muted small">
                      Mostrando {Math.min(totalFiltrados, 20)} de{" "}
                      {totalFiltrados}
                    </span>
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
                            const nombre   = getNombreCompleto(s);
                            const noCtrl   = getNoControl(s);
                            const carrera  = getCarrera(s);
                            const periodo  = getPeriodo(s);
                            const estatus  = getEstatus(s);
                            const progreso = getProgreso(s);

                            let estadoClass = "secondary";
                            if (/activo/i.test(estatus)) estadoClass = "success";
                            else if (/baja/i.test(estatus)) estadoClass = "warning";
                            else if (/egresado/i.test(estatus)) estadoClass = "primary";
                            else if (/proceso/i.test(estatus)) estadoClass = "info";

                            return (
                              <tr key={s.id}>
                                <td>{nombre}</td>
                                <td>{noCtrl}</td>
                                <td>{carrera}</td>
                                <td>{periodo}</td>
                                <td>
                                  <div className="d-flex align-items-center">
                                    <div
                                      className="progress flex-grow-1 me-2"
                                      style={{ height: "6px" }}
                                    >
                                      <div
                                        className={`progress-bar bg-${
                                          progreso < 30
                                            ? "danger"
                                            : progreso < 70
                                            ? "warning"
                                            : "success"
                                        }`}
                                        role="progressbar"
                                        style={{ width: `${progreso}%` }}
                                      ></div>
                                    </div>
                                    <small className="text-muted">
                                      {progreso}%
                                    </small>
                                  </div>
                                </td>
                                <td>
                                  <span className={`badge bg-${estadoClass}`}>
                                    {estatus}
                                  </span>
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
              {/* fin tabla */}
            </div>
          )}
        </div>
      </div>

      {/* Entregas de reportes (admin) */}
      <div className="card mt-4">
        <div className="card-header bg-white border-bottom-0 d-flex justify-content-between align-items-center">
          <div>
            <p className="text-muted mb-0 small">Revisión de entregas</p>
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
            <div className="p-3 text-center text-muted">Cargando…</div>
          ) : submissions.length === 0 ? (
            <div className="p-3 text-center text-muted">Sin entregas aún.</div>
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
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((sub) => {
                    const student = sub.student || {};
                    const report = sub.report || {};
                    const estado = sub.status || "enviado";
                    const badge =
                      estado === "aceptado"
                        ? "success"
                        : estado === "rechazado"
                        ? "danger"
                        : "warning";

                    return (
                      <tr key={sub.id}>
                        <td>
                          <div className="fw-semibold">
                            {report.titulo || `Reporte #${report.id || ""}`}
                          </div>
                          <div className="small text-muted">
                            {report.tipo || "Reporte"}
                          </div>
                        </td>
                        <td>
                          <div className="fw-semibold">
                            {student.Nombre} {student.Apellidos}
                          </div>
                          <div className="small text-muted">
                            {student.No_control || student.id || ""}
                          </div>
                        </td>
                        <td className="small text-muted">
                          {sub.created_at
                            ? new Date(sub.created_at).toLocaleString()
                            : "N/D"}
                        </td>
                        <td>
                          <div className="small">
                            {sub.original_name || "Archivo enviado"}
                          </div>
                          <button
                            className="btn btn-sm btn-outline-primary mt-1"
                            onClick={() => downloadSubmission(sub)}
                            disabled={downloadingId === sub.id}
                          >
                            {downloadingId === sub.id
                              ? "Descargando..."
                              : "Descargar"}
                          </button>
                        </td>
                        <td>
                          <span className={`badge text-bg-${badge}`}>
                            {estado}
                          </span>
                        </td>
                        <td className="d-flex gap-2">
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            placeholder="Feedback (opcional)"
                            value={feedback[sub.id] || ""}
                            onChange={(e) =>
                              setFeedback((prev) => ({
                                ...prev,
                                [sub.id]: e.target.value,
                              }))
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
  );
}
