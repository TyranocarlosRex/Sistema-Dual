import React, { useEffect, useState } from "react";
import axios from "axios";

export default function AdministratorReports() {
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fechaLimite, setFechaLimite] = useState("");
  const [attachment, setAttachment] = useState(null);

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
  const fetchReports = async () => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }

      const res = await axios.get('/api/reports', {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

      setReports(res.data);
    } catch (err) {
      console.error(err.response?.status, err.response?.data);
    }
  };

  fetchReports();
}, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const formData = new FormData();
      formData.append("titulo", titulo);
      if (descripcion) formData.append("descripcion", descripcion);
      if (fechaLimite) formData.append("fecha_limite", fechaLimite);
      if (attachment) formData.append("attachment", attachment);

      const res = await axios.post("/api/reports", formData, {
  headers: {
    "Content-Type": "multipart/form-data",
    Authorization: `Bearer ${localStorage.getItem('token')}`, // 👈 aquí
  },
});

      setSuccess("Reporte creado correctamente.");
      setReports((prev) => [res.data, ...prev]);

      setTitulo("");
      setDescripcion("");
      setFechaLimite("");
      setAttachment(null);
    } catch (err) {
      console.error(err);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Ocurrió un error al crear el reporte.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-4">
      <h2 className="mb-3">Reportes / Áreas para subir evidencia</h2>

      <form onSubmit={handleSubmit} className="card p-3 mb-4">
        <div className="mb-3">
          <label className="form-label">Título</label>
          <input
            type="text"
            className="form-control"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Descripción</label>
          <textarea
            className="form-control"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            rows={3}
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Fecha límite (opcional)</label>
          <input
            type="date"
            className="form-control"
            value={fechaLimite}
            onChange={(e) => setFechaLimite(e.target.value)}
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Archivo base (opcional)</label>
          <input
            type="file"
            className="form-control"
            onChange={(e) => setAttachment(e.target.files[0] || null)}
          />
          <div className="form-text">
            Puedes subir un formato, guía o instrucciones en PDF/DOCX, etc.
          </div>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? "Guardando..." : "Crear reporte"}
        </button>
      </form>

      <div className="card p-3">
        <h5 className="mb-3">Reportes creados</h5>
        {reports.length === 0 && (
          <p className="text-muted">No hay reportes aún.</p>
        )}
        {reports.map((report) => (
          <div key={report.id} className="mb-3 border-bottom pb-2">
            <strong>{report.titulo}</strong>
            <div className="small text-muted">
              {report.fecha_limite && `Límite: ${report.fecha_limite}`}{" "}
              {report.has_attachment && " | Tiene archivo base"}
            </div>
            {report.descripcion && (
              <p className="mb-0 mt-1">{report.descripcion}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}