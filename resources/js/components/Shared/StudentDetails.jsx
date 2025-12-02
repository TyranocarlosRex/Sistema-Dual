import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const HERO_STYLE = {
  background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 45%, #0f172a 100%)",
  color: "#fff",
  borderRadius: "16px",
  padding: "22px 24px",
  boxShadow: "0 24px 54px -35px rgba(37, 99, 235, 0.7)",
};

export default function StudentDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [student, setStudent] = useState(null);
  const [evidences, setEvidences] = useState({ sent: [], missing: [] });
  const [grades, setGrades] = useState({});
  const [feedbacks, setFeedbacks] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);

        const token = localStorage.getItem("token");
        const { data } = await axios.get(`/api/students/${id}/details`, {
          withCredentials: true,
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        setStudent(data.student);
        setEvidences(data.documents);
        if (Array.isArray(data.documents?.sent)) {
          const initialGrades = {};
          const initialFeedbacks = {};
          data.documents.sent.forEach((sub) => {
            if (sub.calificacion !== null && sub.calificacion !== undefined) {
              initialGrades[sub.id] = sub.calificacion;
            }
            if (sub.feedback) {
              initialFeedbacks[sub.id] = sub.feedback;
            }
          });
          setGrades(initialGrades);
          setFeedbacks(initialFeedbacks);
        }
      } catch (err) {
        console.error(err);
        setError("No se pudo cargar la informacion del estudiante.");
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [id]);

  if (loading) {
    return <div className="container mt-4">Cargando...</div>;
  }

  if (error) {
    return (
      <div className="container mt-4">
        <p className="text-danger">{error}</p>
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>
          Regresar
        </button>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="container mt-4">
        <p className="text-muted">No se encontro el estudiante.</p>
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>
          Regresar
        </button>
      </div>
    );
  }

  const statusBadge = (status) => {
    const map = {
      aceptado: "success",
      enviado: "warning text-dark",
      rechazado: "danger",
    };
    return map[status] ?? "secondary";
  };

  const formatDateTime = (value) =>
    value ? new Date(value).toLocaleString() : "-";

  const formatDate = (value) =>
    value ? new Date(value).toLocaleDateString() : "-";

  const studentStatus =
    student.Estatus && student.Estatus.toLowerCase() === "activo"
      ? "success"
      : "secondary";

  const handleSubmissionUpdate = async (sub, statusOverride) => {
    try {
      setUpdatingId(sub.id);
      const token = localStorage.getItem("token");
      const gradeValue = grades[sub.id];
      const payload = {
        status: statusOverride ?? sub.status,
        feedback: feedbacks[sub.id] ?? "",
        calificacion:
          gradeValue === "" || gradeValue === undefined ? null : gradeValue,
      };

      const { data } = await axios.patch(
        `/api/admin/report-submissions/${sub.id}`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setEvidences((prev) => ({
        ...prev,
        sent: prev.sent.map((item) =>
          item.id === sub.id ? { ...item, ...payload, ...data } : item
        ),
      }));
    } catch (err) {
      console.error(err);
      alert("No se pudo actualizar la entrega.");
    } finally {
      setUpdatingId(null);
    }
  };

  const downloadSubmission = async (sub, preview = false) => {
    try {
      setDownloadingId(sub.id);
      const token = localStorage.getItem("token");
      const { data, headers } = await axios.get(
        `/api/admin/report-submissions/${sub.id}/download`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "blob",
        }
      );

      const disposition = headers["content-disposition"] || "";
      const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/i);
      const rawName = match ? match[1] : null;
      const filename = rawName
        ? rawName.replace(/['"]/g, "")
        : sub.original_name || `entrega-${sub.id}`;

      const blob = new Blob([data], {
        type: headers["content-type"] || "application/octet-stream",
      });
      const url = window.URL.createObjectURL(blob);

      if (preview) {
        setPreviewFile({ url, name: filename });
        return;
      }

      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("No se pudo descargar el archivo.");
    } finally {
      setDownloadingId(null);
    }
  };

  const closePreview = () => {
    if (previewFile?.url) {
      window.URL.revokeObjectURL(previewFile.url);
    }
    setPreviewFile(null);
  };

  return (
    <>
      <div className="container py-4">
      <div className="d-flex align-items-center gap-2 mb-3">
        <button className="btn btn-outline-secondary btn-sm" onClick={() => navigate(-1)}>
          Regresar
        </button>
        <span className="text-muted small">Estudiante #{student.id}</span>
      </div>

      <div className="mb-4" style={HERO_STYLE}>
        <div className="d-flex flex-wrap justify-content-between align-items-start gap-3">
          <div>
            <p className="text-light text-opacity-75 mb-1 small">Detalles del estudiante</p>
            <h3 className="mb-2">
              {student.Nombre} {student.Apellidos}
            </h3>
            <div className="d-flex flex-wrap align-items-center gap-2">
              <span className={`badge bg-${studentStatus}`}>
                {student.Estatus || "Sin estatus"}
              </span>
              <span className="badge bg-light text-dark">
                Semestre {student.Semestre ?? "-"}
              </span>
              <span className="badge bg-light text-dark">
                Carrera: {student.Carrera ?? "-"}
              </span>
            </div>
          </div>

          <div className="d-flex align-items-center gap-4 text-end">
            <div>
              <div className="fw-bold fs-3">{evidences.sent.length}</div>
              <div className="text-light text-opacity-75 small mb-0">Evidencias enviadas</div>
            </div>
            <div>
              <div className="fw-bold fs-3">{evidences.missing.length}</div>
              <div className="text-light text-opacity-75 small mb-0">Evidencias faltantes</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-header bg-transparent border-0">
          <h6 className="mb-0">Datos generales</h6>
          <p className="text-muted small mb-0">Contacto y control escolar</p>
        </div>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-6">
              <div className="p-3 border rounded-3 h-100 bg-light">
                <div className="text-muted small">No. Control</div>
                <div className="fw-semibold">{student.No_control || "-"}</div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="p-3 border rounded-3 h-100 bg-light">
                <div className="text-muted small">Correo institucional</div>
                <div className="fw-semibold">{student.Correo_institucional || "-"}</div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="p-3 border rounded-3 h-100 bg-light">
                <div className="text-muted small">Telefono</div>
                <div className="fw-semibold">{student.Telefono || "-"}</div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="p-3 border rounded-3 h-100 bg-light">
                <div className="text-muted small">Direccion</div>
                <div className="fw-semibold">{student.Direccion || "-"}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-header bg-transparent border-0">
          <h6 className="mb-0">Evidencias enviadas</h6>
          <p className="text-muted small mb-0">
            Archivos entregados y su retroalimentacion
          </p>
        </div>
        <div className="card-body">
          {evidences.sent.length === 0 ? (
            <div className="alert alert-light mb-0">
              El estudiante aun no ha enviado evidencias.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-sm align-middle table-hover">
                <thead className="table-light">
                  <tr>
                    <th>Reporte</th>
                    <th>Evidencia</th>
                    <th>Fecha</th>
                    <th className="text-center">Estado</th>
                    <th>Archivo</th>
                    <th>Calificacion</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {evidences.sent.map((sub) => (
                    <tr key={sub.id}>
                      <td className="fw-semibold">{sub.report?.titulo}</td>
                      <td>{sub.report?.evidence?.titulo}</td>
                      <td className="text-muted small">
                        {formatDateTime(sub.submitted_at)}
                      </td>
                      <td className="text-center">
                        <span className={`badge bg-${statusBadge(sub.status)}`}>
                          {sub.status ?? "-"}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex flex-column gap-1">
                          {sub.file_path ? (
                            <>
                              <button
                                className="btn btn-sm btn-outline-secondary"
                                onClick={() => downloadSubmission(sub, true)}
                                disabled={downloadingId === sub.id}
                              >
                                {downloadingId === sub.id ? "Abriendo..." : "Ver"}
                              </button>
                              <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => downloadSubmission(sub)}
                                disabled={downloadingId === sub.id}
                              >
                                {downloadingId === sub.id ? "Descargando..." : "Descargar"}
                              </button>
                              <span className="small text-muted">
                                {sub.original_name || "Archivo"}
                              </span>
                            </>
                          ) : (
                            "-"
                          )}
                        </div>
                      </td>
                      <td style={{ minWidth: "140px" }}>
                        <input
                          type="number"
                          className="form-control form-control-sm"
                          placeholder="0 - 100"
                          min="0"
                          max="100"
                          step="0.5"
                          value={grades[sub.id] === undefined ? "" : grades[sub.id]}
                          onChange={(e) =>
                            setGrades((prev) => ({
                              ...prev,
                              [sub.id]:
                                e.target.value === "" ? "" : Number(e.target.value),
                            }))
                          }
                        />
                      </td>
                      <td style={{ minWidth: "230px" }}>
                        <div className="d-flex flex-column gap-2">
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            placeholder="Feedback (opcional)"
                            value={feedbacks[sub.id] ?? ""}
                            onChange={(e) =>
                              setFeedbacks((prev) => ({
                                ...prev,
                                [sub.id]: e.target.value,
                              }))
                            }
                          />
                          <div className="d-flex flex-wrap gap-2">
                            <button
                              className="btn btn-sm btn-outline-success"
                              disabled={updatingId === sub.id}
                              onClick={() => handleSubmissionUpdate(sub, "aceptado")}
                            >
                              Aceptar
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              disabled={updatingId === sub.id}
                              onClick={() => handleSubmissionUpdate(sub, "rechazado")}
                            >
                              Rechazar
                            </button>
                            <button
                              className="btn btn-sm btn-primary"
                              disabled={updatingId === sub.id}
                              onClick={() => handleSubmissionUpdate(sub, sub.status)}
                            >
                              Guardar
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-header bg-transparent border-0">
          <h6 className="mb-0">Evidencias faltantes</h6>
          <p className="text-muted small mb-0">
            Reportes asignados sin entrega registrada
          </p>
        </div>
        <div className="card-body">
          {evidences.missing.length === 0 ? (
            <div className="alert alert-success mb-0">
              El estudiante ya envio todas las evidencias requeridas.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-sm align-middle table-hover">
                <thead className="table-light">
                  <tr>
                    <th>Reporte</th>
                    <th>Evidencia</th>
                    <th>Fecha limite</th>
                  </tr>
                </thead>
                <tbody>
                  {evidences.missing.map((rep) => (
                    <tr key={rep.id}>
                      <td className="fw-semibold">{rep.titulo}</td>
                      <td>{rep.evidence?.titulo}</td>
                      <td>
                        <span className="badge bg-light text-dark">
                          {formatDate(rep.fecha_limite)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* cierre contenedor principal */}
      </div>

      {previewFile && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100"
          style={{ background: "rgba(0,0,0,0.65)", zIndex: 1050 }}
          onClick={closePreview}
        >
          <div
            className="position-absolute top-50 start-50 translate-middle bg-white rounded shadow-lg"
            style={{ width: "90%", maxWidth: "960px", height: "80vh", padding: "1rem" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="d-flex justify-content-between align-items-center mb-2">
              <div>
                <h5 className="mb-0">Previsualizar archivo</h5>
                <small className="text-muted">{previewFile.name}</small>
              </div>
              <button className="btn btn-sm btn-outline-secondary" onClick={closePreview}>
                Cerrar
              </button>
            </div>
            <div className="h-100 border rounded overflow-hidden">
              <iframe
                title="preview"
                src={previewFile.url}
                style={{ border: "none", width: "100%", height: "100%" }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
