import React, { useEffect, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { downloadResponseBlob } from "../../../utils/downloadFilename";
import { useToast } from "../../Shared/ToastProvider";
import { APP_ROUTES } from "../../../routes";
import { getApiErrorMessage } from "../../../utils/errorMessages";

const API_URL = "/api";

const LABEL_TIPO = {
  inscripcion: "Inscripcion",
  programa: "Programa (reportes del programa)",
};

const hasAttachment = (report) => {
  return report?.has_attachment === true || report?.has_attachment === 1 || report?.has_attachment === "1";
};

const getSubmissionTime = (submission) => {
  const value = submission?.created_at || submission?.updated_at;
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
};

const getLatestSubmission = (report) => {
  const submissions = Array.isArray(report?.submissions) ? report.submissions : [];
  if (submissions.length === 0) return null;

  return [...submissions].sort((a, b) => getSubmissionTime(b) - getSubmissionTime(a))[0];
};

const getEvidenceProgress = (evidence) => {
  const reports = Array.isArray(evidence?.reports) ? evidence.reports : [];
  const submittedReports = reports.filter((report) => getLatestSubmission(report));
  const latestSubmission = submittedReports
    .map((report) => getLatestSubmission(report))
    .sort((a, b) => getSubmissionTime(b) - getSubmissionTime(a))[0] || null;

  return {
    total: reports.length,
    submitted: submittedReports.length,
    latestSubmission,
  };
};

const formatFileSize = (bytes = 0) => {
  if (!bytes) return "0 KB";
  const kilobytes = bytes / 1024;
  if (kilobytes < 1024) return `${kilobytes.toFixed(1)} KB`;
  return `${(kilobytes / 1024).toFixed(1)} MB`;
};

const formatDateTime = (value) => {
  if (!value) return "Fecha no disponible";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Fecha no disponible";
  return date.toLocaleString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const buildHistoricalEvidenceGroups = (submissions) => {
  const groups = new Map();

  submissions.forEach((submission) => {
    const report = submission.report || {};
    const evidence = report.evidence || submission.evidence || {};
    const period = submission.period || report.period || {};
    const key = [
      period.id || period.codigo || submission.periodo_id || "periodo",
      evidence.id || evidence.titulo || report.evidence_id || report.titulo || submission.id,
    ].join("-");

    if (!groups.has(key)) {
      groups.set(key, {
        key,
        id: `historical-${key}`,
        titulo: evidence.titulo || report.titulo || `Entrega #${submission.id}`,
        tipo: evidence.tipo || report.tipo || "",
        descripcion: evidence.descripcion || report.descripcion || "",
        fecha_limite: evidence.fecha_limite || report.fecha_limite || null,
        periodLabel: period.codigo || submission.periodo_id || "No disponible",
        reports: [],
        latestTime: 0,
      });
    }

    const group = groups.get(key);
    const submissionTime = getSubmissionTime(submission);
    const reportKey = report.id || submission.report_id || `${report.titulo || "reporte"}-${submission.id}`;
    let reportGroup = group.reports.find((item) => String(item._historyKey) === String(reportKey));

    if (!reportGroup) {
      reportGroup = {
        ...report,
        _historyKey: reportKey,
        id: `historical-${key}-${reportKey}`,
        titulo: report.titulo || `Entrega #${submission.id}`,
        descripcion: report.descripcion || "",
        has_attachment: false,
        submissions: [],
      };
      group.reports.push(reportGroup);
    }

    reportGroup.submissions.push({
      ...submission,
      is_historical: true,
    });
    group.latestTime = Math.max(group.latestTime, submissionTime);
  });

  return [...groups.values()]
    .map((group) => ({
      ...group,
      reports: group.reports
        .map((report) => ({
          ...report,
          submissions: [...report.submissions].sort((a, b) => getSubmissionTime(b) - getSubmissionTime(a)),
        }))
        .sort((a, b) => getSubmissionTime(getLatestSubmission(b)) - getSubmissionTime(getLatestSubmission(a))),
    }))
    .sort((a, b) => b.latestTime - a.latestTime);
};

export default function StudentReports() {
  const { showToast } = useToast();
  const [evidences, setEvidences] = useState([]);
  const [historicalSubmissions, setHistoricalSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState("");
  const [historyError, setHistoryError] = useState("");
  const [activeTab, setActiveTab] = useState("asignado");
  const [selectedHistoricalEvidenceKey, setSelectedHistoricalEvidenceKey] = useState(null);

  const [selectedFiles, setSelectedFiles] = useState({});
  const [uploading, setUploading] = useState({});
  const [uploadError, setUploadError] = useState({});
  const [downloadingAttachment, setDownloadingAttachment] = useState({});
  const [downloadError, setDownloadError] = useState({});
  const [downloadingHistoricalId, setDownloadingHistoricalId] = useState(null);

  const location = useLocation();
  const navigate = useNavigate();

  const searchParams = new URLSearchParams(location.search);
  const evidenceIdParam = searchParams.get("evidencia") ?? searchParams.get("evidence");
  const evidenceId = evidenceIdParam ? Number(evidenceIdParam) : null;

  useEffect(() => {
    const fetchEvidences = async () => {
      try {
        setError("");
        setHistoryError("");
        setHistoryLoading(true);
        const token = localStorage.getItem("token");
        const headers = {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        };
        const [evidencesResult, historyResult] = await Promise.allSettled([
          axios.get(`${API_URL}/student/evidences`, {
            headers,
            withCredentials: true,
          }),
          axios.get(`${API_URL}/student/submissions/history`, {
            headers,
            withCredentials: true,
          }),
        ]);

        if (evidencesResult.status === "fulfilled") {
          setEvidences(evidencesResult.value.data);
        } else {
          console.error(evidencesResult.reason);
          setError(getApiErrorMessage(evidencesResult.reason, "No pudimos cargar tus evidencias. Actualiza la pagina e intenta de nuevo."));
        }

        if (historyResult.status === "fulfilled") {
          setHistoricalSubmissions(historyResult.value.data ?? []);
        } else {
          console.error(historyResult.reason);
          setHistoryError(getApiErrorMessage(historyResult.reason, "No pudimos cargar tus entregas del primer periodo."));
        }
      } catch (err) {
        console.error(err);
        setError(getApiErrorMessage(err, "No pudimos cargar tus evidencias. Actualiza la pagina."));
      } finally {
        setLoading(false);
        setHistoryLoading(false);
      }
    };

    fetchEvidences();
  }, []);

  const selectedEvidence = evidenceId
    ? evidences.find((ev) => ev.id === evidenceId)
    : null;

  const evidenceStatus = (ev) => {
    const reportsEv = ev.reports || [];
    if (reportsEv.length === 0) return "asignado";
    const submitted = reportsEv.filter((r) => r.submissions && r.submissions.length > 0).length;
    if (submitted === 0) return "sinentregar";
    if (submitted === reportsEv.length) return "completada";
    return "asignado";
  };

  const filteredEvidences =
    activeTab === "asignado"
      ? evidences
      : evidences.filter((ev) => evidenceStatus(ev) === activeTab);
  const TABS = [
    { key: "asignado", label: "Asignado" },
    { key: "sinentregar", label: "Sin entregar" },
    { key: "completada", label: "Completada" },
    { key: "anteriores", label: "Primer periodo" },
  ];
  const isHistoryTab = activeTab === "anteriores";
  const historicalEvidenceGroups = buildHistoricalEvidenceGroups(historicalSubmissions);
  const selectedHistoricalEvidence = selectedHistoricalEvidenceKey
    ? historicalEvidenceGroups.find((ev) => ev.key === selectedHistoricalEvidenceKey)
    : null;
  const activeEvidence = selectedHistoricalEvidence || selectedEvidence;
  const isHistoricalEvidenceView = Boolean(selectedHistoricalEvidence);
  const reports = activeEvidence?.reports ?? [];

  const handleFileChange = (reportId, file) => {
    setSelectedFiles((prev) => ({
      ...prev,
      [reportId]: file || null,
    }));
    setUploadError((prev) => ({
      ...prev,
      [reportId]: "",
    }));
  };

  const handleSubmitFile = async (reportId) => {
    const file = selectedFiles[reportId];

    if (!file) {
      showToast({
        title: "Archivo pendiente",
        message: "Selecciona un archivo primero.",
        variant: "warning",
      });
      return;
    }

    try {
      setUploading((prev) => ({ ...prev, [reportId]: true }));
      setUploadError((prev) => ({ ...prev, [reportId]: "" }));

      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("file", file);

      const res = await axios.post(
        `${API_URL}/student/reports/${reportId}/submit`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "Content-Type": "multipart/form-data",
          },
          withCredentials: true,
        }
      );

      console.log("SUBMISSION OK:", res.data);
      showToast({
        title: "Entrega enviada",
        message: "Archivo enviado.",
        variant: "success",
      });

      setSelectedFiles((prev) => ({ ...prev, [reportId]: null }));

      setEvidences((prev) =>
        prev.map((ev) =>
          ev.id === evidenceId
            ? {
                ...ev,
                reports: ev.reports.map((r) =>
                  r.id === reportId
                    ? {
                        ...r,
                        submissions: [res.data],
                      }
                    : r
                ),
              }
            : ev
        )
      );
    } catch (err) {
      console.error(err);
      const message = getApiErrorMessage(err, "No pudimos enviar el archivo. Revisa el formato o tamano.");
      setUploadError((prev) => ({
        ...prev,
        [reportId]: message,
      }));
      showToast({
        title: "Entrega no enviada",
        message,
        variant: "error",
      });
    } finally {
      setUploading((prev) => ({ ...prev, [reportId]: false }));
    }
  };

  const handleDownloadAttachment = async (report) => {
    if (!hasAttachment(report)) return;

    try {
      setDownloadingAttachment((prev) => ({ ...prev, [report.id]: true }));
      setDownloadError((prev) => ({ ...prev, [report.id]: "" }));

      const token = localStorage.getItem("token");

      const response = await axios.get(
        `${API_URL}/student/reports/${report.id}/attachment`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          responseType: "blob",
          withCredentials: true,
        }
      );

      downloadResponseBlob(
        response.data,
        response.headers,
        `${report.titulo || "reporte"}-adjunto`
      );
    } catch (err) {
      console.error(err);
      const message = getApiErrorMessage(err, "No pudimos descargar el archivo base.");
      setDownloadError((prev) => ({
        ...prev,
        [report.id]: message,
      }));
    } finally {
      setDownloadingAttachment((prev) => ({ ...prev, [report.id]: false }));
    }
  };

  const handleDownloadHistoricalSubmission = async (submission) => {
    try {
      setDownloadingHistoricalId(submission.id);
      setHistoryError("");

      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${API_URL}/student/submissions/${submission.id}/download`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          responseType: "blob",
          withCredentials: true,
        }
      );

      downloadResponseBlob(
        response.data,
        response.headers,
        submission.original_name || `entrega-${submission.id}`
      );
    } catch (err) {
      console.error(err);
      setHistoryError(getApiErrorMessage(err, "No pudimos descargar esa entrega."));
    } finally {
      setDownloadingHistoricalId(null);
    }
  };

  if (loading) {
    return (
      <div className="container py-4">
        <p className="text-muted mb-0">Cargando evidencias...</p>
      </div>
    );
  }

  // Si no viene evidence en la URL o no se encontró, mensaje claro
  if (!activeEvidence) {
    return (
      <div className="container py-4">
        <h2 className="mb-3">Mis evidencias</h2>

        {Boolean(evidenceId) && (
          <div className="alert alert-warning py-2">
            No se encontro la evidencia seleccionada, elige una de la lista.
          </div>
        )}

        {error && <div className="alert alert-danger">{error}</div>}

        <div className="d-flex align-items-center gap-3 border-bottom pb-2 mb-3">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                className="btn btn-link p-0"
                style={{
                  textDecoration: "none",
                  color: isActive ? "#0d6efd" : "#1f2937",
                  fontWeight: isActive ? 600 : 500,
                }}
                onClick={() => {
                  setActiveTab(tab.key);
                  setSelectedHistoricalEvidenceKey(null);
                }}
              >
                {tab.label}
                {isActive && (
                  <div
                    style={{
                      height: "3px",
                      backgroundColor: "#0d6efd",
                      borderRadius: "999px",
                      marginTop: "6px",
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {isHistoryTab ? (
          <div>
            {historyError && <div className="alert alert-danger py-2">{historyError}</div>}
            {historyLoading ? (
              <p className="text-muted mb-0">Cargando entregas del primer periodo...</p>
            ) : historicalEvidenceGroups.length === 0 ? (
              <p className="text-muted mb-0">No tienes entregas registradas del primer periodo.</p>
            ) : (
              <div className="row g-3">
                {historicalEvidenceGroups.map((ev) => {
                  const progress = getEvidenceProgress(ev);

                  return (
                    <div key={ev.key} className="col-12 col-md-6">
                      <div className="card h-100 shadow-sm border-0">
                        <div className="card-header bg-light d-flex justify-content-between align-items-center">
                          <h3 className="h6 mb-0">{ev.titulo}</h3>
                          {ev.tipo && (
                            <span className="badge bg-success-subtle text-success">
                              {LABEL_TIPO[ev.tipo] || ev.tipo}
                            </span>
                          )}
                        </div>
                        <div className="card-body">
                          {ev.descripcion && (
                            <p className="mb-2 text-muted small">{ev.descripcion}</p>
                          )}
                          <p className="mb-1 small text-muted">
                            Entregados: {progress.submitted} de {progress.total}
                          </p>
                          <p className="mb-1 small text-muted">
                            Fecha limite: {ev.fecha_limite || "No definida"}
                          </p>
                          <p className="mb-1 small text-muted">
                            Periodo: {ev.periodLabel}
                          </p>
                          {progress.latestSubmission && (
                            <p className="mb-0 small">
                              <strong>Ultimo archivo: </strong>
                              {progress.latestSubmission.original_name || "Archivo enviado"}
                            </p>
                          )}
                        </div>
                        <div className="card-footer bg-transparent border-0">
                          <button
                            type="button"
                            className="btn btn-outline-success btn-sm"
                            onClick={() => setSelectedHistoricalEvidenceKey(ev.key)}
                          >
                            Abrir evidencia
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : filteredEvidences.length === 0 ? (
          <p className="text-muted mb-0">No tienes evidencias asignadas por ahora.</p>
        ) : (
          <div className="row g-3">
            {filteredEvidences.map((ev) => {
              const progress = getEvidenceProgress(ev);

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
                      <p className="mb-1 small text-muted">
                        Entregados: {progress.submitted} de {progress.total}
                      </p>
                      <p className="mb-1 small text-muted">
                        Fecha limite: {ev.fecha_limite || "No definida"}
                      </p>
                      {progress.latestSubmission && (
                        <p className="mb-0 small">
                          <strong>Ultimo archivo: </strong>
                          {progress.latestSubmission.original_name || "Archivo enviado"}
                        </p>
                      )}
                    </div>
                    <div className="card-footer bg-transparent border-0">
                      <button
                        type="button"
                        className="btn btn-outline-success btn-sm"
                        onClick={() => navigate(`${APP_ROUTES.student.evidences}?evidencia=${ev.id}`)}
                      >
                        Abrir evidencia
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="container py-4">
      {/* Encabezado tipo "Mis Reportes Bimestrales" */}
      <div className="d-flex flex-wrap align-items-start justify-content-between gap-3 mb-3">
        <div>
          <p className="text-muted small mb-1">Mis evidencias</p>
          <h1 className="h3 mb-0">{activeEvidence.titulo}</h1>
        </div>
        <button
          type="button"
          className="btn btn-outline-secondary btn-sm rounded-pill px-3"
          onClick={() => {
            if (isHistoricalEvidenceView) {
              setSelectedHistoricalEvidenceKey(null);
              setActiveTab("anteriores");
              return;
            }

            navigate(APP_ROUTES.student.evidences);
          }}
        >
          Volver a evidencias
        </button>
      </div>

      <div className="mb-3">
        <p className="mb-1">
          <strong>Tipo de evidencia: </strong>
          <span className="badge bg-info text-dark">
            {LABEL_TIPO[activeEvidence.tipo] || activeEvidence.tipo}
          </span>
        </p>
        {activeEvidence.descripcion && (
          <p className="mb-0">
            <strong>Descripción: </strong>
            {activeEvidence.descripcion}
          </p>
        )}
        {isHistoricalEvidenceView && (
          <p className="mb-0">
            <strong>Periodo: </strong>
            {activeEvidence.periodLabel || "No disponible"}
          </p>
        )}
        <p className="mb-0">
          <strong>Fecha limite: </strong>
          {activeEvidence.fecha_limite || "No definida"}
        </p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {reports.length === 0 && !error && (
        <p className="text-muted">
          No hay reportes configurados para este espacio.
        </p>
      )}

      <div className="row">
        {reports.map((report) => {
          const mySubmission = getLatestSubmission(report);
          const selectedFile = selectedFiles[report.id] || null;
          const hasSelectedFile = !!selectedFile;
          const isHistoricalSubmission =
            mySubmission?.is_historical === true ||
            mySubmission?.is_historical === 1 ||
            mySubmission?.is_historical === "1";
          const isReadonlyHistoricalReport =
            report?.is_readonly_historical === true ||
            report?.is_readonly_historical === 1 ||
            report?.is_readonly_historical === "1";

          return (
            <div key={report.id} className="col-md-4 mb-3">
              <div className="card h-100">
                <div className="card-header bg-light">
                  <strong>{report.titulo}</strong>
                </div>

                <div className="card-body d-flex flex-column">
                  {report.descripcion && (
                    <p className="card-text">{report.descripcion}</p>
                  )}

                  {hasAttachment(report) && (
                    <div className="mb-2">
                      <p className="mb-1">
                        <strong>Archivo base: </strong>
                      </p>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => handleDownloadAttachment(report)}
                        disabled={downloadingAttachment[report.id]}
                      >
                        {downloadingAttachment[report.id]
                          ? "Descargando..."
                          : "Descargar reporte"}
                      </button>
                      {downloadError[report.id] && (
                        <div className="text-danger small mt-1">
                          {downloadError[report.id]}
                        </div>
                      )}
                    </div>
                  )}

                  {mySubmission && (
                    <div className="mb-2">
                      <p className="mb-1">
                        <strong>Estado actual: </strong>
                        <span
                          className={
                            "badge " +
                            (mySubmission.status === "aceptado"
                              ? "bg-success"
                              : mySubmission.status === "rechazado"
                              ? "bg-danger"
                              : "bg-warning text-dark")
                          }
                        >
                          {mySubmission.status}
                        </span>
                      </p>
                      <p className="mb-0">
                        <strong>Archivo enviado: </strong>
                        {mySubmission.original_name || "Archivo enviado"}
                      </p>
                      {(isHistoricalEvidenceView || isReadonlyHistoricalReport) && (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary mt-2"
                          onClick={() => handleDownloadHistoricalSubmission(mySubmission)}
                          disabled={downloadingHistoricalId === mySubmission.id}
                        >
                          {downloadingHistoricalId === mySubmission.id ? "Descargando..." : "Descargar archivo"}
                        </button>
                      )}
                      {isHistoricalSubmission && (
                        <p className="mb-0 small text-muted">
                          Conservado de un periodo anterior.
                        </p>
                      )}
                    </div>
                  )}

                  <div className="mt-auto">
                    <div className="mb-2">
                      <small className="d-block text-muted mb-1">
                        {isHistoricalEvidenceView || isReadonlyHistoricalReport
                          ? "Consulta esta entrega; la subida esta deshabilitada."
                          : isHistoricalSubmission
                          ? "Puedes conservar este archivo o subir uno nuevo para el periodo actual."
                          : mySubmission
                          ? "Si necesitas corregir, selecciona un nuevo archivo y vuelve a enviarlo."
                          : "Subir tu archivo en PDF (máx. 4 MB)."}
                      </small>
                      <input
                        type="file"
                        className="form-control form-control-sm"
                        accept=".pdf,application/pdf"
                        disabled={isHistoricalEvidenceView || isReadonlyHistoricalReport}
                        onChange={(e) =>
                          handleFileChange(
                            report.id,
                            e.target.files[0] || null
                          )
                        }
                      />
                      <div className="small mt-1">
                        {selectedFile ? (
                          <span className="text-success">
                            Archivo seleccionado: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                          </span>
                        ) : (
                          <span className="text-muted">Ningun archivo seleccionado.</span>
                        )}
                      </div>
                      {uploadError[report.id] && (
                        <div className="text-danger small mt-1">
                          {uploadError[report.id]}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      className="btn btn-sm btn-success"
                      onClick={() => handleSubmitFile(report.id)}
                      disabled={
                        isHistoricalEvidenceView ||
                        isReadonlyHistoricalReport ||
                        uploading[report.id] ||
                        !hasSelectedFile
                      }
                    >
                      {uploading[report.id]
                        ? "Enviando..."
                        : mySubmission &&
                          !isHistoricalSubmission &&
                          !isHistoricalEvidenceView &&
                          !isReadonlyHistoricalReport
                        ? "Reemplazar archivo"
                        : "Enviar archivo"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
