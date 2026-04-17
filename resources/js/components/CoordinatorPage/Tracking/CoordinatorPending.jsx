import React, { useEffect, useState } from "react";
import axios from "axios";
import { parseDownloadFilename } from "../../../utils/downloadFilename";

export default function CoordinatorPending() {
  const [submissions, setSubmissions] = useState([]);
  const [subsLoading, setSubsLoading] = useState(true);
  const [subsError, setSubsError] = useState("");
  const [feedback, setFeedback] = useState({});
  const [grades, setGrades] = useState({});
  const [updatingId, setUpdatingId] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);

  const getNombreCompleto = (s) => {
    const nombre = s?.Nombre ?? s?.nombre ?? s?.name ?? "";
    const apellidos = s?.Apellidos ?? s?.apellidos ?? s?.last_name ?? "";
    return `${nombre} ${apellidos}`.trim() || "Sin nombre";
  };
  const getNoControl = (s) => s?.No_control ?? s?.no_control ?? s?.noControl ?? "";
  const getPeriodo = (s) => {
    const period = s?.periodo ?? s?.Periodo ?? s?.period ?? null;

    if (!period) return "-";
    if (typeof period === "string" || typeof period === "number") return String(period);
    if (typeof period === "object") {
      return period.codigo ?? period.nombre ?? period.name ?? String(period.id ?? "-");
    }

    return "-";
  };

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        setSubsLoading(true);
        setSubsError("");

        const token = localStorage.getItem("token");
        const { data } = await axios.get("/api/coordinator/report-submissions", {
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
        `/api/coordinator/report-submissions/${submissionId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === submissionId
            ? { ...s, status: payload.status ?? s.status, feedback: payload.feedback, calificacion: payload.calificacion, ...data }
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

  const previewSubmission = async (submission) => {
    try {
      setDownloadingId(submission.id);
      const token = localStorage.getItem("token");

      const { data, headers } = await axios.get(
        `/api/coordinator/report-submissions/${submission.id}/download`,
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
        `/api/coordinator/report-submissions/${submission.id}/download`,
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

  const closePreview = () => {
    if (previewFile?.url) {
      window.URL.revokeObjectURL(previewFile.url);
    }
    setPreviewFile(null);
  };

  return (
    <div className="p-3 p-md-4" style={{ background: "#f5f7fb", minHeight: "100vh" }}>
      <div className="container-fluid" style={{ maxWidth: "1200px" }}>
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-header bg-light">
            <p className="text-muted mb-0 small">Revision de entregas</p>
            <div className="d-flex flex-wrap align-items-center gap-2">
              <h5 className="mb-0">Reportes enviados por estudiantes</h5>
              <small className="text-muted ms-auto">
                {subsLoading ? "Cargando..." : `${submissions.length} registros`}
              </small>
            </div>
            {subsError && <span className="text-danger small">{subsError}</span>}
          </div>
          <div className="card-body p-0">
            {!subsLoading && submissions.length === 0 && !subsError && (
              <p className="text-muted mb-0 p-3">No hay entregas registradas.</p>
            )}

            {submissions.length > 0 && (
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
                    {submissions.map((s) => (
                      <tr key={s.id}>
                        <td className="text-break" style={{ whiteSpace: "normal" }}>
                          <div className="fw-semibold">
                            {s.report?.titulo || `Entrega #${s.id}`}
                          </div>
                          <div className="text-muted small">
                            {getPeriodo(s.report || {})}
                          </div>
                        </td>
                        <td className="text-break" style={{ whiteSpace: "normal" }}>
                          <div className="fw-semibold">{getNombreCompleto(s.student || {})}</div>
                          <div className="text-muted small">{getNoControl(s.student || {})}</div>
                        </td>
                        <td className="small text-muted">
                          {s.created_at ? new Date(s.created_at).toLocaleString() : "-"}
                        </td>
                        <td className="text-break" style={{ whiteSpace: "normal" }}>
                          <div className="text-muted small mb-1 text-break">
                            {s.original_name || s.report?.archivo || s.file_path || "Sin archivo"}
                          </div>
                          <div className="btn-group btn-group-sm" role="group">
                            <button
                              type="button"
                              className="btn btn-outline-secondary"
                              onClick={() => previewSubmission(s)}
                              disabled={downloadingId === s.id}
                            >
                              Ver
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline-primary"
                              onClick={() => downloadSubmission(s)}
                              disabled={downloadingId === s.id}
                            >
                              Descargar
                            </button>
                          </div>
                        </td>
                        <td>
                          <span className="badge bg-warning text-dark text-uppercase">
                            {s.status || "enviado"}
                          </span>
                        </td>
                        <td style={{ maxWidth: "160px" }}>
                          <input
                            type="number"
                            className="form-control form-control-sm"
                            placeholder="0 - 100"
                            value={grades[s.id] ?? ""}
                            onChange={(e) =>
                              setGrades((prev) => ({ ...prev, [s.id]: e.target.value }))
                            }
                          />
                        </td>
                        <td className="text-break" style={{ whiteSpace: "normal" }}>
                          <textarea
                            className="form-control form-control-sm mb-2"
                            placeholder="Feedback (opcional)"
                            rows={2}
                            value={feedback[s.id] || ""}
                            onChange={(e) =>
                              setFeedback((prev) => ({ ...prev, [s.id]: e.target.value }))
                            }
                          />
                          <div className="d-flex flex-wrap gap-2">
                            <button
                              type="button"
                              className="btn btn-success btn-sm"
                              onClick={() => handleStatusChange(s.id, "aceptado")}
                              disabled={updatingId === s.id}
                            >
                              Aceptar
                            </button>
                            <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              onClick={() => handleStatusChange(s.id, "rechazado")}
                              disabled={updatingId === s.id}
                            >
                              Rechazar
                            </button>
                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              onClick={() => handleStatusChange(s.id, s.status)}
                              disabled={updatingId === s.id}
                            >
                              Guardar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {previewFile && (
        <div className="modal d-block" tabIndex="-1" role="dialog">
          <div className="modal-dialog modal-lg" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{previewFile.name}</h5>
                <button type="button" className="btn-close" onClick={closePreview} />
              </div>
              <div className="modal-body">
                <iframe
                  title="preview"
                  src={previewFile.url}
                  style={{ width: "100%", height: "70vh", border: "none" }}
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closePreview}>
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
