import React, { useEffect, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { parseDownloadFilename } from "../../../utils/downloadFilename";
import { useToast } from "../../Shared/ToastProvider";

const API_URL = "/api";

const LABEL_TIPO = {
  inscripcion: "Inscripcion",
  programa: "Programa (reportes del programa)",
};

export default function StudentReports() {
  const { showToast } = useToast();
  const [evidences, setEvidences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("asignado");

  // estado para subida de archivos
  const [selectedFiles, setSelectedFiles] = useState({});
  const [uploading, setUploading] = useState({});
  const [uploadError, setUploadError] = useState({});
  const [downloadingAttachment, setDownloadingAttachment] = useState({});
  const [downloadError, setDownloadError] = useState({});

  const location = useLocation();
  const navigate = useNavigate();

  // Leer ?evidence=ID de la URL
  const searchParams = new URLSearchParams(location.search);
  const evidenceIdParam = searchParams.get("evidence"); // string | null
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
        if (err.response?.data?.message) {
          setError(err.response.data.message);
        } else {
          setError("No se pudieron cargar las evidencias.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchEvidences();
  }, []);

  // Encontrar SOLO la evidencia seleccionada
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

  // cuando el alumno elige un archivo
  const handleFileChange = (reportId, file) => {
    setSelectedFiles((prev) => ({
      ...prev,
      [reportId]: file || null,
    }));
    // al elegir un nuevo archivo, limpiamos error anterior
    setUploadError((prev) => ({
      ...prev,
      [reportId]: "",
    }));
  };

  // enviar archivo al backend
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
        message: "Archivo enviado correctamente.",
        variant: "success",
      });

      // limpiar input para ese reporte
      setSelectedFiles((prev) => ({ ...prev, [reportId]: null }));

      // actualizar el estado local para reflejar la nueva entrega
      setEvidences((prev) =>
        prev.map((ev) =>
          ev.id === evidenceId
            ? {
                ...ev,
                reports: ev.reports.map((r) =>
                  r.id === reportId
                    ? {
                        ...r,
                        submissions: [res.data], // última entrega del alumno
                      }
                    : r
                ),
              }
            : ev
        )
      );
    } catch (err) {
      console.error(err);
      setUploadError((prev) => ({
        ...prev,
        [reportId]: "No se pudo enviar el archivo.",
      }));
    } finally {
      setUploading((prev) => ({ ...prev, [reportId]: false }));
    }
  };

  const handleDownloadAttachment = async (report) => {
    if (!report.has_attachment) return;

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

      const cleanName = parseDownloadFilename(
        response.headers,
        `${report.titulo || "reporte"}-adjunto`
      );

      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", cleanName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setDownloadError((prev) => ({
        ...prev,
        [report.id]: "No se pudo descargar el archivo.",
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

  // Si no viene evidence en la URL o no se encontró, mensaje claro
  if (!selectedEvidence) {
    return (
      <div className="container py-4">
        <h2 className="mb-3">Mis evidencias</h2>

        {evidenceId && (
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
          <p className="text-muted mb-0">No tienes evidencias asignadas por ahora.</p>
        ) : (
          <div className="row g-3">
            {filteredEvidences.map((ev) => (
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
                      Total de reportes: {ev.reports ? ev.reports.length : 0}
                    </p>
                  </div>
                  <div className="card-footer bg-transparent border-0">
                    <button
                      type="button"
                      className="btn btn-outline-success btn-sm"
                      onClick={() => navigate(`/student-report?evidence=${ev.id}`)}
                    >
                      Abrir evidencia
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="container py-4">
      {/* Encabezado tipo "Mis Reportes Bimestrales" */}
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
          No hay reportes configurados para este espacio por el momento.
        </p>
      )}

      {/* Grid de tarjetas tipo "Evaluación Bimestral 1,2,3" */}
      <div className="row">
        {reports.map((report) => {
          const mySubmission =
            report.submissions && report.submissions.length > 0
              ? report.submissions[0]
              : null;

          const hasSelectedFile = !!selectedFiles[report.id];

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

                  {report.has_attachment && (
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

                  {/* Info de la entrega del alumno */}
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
                    {/* SUBIR / REEMPLAZAR ARCHIVO DEL ALUMNO */}
                    <div className="mb-2">
                      <small className="d-block text-muted mb-1">
                        {mySubmission
                          ? "Si necesitas corregir, selecciona un nuevo archivo y vuelve a enviarlo."
                          : "Subir tu archivo en PDF (máx. 4 MB)."}
                      </small>
                      <input
                        type="file"
                        className="form-control form-control-sm"
                        onChange={(e) =>
                          handleFileChange(
                            report.id,
                            e.target.files[0] || null
                          )
                        }
                      />
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
        onClick={() => navigate("/student-report")}
      >
        &larr; Volver a mis evidencias
      </button>
    </div>
  );
}
