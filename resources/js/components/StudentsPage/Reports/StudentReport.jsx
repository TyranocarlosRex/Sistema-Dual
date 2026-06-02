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

export default function StudentReports() {
  const { showToast } = useToast();
  const [evidences, setEvidences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("asignado");

  const [selectedFiles, setSelectedFiles] = useState({});
  const [uploading, setUploading] = useState({});
  const [uploadError, setUploadError] = useState({});
  const [downloadingAttachment, setDownloadingAttachment] = useState({});
  const [downloadError, setDownloadError] = useState({});

  const location = useLocation();
  const navigate = useNavigate();

  const searchParams = new URLSearchParams(location.search);
  const evidenceIdParam = searchParams.get("evidencia") ?? searchParams.get("evidence");
  const evidenceId = evidenceIdParam ? Number(evidenceIdParam) : null;

  useEffect(() => {
    const fetchEvidences = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_URL}/student/evidences`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
          withCredentials: true,
        });

        console.log("STUDENT EVIDENCES:", res.data);
        setEvidences(res.data);
      } catch (err) {
        console.error(err);
        setError(getApiErrorMessage(err, "No pudimos cargar tus evidencias. Actualiza la pagina."));
      } finally {
        setLoading(false);
      }
    };

    fetchEvidences();
  }, []);

  const selectedEvidence = evidenceId
    ? evidences.find((ev) => ev.id === evidenceId)
    : null;

  const reports = selectedEvidence?.reports ?? [];

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
  ];

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

  if (loading) {
    return (
      <div className="container py-4">
        <p className="text-muted mb-0">Cargando evidencias...</p>
      </div>
    );
  }

  if (!selectedEvidence) {
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
                onClick={() => setActiveTab(tab.key)}
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

        {filteredEvidences.length === 0 ? (
          <p className="text-muted mb-0">No tienes evidencias asignadas.</p>
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
      <h1 className="mb-3">Mis reportes - {selectedEvidence.titulo}</h1>

      <div className="mb-3">
        <p className="mb-1">
          <strong>Tipo de evidencia: </strong>
          <span className="badge bg-info text-dark">
            {LABEL_TIPO[selectedEvidence.tipo] || selectedEvidence.tipo}
          </span>
        </p>
        {selectedEvidence.descripcion && (
          <p className="mb-0">
            <strong>Descripción: </strong>
            {selectedEvidence.descripcion}
          </p>
        )}
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

                  {report.fecha_limite && (
                    <p className="mb-1">
                      <strong>Fecha de entrega: </strong>
                      {report.fecha_limite}
                    </p>
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
                        {mySubmission.original_name}
                      </p>
                    </div>
                  )}

                  <div className="mt-auto">
                    <div className="mb-2">
                      <small className="d-block text-muted mb-1">
                        {mySubmission
                          ? "Selecciona otro archivo para reemplazarlo."
                          : "Subir tu archivo en PDF (máx. 4 MB)."}
                      </small>
                      <input
                        type="file"
                        className="form-control form-control-sm"
                        accept=".pdf,application/pdf"
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
                      disabled={uploading[report.id] || !hasSelectedFile}
                    >
                      {uploading[report.id]
                        ? "Enviando..."
                        : mySubmission
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

      <hr />

      <button
        className="btn btn-link p-0"
        onClick={() => navigate(APP_ROUTES.student.evidences)}
      >
        &larr; Volver a mis evidencias
      </button>
    </div>
  );
}
