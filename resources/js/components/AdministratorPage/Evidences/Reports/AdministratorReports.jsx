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

const createAttachState = () => ({
  documentId: "",
  scope: "all",
  career: "",
  search: "",
  studentId: "",
  careers: [],
  students: [],
  studentsTotal: 0,
  optionsLoading: false,
  attaching: false,
  error: "",
  success: "",
});

const getReportPeriodId = (report) => report?.periodo_id || report?.period?.id || "";

export default function AdministratorReports({
  embedded = false,
  evidenceId = null,
  onChange,
}) {
  const fixedEvidenceId = evidenceId ? String(evidenceId) : "";

  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [selectedEvidenceId, setSelectedEvidenceId] = useState(fixedEvidenceId);

  const [evidences, setEvidences] = useState([]);
  const [reports, setReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [savedDocuments, setSavedDocuments] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [documentsError, setDocumentsError] = useState("");
  const [attachReportId, setAttachReportId] = useState(null);
  const [attachStates, setAttachStates] = useState({});

  const activeEvidenceId = fixedEvidenceId || selectedEvidenceId;

  const getAttachState = (reportId) => ({
    ...createAttachState(),
    ...(attachStates[reportId] || {}),
  });

  const updateAttachState = (reportId, updater) => {
    setAttachStates((prev) => {
      const current = {
        ...createAttachState(),
        ...(prev[reportId] || {}),
      };
      const next = typeof updater === "function" ? updater(current) : updater;

      return {
        ...prev,
        [reportId]: {
          ...current,
          ...next,
        },
      };
    });
  };

  const loadEvidences = async () => {
    try {
      const res = await axios.get("/api/evidences", buildAuthConfig());
      setEvidences(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadSavedDocuments = async () => {
    try {
      setDocumentsLoading(true);
      setDocumentsError("");

      const res = await axios.get("/api/documents", buildAuthConfig());
      setSavedDocuments(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err.response?.status, err.response?.data);
      setDocumentsError(getApiErrorMessage(err, "No pudimos cargar los documentos guardados."));
    } finally {
      setDocumentsLoading(false);
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

  const loadDocumentOptions = async (report, overrides = {}) => {
    const reportId = report?.id;
    const periodId = getReportPeriodId(report);

    if (!reportId || !periodId) {
      if (reportId) {
        updateAttachState(reportId, {
          error: "Este reporte no tiene periodo asignado.",
        });
      }
      return;
    }

    const current = {
      ...getAttachState(reportId),
      ...overrides,
    };

    updateAttachState(reportId, {
      ...overrides,
      optionsLoading: true,
      error: "",
      success: "",
    });

    try {
      const response = await axios.get(
        "/api/document-generations/options",
        buildAuthConfig({
          params: {
            periodo_id: Number(periodId),
            limit: 25,
            ...(current.scope === "student" && current.search.trim() ? { search: current.search.trim() } : {}),
            ...(current.scope === "career" && current.career ? { career: current.career } : {}),
          },
        })
      );

      const data = response.data || {};
      const students = Array.isArray(data.students) ? data.students : [];
      const careers = Array.isArray(data.careers) ? data.careers : [];

      updateAttachState(reportId, (state) => ({
        optionsLoading: false,
        students,
        careers,
        studentsTotal: Number(data.students_total || 0),
        studentId:
          state.studentId && students.some((student) => String(student.id) === String(state.studentId))
            ? state.studentId
            : students[0]?.id
              ? String(students[0].id)
              : "",
        career:
          state.career && careers.includes(state.career)
            ? state.career
            : careers[0] || "",
      }));
    } catch (err) {
      console.error(err.response?.status, err.response?.data);
      updateAttachState(reportId, {
        optionsLoading: false,
        students: [],
        studentsTotal: 0,
        error: getApiErrorMessage(err, "No pudimos cargar alumnos y carreras para este reporte."),
      });
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

  useEffect(() => {
    loadSavedDocuments();
  }, []);

  const resetForm = () => {
    setTitulo("");
    setDescripcion("");
    setAttachment(null);
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

      const descripcionValue = field("descripcion", descripcion);

      if (descripcionValue) formData.append("descripcion", descripcionValue);
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

      const response = await axios.post(
        url,
        formData,
        buildAuthConfig({
          headers: {
            "Content-Type": "multipart/form-data",
          },
        })
      );
      const savedReport = response.data || {};

      resetForm();
      await loadReports(activeEvidenceId);
      if (!isEditing && savedReport.id) {
        const defaultDocumentId = savedDocuments[0]?.id ? String(savedDocuments[0].id) : "";
        setAttachReportId(savedReport.id);
        updateAttachState(savedReport.id, { documentId: defaultDocumentId, error: "", success: "" });
        loadDocumentOptions(savedReport, { documentId: defaultDocumentId });
      }
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

  const toggleAttachPanel = (report) => {
    const reportId = report.id;
    const willOpen = attachReportId !== reportId;

    setAttachReportId(willOpen ? reportId : null);

    if (!willOpen) {
      return;
    }

    const current = getAttachState(reportId);
    const documentId = current.documentId || (savedDocuments[0]?.id ? String(savedDocuments[0].id) : "");

    updateAttachState(reportId, { documentId, error: "", success: "" });

    if (current.careers.length === 0 && current.students.length === 0) {
      loadDocumentOptions(report, { documentId });
    }
  };

  const handleAttachScopeChange = (report, scope) => {
    updateAttachState(report.id, {
      scope,
      search: "",
      studentId: "",
      error: "",
      success: "",
    });
    loadDocumentOptions(report, { scope, search: "", studentId: "" });
  };

  const attachSavedDocument = async (report) => {
    const reportId = report.id;
    const periodId = getReportPeriodId(report);
    const state = getAttachState(reportId);

    if (!state.documentId) {
      updateAttachState(reportId, { error: "Selecciona un documento guardado." });
      return;
    }

    if (!periodId) {
      updateAttachState(reportId, { error: "Este reporte no tiene periodo asignado." });
      return;
    }

    if (state.scope === "career" && !state.career) {
      updateAttachState(reportId, { error: "Selecciona una carrera." });
      return;
    }

    if (state.scope === "student" && !state.studentId) {
      updateAttachState(reportId, { error: "Selecciona un alumno." });
      return;
    }

    updateAttachState(reportId, { attaching: true, error: "", success: "" });

    try {
      const payload = {
        report_id: Number(reportId),
        periodo_id: Number(periodId),
        scope: state.scope,
      };

      if (state.scope === "career") {
        payload.career = state.career;
      }

      if (state.scope === "student") {
        payload.student_id = Number(state.studentId);
      }

      const response = await axios.post(
        `/api/documents/${state.documentId}/attach-to-report`,
        payload,
        buildAuthConfig()
      );
      const count = Number(response.data?.attached_count || 0);

      updateAttachState(reportId, {
        attaching: false,
        success: `${count} documento(s) adjuntado(s) al reporte.`,
      });
    } catch (err) {
      console.error(err.response?.status, err.response?.data);
      updateAttachState(reportId, {
        attaching: false,
        error: getApiErrorMessage(err, "No pudimos adjuntar el documento al reporte."),
      });
    }
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
                    ? "No hay reportes en este espacio. Crea un reporte y se abrira la opcion para traer un documento guardado."
                    : "No hay reportes aun."}
                </p>
              ) : (
                <div className="d-grid gap-3">
                  {reports.map((report) => {
                    const isAttachPanelOpen = attachReportId === report.id;
                    const attachState = getAttachState(report.id);
                    const reportPeriodId = getReportPeriodId(report);

                    return (
                      <div key={report.id} className="border rounded p-3 bg-white">
                        <div className="d-flex justify-content-between align-items-start gap-2">
                          <div>
                            <div className="fw-semibold">{report.titulo}</div>
                            <div className="small text-muted">
                              {hasAttachment(report) ? "Tiene archivo base" : "Sin archivo base"}
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
                              className="btn btn-sm btn-outline-secondary"
                              onClick={() => toggleAttachPanel(report)}
                              disabled={documentsLoading || deletingId === report.id}
                            >
                              {isAttachPanelOpen ? "Ocultar documentos" : "Traer documento"}
                            </button>
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

                        {isAttachPanelOpen && (
                          <div className="border-top mt-3 pt-3">
                            <div className="d-flex justify-content-between align-items-start gap-2 flex-wrap mb-2">
                              <div>
                                <div className="fw-semibold small">Documento guardado</div>
                                <div className="small text-muted">
                                  Selecciona una plantilla guardada para generar PDFs y dejarlos disponibles a los estudiantes en este reporte.
                                </div>
                              </div>
                              {documentsLoading && <span className="badge text-bg-light border">Cargando documentos...</span>}
                            </div>

                            {documentsError && <div className="alert alert-warning py-2">{documentsError}</div>}
                            {attachState.error && <div className="alert alert-danger py-2">{attachState.error}</div>}
                            {attachState.success && <div className="alert alert-success py-2">{attachState.success}</div>}

                            <div className="row g-2 align-items-end">
                              <div className="col-12 col-lg-6">
                                <label className="form-label small">Documento</label>
                                <select
                                  className="form-select"
                                  value={attachState.documentId}
                                  onChange={(event) => updateAttachState(report.id, {
                                    documentId: event.target.value,
                                    error: "",
                                    success: "",
                                  })}
                                  disabled={documentsLoading || savedDocuments.length === 0}
                                >
                                  {savedDocuments.length === 0 ? (
                                    <option value="">No hay documentos guardados</option>
                                  ) : (
                                    savedDocuments.map((documentItem) => (
                                      <option key={documentItem.id} value={documentItem.id}>
                                        {documentItem.titulo}
                                      </option>
                                    ))
                                  )}
                                </select>
                              </div>

                              <div className="col-12 col-lg-6">
                                <label className="form-label small">Adjuntar para</label>
                                <select
                                  className="form-select"
                                  value={attachState.scope}
                                  onChange={(event) => handleAttachScopeChange(report, event.target.value)}
                                  disabled={!reportPeriodId || attachState.optionsLoading}
                                >
                                  <option value="all">Todos los alumnos del periodo</option>
                                  <option value="career">Una carrera</option>
                                  <option value="student">Un alumno</option>
                                </select>
                              </div>

                              {attachState.scope === "career" && (
                                <div className="col-12 col-lg-7">
                                  <label className="form-label small">Carrera</label>
                                  <select
                                    className="form-select"
                                    value={attachState.career}
                                    onChange={(event) => updateAttachState(report.id, {
                                      career: event.target.value,
                                      error: "",
                                      success: "",
                                    })}
                                    disabled={attachState.optionsLoading || attachState.careers.length === 0}
                                  >
                                    {attachState.careers.length === 0 ? (
                                      <option value="">No hay carreras disponibles</option>
                                    ) : (
                                      attachState.careers.map((career) => (
                                        <option key={career} value={career}>
                                          {career}
                                        </option>
                                      ))
                                    )}
                                  </select>
                                </div>
                              )}

                              {attachState.scope === "student" && (
                                <>
                                  <div className="col-12 col-lg-5">
                                    <label className="form-label small">Buscar alumno</label>
                                    <div className="input-group">
                                      <input
                                        type="search"
                                        className="form-control"
                                        value={attachState.search}
                                        onChange={(event) => updateAttachState(report.id, {
                                          search: event.target.value,
                                          error: "",
                                          success: "",
                                        })}
                                        placeholder="Nombre o control"
                                      />
                                      <button
                                        type="button"
                                        className="btn btn-outline-secondary"
                                        onClick={() => loadDocumentOptions(report)}
                                        disabled={attachState.optionsLoading}
                                      >
                                        Buscar
                                      </button>
                                    </div>
                                  </div>
                                  <div className="col-12 col-lg-7">
                                    <label className="form-label small">Alumno</label>
                                    <select
                                      className="form-select"
                                      value={attachState.studentId}
                                      onChange={(event) => updateAttachState(report.id, {
                                        studentId: event.target.value,
                                        error: "",
                                        success: "",
                                      })}
                                      disabled={attachState.optionsLoading || attachState.students.length === 0}
                                    >
                                      {attachState.students.length === 0 ? (
                                        <option value="">No hay alumnos disponibles</option>
                                      ) : (
                                        attachState.students.map((student) => (
                                          <option key={student.id} value={student.id}>
                                            {student.nombre_completo} - {student.no_control}
                                          </option>
                                        ))
                                      )}
                                    </select>
                                  </div>
                                </>
                              )}

                              <div className="col-12">
                                <div className="d-flex justify-content-between align-items-center gap-2 flex-wrap">
                                  <div className="small text-muted">
                                    {attachState.optionsLoading
                                      ? "Consultando alumnos..."
                                      : reportPeriodId
                                        ? attachState.scope === "career"
                                          ? "Se adjuntara a los alumnos de la carrera seleccionada."
                                          : attachState.scope === "student"
                                            ? `${attachState.studentsTotal} alumno(s) encontrados.`
                                            : `${attachState.studentsTotal} alumno(s) disponibles para el periodo del reporte.`
                                        : "Este reporte no tiene periodo asignado."}
                                  </div>
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-primary"
                                    onClick={() => attachSavedDocument(report)}
                                    disabled={
                                      attachState.attaching ||
                                      documentsLoading ||
                                      savedDocuments.length === 0 ||
                                      !reportPeriodId ||
                                      attachState.optionsLoading
                                    }
                                  >
                                    {attachState.attaching ? "Adjuntando..." : "Adjuntar documento"}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
