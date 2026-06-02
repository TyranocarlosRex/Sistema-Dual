import React, { useEffect, useState } from "react";
import axios from "axios";
import { getApiErrorMessage } from "../../../../utils/errorMessages";

const HERO_STYLE = {
  background: "linear-gradient(135deg, #1d4ed8 0%, #1e293b 100%)",
  color: "#fff",
  borderRadius: "16px",
  padding: "18px 20px",
  boxShadow: "0 22px 40px -32px rgba(29, 78, 216, 0.6)",
};

const buildAuthConfig = (overrides = {}) => {
  const token = localStorage.getItem("token");

  return {
    ...overrides,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(overrides.headers || {}),
    },
  };
};

const hasAttachment = (report) => {
  return report?.has_attachment === true || report?.has_attachment === 1 || report?.has_attachment === "1";
};

export default function AdministratorReports({
  embedded = false,
  evidenceId = null,
  onChange,
}) {
  const fixedEvidenceId = evidenceId ? String(evidenceId) : "";

  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fechaLimite, setFechaLimite] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [tipo, setTipo] = useState("programa");
  const [selectedEvidenceId, setSelectedEvidenceId] = useState(fixedEvidenceId);

  const [evidences, setEvidences] = useState([]);
  const [reports, setReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingId, setEditingId] = useState(null);

  const activeEvidenceId = fixedEvidenceId || selectedEvidenceId;

  const loadEvidences = async () => {
    try {
      const res = await axios.get("/api/evidences", buildAuthConfig());
      setEvidences(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadReports = async (targetEvidenceId = activeEvidenceId) => {
    try {
      setLoadingReports(true);
      setError("");

      const params = targetEvidenceId ? { evidence_id: targetEvidenceId } : {};
      const res = await axios.get("/api/reports", buildAuthConfig({ params }));
      setReports(res.data);
    } catch (err) {
      console.error(err.response?.status, err.response?.data);
      setError(getApiErrorMessage(err, "No pudimos cargar los reportes. Actualiza la pagina."));
    } finally {
      setLoadingReports(false);
    }
  };

  useEffect(() => {
    if (fixedEvidenceId) {
      setSelectedEvidenceId(fixedEvidenceId);
    }
  }, [fixedEvidenceId]);

  useEffect(() => {
    if (!fixedEvidenceId) {
      loadEvidences();
    }
  }, [fixedEvidenceId]);

  useEffect(() => {
    loadReports();
  }, [fixedEvidenceId, selectedEvidenceId]);

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

    if (!activeEvidenceId) {
      setError("Selecciona un espacio de evidencia antes de guardar el reporte.");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const sourceFormData = new FormData(e.currentTarget);
      const field = (name, fallback = "") => {
        const value = sourceFormData.get(name);
        return value === null || value === undefined ? fallback : String(value);
      };
      const attachmentFile = sourceFormData.get("attachment");
      const formData = new FormData();
      formData.append("evidence_id", activeEvidenceId);
      formData.append("titulo", field("titulo", titulo));
      formData.append("tipo", field("tipo", tipo));

      const descripcionValue = field("descripcion", descripcion);
      const fechaLimiteValue = field("fecha_limite", fechaLimite);

      if (descripcionValue) formData.append("descripcion", descripcionValue);
      if (fechaLimiteValue) formData.append("fecha_limite", fechaLimiteValue);
      if (attachmentFile instanceof File && attachmentFile.size > 0) {
        formData.append("attachment", attachmentFile);
      } else if (attachment) {
        formData.append("attachment", attachment);
      }

      let url = "/api/reports";
      const isEditing = editingId !== null;

      if (isEditing) {
        formData.append("_method", "PUT");
        url = `/api/reports/${editingId}`;
      }

      await axios.post(
        url,
        formData,
        buildAuthConfig({
          headers: {
            "Content-Type": "multipart/form-data",
          },
        })
      );

      resetForm();
      await loadReports(activeEvidenceId);
      if (onChange) {
        await onChange();
      }

      setSuccess(
        isEditing
          ? "Reporte actualizado."
          : "Reporte creado."
      );
    } catch (err) {
      console.error(err);
      setError(getApiErrorMessage(err, "No pudimos guardar el reporte. Revisa los campos."));
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (report) => {
    setEditingId(report.id);
    setTitulo(report.titulo);
    setDescripcion(report.descripcion || "");
    setFechaLimite(report.fecha_limite || "");
    setTipo(report.tipo || "programa");
    setAttachment(null);

    if (!fixedEvidenceId && report.evidence_id) {
      setSelectedEvidenceId(String(report.evidence_id));
    }

    setError("");
    setSuccess("");
  };

  const cancelEdit = () => {
    resetForm();
    setError("");
    setSuccess("");
  };

  const deleteReport = async (id) => {
    const confirmDelete = window.confirm("Eliminar este reporte?");
    if (!confirmDelete) return;

    try {
      setDeletingId(id);
      setError("");
      setSuccess("");

      await axios.delete(`/api/reports/${id}`, buildAuthConfig());

      if (editingId === id) {
        resetForm();
      }

      await loadReports();
      if (onChange) {
        await onChange();
      }

      setSuccess("Reporte eliminado.");
    } catch (err) {
      console.error(err);
      setError(getApiErrorMessage(err, "No pudimos eliminar el reporte."));
    } finally {
      setDeletingId(null);
    }
  };

  const wrapperClass = embedded ? "py-2" : "container py-4";

  return (
    <div className={wrapperClass}>
      {!embedded && (
        <section style={HERO_STYLE} className="mb-3">
          <p
            className="text-uppercase small mb-1"
            style={{ letterSpacing: "0.08em", opacity: 0.85 }}
          >
            Reportes
          </p>
          <h2 className="h5 mb-1">Asignaciones y formatos</h2>
          <p className="mb-0" style={{ opacity: 0.9 }}>
            Crea areas para subir evidencia, define plazos y adjunta formatos
            base.
          </p>
        </section>
      )}

      <div className="row g-3">
        <div className="col-12 col-lg-5">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <h5 className="mb-3">
                {editingId ? "Editar reporte" : "Nuevo reporte"}
              </h5>
              {error && <div className="alert alert-danger">{error}</div>}
              {success && <div className="alert alert-success">{success}</div>}

              <form onSubmit={handleSubmit} className="d-grid gap-3">
                {!fixedEvidenceId && (
                  <div>
                    <label className="form-label">Espacio de evidencia</label>
                    <select
                      className="form-select"
                      value={selectedEvidenceId}
                      onChange={(e) => setSelectedEvidenceId(e.target.value)}
                      required
                    >
                      <option value="">Selecciona un espacio</option>
                      {evidences.map((evidence) => (
                        <option key={evidence.id} value={evidence.id}>
                          {evidence.titulo} [{evidence.tipo}]
                        </option>
                      ))}
                    </select>
                    <div className="form-text">
                      El reporte se crea dentro del espacio seleccionado y la
                      lista se filtra con ese contexto.
                    </div>
                  </div>
                )}

                <div>
                  <label className="form-label">Titulo</label>
                  <input
                    name="titulo"
                    type="text"
                    className="form-control"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="form-label">Descripcion</label>
                  <textarea
                    name="descripcion"
                    className="form-control"
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="row g-2">
                  <div className="col-md-6">
                    <label className="form-label">Fecha limite</label>
                    <input
                      name="fecha_limite"
                      type="date"
                      className="form-control"
                      value={fechaLimite}
                      onChange={(e) => setFechaLimite(e.target.value)}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Tipo</label>
                    <select
                      name="tipo"
                      className="form-select"
                      value={tipo}
                      onChange={(e) => setTipo(e.target.value)}
                    >
                      <option value="inscripcion">Inscripcion (todos)</option>
                      <option value="programa">Programa (activos)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="form-label">Archivo base (opcional)</label>
                  <input
                    name="attachment"
                    type="file"
                    className="form-control"
                    onChange={(e) => setAttachment(e.target.files[0] || null)}
                  />
                  <div className="form-text">Sube un formato o guia PDF/DOCX.</div>
                </div>

                <div className="d-flex gap-2">
                  <button
                    className="btn btn-primary"
                    type="submit"
                    disabled={submitting}
                  >
                    {submitting
                      ? "Guardando..."
                      : editingId
                      ? "Guardar cambios"
                      : "Crear reporte"}
                  </button>
                  {editingId && (
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={cancelEdit}
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-7">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">
                  {activeEvidenceId ? "Reportes del espacio" : "Reportes creados"}
                </h5>
                <div className="d-flex align-items-center gap-2">
                  <span className="text-muted small">{reports.length} en total</span>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => {
                      resetForm();
                      setError("");
                      setSuccess("");
                    }}
                  >
                    Agregar nuevo
                  </button>
                </div>
              </div>

              {loadingReports ? (
                <p className="text-muted">Cargando reportes...</p>
              ) : reports.length === 0 ? (
                <p className="text-muted">
                  {activeEvidenceId
                    ? "No hay reportes en este espacio."
                    : "No hay reportes aun."}
                </p>
              ) : (
                <div className="d-grid gap-3">
                  {reports.map((report) => (
                    <div key={report.id} className="border rounded p-3 bg-white">
                      <div className="d-flex justify-content-between align-items-start gap-2">
                        <div>
                          <div className="fw-semibold">{report.titulo}</div>
                          <div className="small text-muted">
                            {report.tipo && `[${report.tipo}]`}{" "}
                            {report.fecha_limite &&
                              `- Limite: ${report.fecha_limite}`}{" "}
                            {hasAttachment(report) ? "- Tiene archivo base" : ""}
                          </div>
                          {!fixedEvidenceId && report.evidence?.titulo && (
                            <div className="small text-muted">
                              Espacio: {report.evidence.titulo}
                            </div>
                          )}
                        </div>
                        <div className="d-flex flex-wrap gap-2">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => startEdit(report)}
                            disabled={deletingId === report.id}
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => deleteReport(report.id)}
                            disabled={deletingId === report.id}
                          >
                            {deletingId === report.id
                              ? "Eliminando..."
                              : "Eliminar"}
                          </button>
                        </div>
                      </div>
                      {report.descripcion && (
                        <p
                          className="mb-0 mt-2 text-muted"
                          style={{ whiteSpace: "pre-line" }}
                        >
                          {report.descripcion}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
