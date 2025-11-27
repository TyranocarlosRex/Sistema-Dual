import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

/**
 * Seguimiento para coordinadores: lista entregas de reportes
 * y permite validar/descargar.
 */
export default function CoordinatorTracking() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [feedback, setFeedback] = useState({});
  const [downloadingId, setDownloadingId] = useState(null);

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");
        const { data } = await axios.get("/api/coordinator/report-submissions", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSubmissions(data ?? []);
      } catch (err) {
        console.error(err);
        setError("No se pudieron cargar las entregas.");
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchData();
    else setLoading(false);
  }, [token]);

  const stats = useMemo(() => {
    const total = submissions.length;
    const pendientes = submissions.filter((s) => s.status === "enviado").length;
    const aceptados = submissions.filter((s) => s.status === "aceptado").length;
    const rechazados = submissions.filter((s) => s.status === "rechazado").length;
    return { total, pendientes, aceptados, rechazados };
  }, [submissions]);

  const handleStatusChange = async (submissionId, status) => {
    try {
      setUpdatingId(submissionId);
      await axios.patch(
        `/api/coordinator/report-submissions/${submissionId}`,
        { status, feedback: feedback[submissionId] || "" },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
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
      const { data, headers } = await axios.get(
        `/api/coordinator/report-submissions/${submission.id}/download`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "blob",
        }
      );

      // try to read filename from header
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
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <p className="text-muted mb-0 small">Seguimiento</p>
          <h4 className="mb-0">Entregas de reportes</h4>
        </div>
        <small className="text-muted">
          {loading ? "Cargando..." : `${submissions.length} registros`}
        </small>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="row g-3 mb-3">
        <div className="col-6 col-md-3">
          <div className="border rounded p-3 h-100 bg-light">
            <p className="text-muted mb-1 small">Total</p>
            <div className="h4 mb-0">{stats.total}</div>
            <small className="text-secondary">Entregas registradas</small>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="border rounded p-3 h-100 bg-light">
            <p className="text-muted mb-1 small">Pendientes</p>
            <div className="h4 mb-0">{stats.pendientes}</div>
            <small className="text-secondary">En espera de revisión</small>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="border rounded p-3 h-100 bg-light">
            <p className="text-muted mb-1 small">Aceptados</p>
            <div className="h4 mb-0">{stats.aceptados}</div>
            <small className="text-secondary">Validados</small>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="border rounded p-3 h-100 bg-light">
            <p className="text-muted mb-1 small">Rechazados</p>
            <div className="h4 mb-0">{stats.rechazados}</div>
            <small className="text-secondary">Requieren corrección</small>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header bg-light d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Detalle de entregas</h5>
          <span className="text-muted small">Acciones por entrega</span>
        </div>
        <div className="card-body p-0">
          {loading ? (
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
                            {downloadingId === sub.id ? "Descargando..." : "Descargar"}
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
