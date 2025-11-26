import React, { useEffect, useState } from "react";
import axios from "axios";

const API_URL = "http://localhost:8000/api"; // si usas baseURL global, puedes quitar esto

const LABEL_TIPO = {
  inscripcion: "Inscripción",
  programa: "Programa (reportes del programa)",
};

export default function StudentReports() {
  const [evidences, setEvidences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  const handleDownload = async (reportId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `${API_URL}/student/report/${reportId}/attachment`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "blob",
          withCredentials: true,
        }
      );

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "formato_reporte"); // luego puedes usar nombre real
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error(err);
      alert("No se pudo descargar el archivo.");
    }
  };

  if (loading) return <p className="text-muted">Cargando evidencias...</p>;

  return (
    <div className="container py-4">
      <h2 className="mb-3">Evidencias del programa</h2>

      {error && <div className="alert alert-danger">{error}</div>}

      {evidences.length === 0 && !error && (
        <p className="text-muted">
          No hay evidencias disponibles por el momento.
        </p>
      )}

      {evidences.map((ev) => (
        <div key={ev.id} className="card mb-3">
          <div className="card-header bg-light d-flex justify-content-between align-items-center">
            <div>
              <strong>{ev.titulo}</strong>
              <span className="badge bg-secondary ms-2">
                {LABEL_TIPO[ev.tipo] || ev.tipo}
              </span>
            </div>
          </div>

          <div className="card-body">
            {ev.descripcion && (
              <p className="card-text mb-3">{ev.descripcion}</p>
            )}

            <h6 className="mb-2">Reportes en este espacio:</h6>

            {(!ev.reports || ev.reports.length === 0) && (
              <p className="text-muted mb-0">
                No hay reportes configurados en este espacio todavía.
              </p>
            )}

            {ev.reports && ev.reports.length > 0 && (
              <ul className="list-group">
                {ev.reports.map((report) => (
                  <li
                    key={report.id}
                    className="list-group-item d-flex justify-content-between align-items-start"
                  >
                    <div className="me-3">
                      <div className="fw-semibold">{report.titulo}</div>
                      {report.fecha_limite && (
                        <div className="text-muted small">
                          Fecha límite: {report.fecha_limite}
                        </div>
                      )}
                      {report.descripcion && (
                        <div className="small">{report.descripcion}</div>
                      )}
                    </div>

                    <div className="d-flex flex-column align-items-end gap-1">
                      {report.has_attachment && (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => handleDownload(report.id)}
                        >
                          Descargar formato
                        </button>
                      )}

                      {/* Aquí luego puedes poner botón para subir el archivo del alumno */}
                      {/* <button className="btn btn-sm btn-success">
                        Subir evidencia
                      </button> */}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}