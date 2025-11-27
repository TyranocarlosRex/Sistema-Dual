import React, { useEffect, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";

const API_URL = "http://localhost:8000/api";

const LABEL_TIPO = {
  inscripcion: "Inscripción",
  programa: "Programa (reportes del programa)",
};

export default function StudentReports() {
  const [evidences, setEvidences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
      alert("Selecciona un archivo primero.");
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
      alert("Archivo enviado correctamente.");

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

      // Intenta obtener el nombre del archivo desde el header; usa fallback si no viene.
      const disposition = response.headers["content-disposition"] || "";
      const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/i);
      const rawName = match ? match[1] : null;
      const cleanName = rawName
        ? rawName.replace(/['"]/g, "")
        : `${report.titulo || "reporte"}-adjunto`;

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

  if (loading) return <p className="text-muted">Cargando evidencias...</p>;

  // Si no viene evidence en la URL o no se encontró, mensaje claro
  if (!evidenceId || !selectedEvidence) {
    return (
      <div className="container py-4">
        <h2 className="mb-3">Reportes del programa</h2>
        <p className="text-muted">
          No se encontró la evidencia seleccionada. Vuelve al inicio y elige un
          espacio.
        </p>
        <button
          className="btn btn-secondary btn-sm mt-2"
          onClick={() => navigate("/students-home")}
        >
          Volver al inicio
        </button>
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
        onClick={() => navigate("/students-home")}
      >
        ← Volver a mis evidencias
      </button>
    </div>
  );
}
