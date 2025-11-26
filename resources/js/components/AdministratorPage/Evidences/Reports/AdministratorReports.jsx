import React, { useEffect, useState } from "react";
import axios from "axios";

export default function AdministratorReports() {
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fechaLimite, setFechaLimite] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [tipo, setTipo] = useState("programa"); // tipo de reporte

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [editingId, setEditingId] = useState(null); // 👈 NUEVO: id que se está editando

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const token = localStorage.getItem("token");
        if (token) {
          axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        }

        const res = await axios.get("/api/reports", {
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

  const resetForm = () => {
    setTitulo("");
    setDescripcion("");
    setFechaLimite("");
    setAttachment(null);
    setTipo("programa");
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const formData = new FormData();
      formData.append("titulo", titulo);
      formData.append("tipo", tipo);
      if (descripcion) formData.append("descripcion", descripcion);
      if (fechaLimite) formData.append("fecha_limite", fechaLimite);
      if (attachment) formData.append("attachment", attachment);

      let url = "/api/reports";

      if (editingId) {
        // estamos editando → spoof de método PUT
        formData.append("_method", "PUT");
        url = `/api/reports/${editingId}`;
      }

      const res = await axios.post(url, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (editingId) {
        setSuccess("Reporte actualizado correctamente.");
        const updated = res.data;
        setReports((prev) =>
          prev.map((r) => (r.id === updated.id ? updated : r))
        );
      } else {
        setSuccess("Reporte creado correctamente.");
        setReports((prev) => [res.data, ...prev]);
      }

      resetForm();
    } catch (err) {
      console.error(err);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Ocurrió un error al guardar el reporte.");
      }
    } finally {
      setLoading(false);
    }
  };

  // 👇 Cuando se da clic en "Editar"
  const startEdit = (report) => {
    setEditingId(report.id);
    setTitulo(report.titulo);
    setDescripcion(report.descripcion || "");
    setFechaLimite(report.fecha_limite || "");
    setTipo(report.tipo || "programa");
    setAttachment(null); // no podemos prellenar el input file
    setError("");
    setSuccess("");
  };

  const cancelEdit = () => {
    resetForm();
    setError("");
    setSuccess("");
  };

  return (
    <div className="container py-4">
      <h2 className="mb-3">
        {editingId ? "Editar reporte" : "Reportes / Áreas para subir evidencia"}
      </h2>

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
          <label className="form-label">Tipo de reporte</label>
          <select
            className="form-select"
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
          >
            <option value="inscripcion">Inscripción (todos los alumnos)</option>
            <option value="programa">Programa (solo activos)</option>
          </select>
          <div className="form-text">
            Los de inscripción se muestran a todos; los del programa solo a estudiantes activos.
          </div>
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

        <div className="d-flex gap-2">
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading
              ? "Guardando..."
              : editingId
              ? "Guardar cambios"
              : "Crear reporte"}
          </button>

          {editingId && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={cancelEdit}
            >
              Cancelar edición
            </button>
          )}
        </div>
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
              {report.tipo && `[${report.tipo}] `}
              {report.fecha_limite && ` | Límite: ${report.fecha_limite}`}{" "}
              {report.has_attachment && " | Tiene archivo base"}
            </div>
            {report.descripcion && (
              <p className="mb-0 mt-1">{report.descripcion}</p>
            )}

            <button
              type="button"
              className="btn btn-sm btn-outline-secondary mt-2"
              onClick={() => startEdit(report)}
            >
              Editar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}