import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  downloadResponseBlob,
  previewFileFromResponse,
  revokePreviewFile,
} from "../../../utils/downloadFilename";
import { getApiErrorMessage } from "../../../utils/errorMessages";
import { useToast } from "../../Shared/ToastProvider";

export default function CoordinatorPending() {
  const { showToast } = useToast();
  const [evidences, setEvidences] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [subsLoading, setSubsLoading] = useState(true);
  const [subsError, setSubsError] = useState("");
  const [feedback, setFeedback] = useState({});
  const [grades, setGrades] = useState({});
  const [updatingId, setUpdatingId] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const [expandedEvidenceKeys, setExpandedEvidenceKeys] = useState([]);

  const getNombreCompleto = (s) => {
    const nombre = s?.Nombre ?? s?.nombre ?? s?.name ?? "";
    const apellidos = s?.Apellidos ?? s?.apellidos ?? s?.last_name ?? "";
    return `${nombre} ${apellidos}`.trim() || "Sin nombre";
  };
  const getNoControl = (s) => s?.No_control ?? s?.no_control ?? s?.noControl ?? "";
  const getEvidence = (submission) => submission?.report?.evidence ?? submission?.evidence ?? {};
  const parseDateValue = (value) => {
    if (!value) return null;
    const date =
      typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
        ? new Date(`${value}T00:00:00`)
        : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  };
  const formatDate = (value) => {
    const date = parseDateValue(value);
    return date ? date.toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" }) : "";
  };
  const formatDateTime = (value) => {
    const date = parseDateValue(value);
    return date ? date.toLocaleString("es-MX", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "";
  };
  const statusBadgeClass = (status) => {
    if (status === "aceptado") return "badge bg-success";
    if (status === "rechazado") return "badge bg-danger";
    return "badge bg-warning text-dark";
  };
  const getAssignedStudentsCount = (evidence) => {
    const value = Number(
      evidence?.assigned_students_count ??
        evidence?.visible_students_count ??
        evidence?.assignedStudentsCount ??
        evidence?.assigned_count
    );
    return Number.isFinite(value) ? value : null;
  };
  const getPeriodo = (s) => {
    const period = s?.periodo ?? s?.Periodo ?? s?.period ?? null;

    if (!period) return "-";
    if (typeof period === "string" || typeof period === "number") return String(period);
    if (typeof period === "object") {
      return period.codigo ?? period.nombre ?? period.name ?? String(period.id ?? "-");
    }

    return "-";
  };

  const groupedSubmissions = useMemo(() => {
    const groups = new Map();

    evidences.forEach((evidence) => {
      const title = evidence?.titulo || evidence?.title || "Sin evidencia";
      const key = evidence?.id ? `evidence-${evidence.id}` : `evidence-${title}`;
      const reports = Array.isArray(evidence?.reports) ? evidence.reports : [];

      if (!groups.has(key)) {
        groups.set(key, {
          key,
          title,
          type: evidence?.tipo || evidence?.type || "",
          deadline: evidence?.fecha_limite || evidence?.deadline || "",
          createdAt: evidence?.created_at || evidence?.createdAt || reports[0]?.created_at,
          assignedStudentsCount: getAssignedStudentsCount(evidence),
          reportIds: new Set(),
          submissions: [],
        });
      }

      const group = groups.get(key);
      reports.forEach((report) => {
        if (report?.id) {
          group.reportIds.add(report.id);
        }
      });
    });

    submissions.forEach((submission) => {
      const evidence = getEvidence(submission);
      const title = evidence?.titulo || evidence?.title || "Sin evidencia";
      const key = evidence?.id ? `evidence-${evidence.id}` : `evidence-${title}`;

      if (!groups.has(key)) {
        groups.set(key, {
          key,
          title,
          type: evidence?.tipo || evidence?.type || "",
          deadline: evidence?.fecha_limite || evidence?.deadline || "",
          createdAt: evidence?.created_at || evidence?.createdAt || submission?.report?.created_at || submission?.created_at,
          assignedStudentsCount: getAssignedStudentsCount(evidence),
          reportIds: new Set(),
          submissions: [],
        });
      }

      const group = groups.get(key);
      const assignedStudentsCount = getAssignedStudentsCount(evidence);
      if (assignedStudentsCount !== null) {
        group.assignedStudentsCount = Math.max(group.assignedStudentsCount ?? 0, assignedStudentsCount);
      }
      if (submission?.report?.id) {
        group.reportIds.add(submission.report.id);
      }
      group.submissions.push(submission);
    });

    return Array.from(groups.values())
      .map((group) => {
        const fallbackCount = group.reportIds.size || group.submissions.length;
        return {
          ...group,
          assignedCount: group.assignedStudentsCount ?? fallbackCount,
        };
      })
      .sort((a, b) => {
        const aTime = parseDateValue(a.createdAt)?.getTime() ?? 0;
        const bTime = parseDateValue(b.createdAt)?.getTime() ?? 0;
        if (aTime !== bTime) return bTime - aTime;
        return a.title.localeCompare(b.title);
      });
  }, [evidences, submissions]);

  const allGroupsExpanded =
    groupedSubmissions.length > 0 && groupedSubmissions.every((group) => expandedEvidenceKeys.includes(group.key));

  const toggleEvidenceGroup = (key) => {
    setExpandedEvidenceKeys((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]
    );
  };

  const toggleAllGroups = () => {
    setExpandedEvidenceKeys(allGroupsExpanded ? [] : groupedSubmissions.map((group) => group.key));
  };

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        setSubsLoading(true);
        setSubsError("");

        const token = localStorage.getItem("token");
        const [submissionsResponse, evidencesResponse] = await Promise.all([
          axios.get("/api/coordinator/report-submissions", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get("/api/coordinator/evidences", {
            headers: { Authorization: `Bearer ${token}` },
            params: { with_reports: 1, only_with_reports: 1 },
          }),
        ]);

        const list = submissionsResponse.data ?? [];
        setSubmissions(list);
        setEvidences(evidencesResponse.data ?? []);

        const initialGrades = {};
        list.forEach((s) => {
          if (s.calificacion !== undefined && s.calificacion !== null) {
            initialGrades[s.id] = s.calificacion;
          }
        });
        setGrades(initialGrades);
      } catch (err) {
        console.error("Error cargando entregas:", err);
        setSubsError(getApiErrorMessage(err, "No pudimos cargar las entregas. Actualiza la pagina."));
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
      showToast({
        title: "Entrega no actualizada",
        message: getApiErrorMessage(err, "No pudimos guardar el cambio de estado."),
        variant: "error",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSubmissionFile = async (submission, preview = false) => {
    try {
      setDownloadingId(submission.id);
      const token = localStorage.getItem("token");

      const action = preview ? "preview" : "download";
      const { data, headers } = await axios.get(
        `/api/coordinator/report-submissions/${submission.id}/${action}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "blob",
        }
      );

      const fallback = submission.original_name || `entrega-${submission.id}`;

      if (preview) {
        setPreviewFile(previewFileFromResponse(data, headers, fallback));
        return;
      }

      downloadResponseBlob(data, headers, fallback);
    } catch (err) {
      console.error(err);
      showToast({
        title: preview ? "Vista previa no disponible" : "Descarga no disponible",
        message: getApiErrorMessage(
          err,
          preview
            ? "No pudimos abrir la vista previa del archivo."
            : "No pudimos descargar el archivo."
        ),
        variant: "error",
      });
    } finally {
      setDownloadingId(null);
    }
  };

  const previewSubmission = (submission) => handleSubmissionFile(submission, true);
  const downloadSubmission = (submission) => handleSubmissionFile(submission);

  const closePreview = () => {
    revokePreviewFile(previewFile);
    setPreviewFile(null);
  };

  return (
    <div className="p-3 p-md-4" style={{ background: "#f5f7fb", minHeight: "100vh" }}>
      <div className="container-fluid" style={{ maxWidth: "1200px" }}>
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-header bg-light">
            <p className="text-muted mb-0 small">Revision de entregas</p>
            <div className="d-flex flex-wrap align-items-center gap-2">
              <h5 className="mb-0">Entregas pendientes por evidencia</h5>
              <small className="text-muted ms-auto">
                {subsLoading ? "Cargando..." : `${groupedSubmissions.length} evidencias, ${submissions.length} registros`}
              </small>
            </div>
            {subsError && <span className="text-danger small">{subsError}</span>}
          </div>
          <div className="card-body p-0">
            {!subsLoading && groupedSubmissions.length === 0 && !subsError && (
              <p className="text-muted mb-0 p-3">No hay evidencias configuradas para el periodo actual.</p>
            )}

            {groupedSubmissions.length > 0 && (
              <div className="p-3">
                <div className="d-flex justify-content-end mb-2">
                  <button type="button" className="btn btn-link btn-sm text-decoration-none" onClick={toggleAllGroups}>
                    {allGroupsExpanded ? "Contraer todo" : "Expandir todo"}
                  </button>
                </div>
                <div className="d-grid gap-3">
                  {groupedSubmissions.map((group) => {
                    const isOpen = expandedEvidenceKeys.includes(group.key);

                    return (
                      <div key={group.key} className="border rounded-3 overflow-hidden" style={{ background: "#eef2f7" }}>
                        <div className="d-flex flex-wrap align-items-center gap-3 p-3 border-bottom">
                          <div
                            className="d-flex align-items-center justify-content-center rounded-3 text-primary"
                            style={{ width: "36px", height: "36px", background: "#dbeafe" }}
                          >
                            <span className="fw-bold">E</span>
                          </div>
                          <div className="flex-grow-1">
                            <div className="fw-semibold">{group.title}</div>
                            <div className="text-muted small">
                              {group.createdAt ? `Publicado: ${formatDateTime(group.createdAt)}` : "Publicado: N/D"}
                            </div>
                          </div>
                          <button
                            type="button"
                            className="btn btn-sm btn-link text-dark text-decoration-none"
                            aria-expanded={isOpen}
                            onClick={() => toggleEvidenceGroup(group.key)}
                          >
                            {isOpen ? "^" : "v"}
                          </button>
                        </div>

                        <div className="d-flex flex-wrap justify-content-between gap-3 p-3">
                          <div>
                            <div className="fw-semibold small">
                              {group.deadline ? `Fecha limite: ${formatDate(group.deadline)}` : "Sin fecha limite"}
                            </div>
                            {group.type && <div className="text-muted small mt-1">Tipo: {group.type}</div>}
                          </div>
                          <div className="d-flex align-items-center gap-3">
                            <div className="text-center border-start ps-3">
                              <div className="fs-4 lh-1">{group.submissions.length}</div>
                              <div className="small text-muted">Entregadas</div>
                            </div>
                            <div className="text-center border-start ps-3">
                              <div className="fs-4 lh-1">{group.assignedCount}</div>
                              <div className="small text-muted">Asignados</div>
                            </div>
                          </div>
                        </div>

                        <div className="p-3 border-top">
                          <button
                            type="button"
                            className="btn btn-outline-primary rounded-pill px-4"
                            onClick={() => toggleEvidenceGroup(group.key)}
                          >
                            {isOpen ? "Ocultar entregas" : "Ver entregas"}
                          </button>
                        </div>

                        {isOpen && (
                          <div className="bg-white border-top p-3">
                            <div className="d-grid gap-3">
                              {group.submissions.length === 0 && (
                                <div className="border rounded p-3 text-muted small">
                                  Todavia no hay entregas registradas para esta evidencia.
                                </div>
                              )}
                              {group.submissions.map((s) => (
                                <div key={s.id} className="border rounded p-3">
                                  <div className="d-flex flex-wrap justify-content-between gap-2 mb-2">
                                    <div>
                                      <div className="fw-semibold">{getNombreCompleto(s.student || {})}</div>
                                      <div className="text-muted small">
                                        {getNoControl(s.student || {}) || "Sin numero de control"}
                                      </div>
                                    </div>
                                    <span className={statusBadgeClass(s.status)}>
                                      {s.status || "enviado"}
                                    </span>
                                  </div>
                                  <div className="row g-3">
                                    <div className="col-12 col-lg-4">
                                      <div className="small text-muted">Reporte</div>
                                      <div className="fw-semibold">{s.report?.titulo || `Entrega #${s.id}`}</div>
                                      <div className="small text-muted">{getPeriodo(s.report || {})}</div>
                                      <div className="small text-muted mt-2">
                                        {s.created_at ? `Enviado: ${formatDateTime(s.created_at)}` : "Fecha no disponible"}
                                      </div>
                                    </div>
                                    <div className="col-12 col-lg-4">
                                      <div className="small text-muted mb-1">
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
                                    </div>
                                    <div className="col-12 col-lg-4">
                                      <input
                                        type="number"
                                        className="form-control form-control-sm mb-2"
                                        placeholder="Calificacion 0 - 100"
                                        value={grades[s.id] ?? ""}
                                        onChange={(e) =>
                                          setGrades((prev) => ({ ...prev, [s.id]: e.target.value }))
                                        }
                                      />
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
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
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
