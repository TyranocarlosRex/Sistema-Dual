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

  const handleDownload = async (reportId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `${API_URL}/student/reports/${reportId}/attachment`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "blob",
          withCredentials: true,
        }
      );

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "formato_reporte");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error(err);
      alert("No se pudo descargar el archivo.");
    }
  };

  // cuando el alumno elige un archivo
  const handleFileChange = (reportId, file) => {
    setSelectedFiles((prev) => ({
      ...prev,
      [reportId]: file || null,
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
        {reports.map((report) => (
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

                <div className="mt-auto">
                  {/* Descargar formato base */}
                  {report.has_attachment && (
                    <button
                      type="button"
                      className="btn btn-sm btn-primary mb-2"
                      onClick={() => handleDownload(report.id)}
                    >
                      Descargar formato
                    </button>
                  )}

                  {/* SUBIR ARCHIVO DEL ALUMNO */}
                  <div className="mb-2">
                    <small className="d-block text-muted mb-1">
                      Subir tu archivo en PDF (máx. 4 MB)
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
                    disabled={uploading[report.id]}
                  >
                    {uploading[report.id] ? "Enviando..." : "Enviar archivo"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
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