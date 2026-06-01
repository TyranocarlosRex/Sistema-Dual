import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import AdministratorReports from "./Reports/AdministratorReports";
import { getApiErrorMessage } from "../../../utils/errorMessages";

const API_URL = "/api";

const TIPO_OPCIONES = [
  { value: "inscripcion", label: "Inscripcion" },
  { value: "programa", label: "Programa (reportes del programa)" },
];

export default function AdminEvidences() {
  const [evidences, setEvidences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [tipo, setTipo] = useState("inscripcion");
  const [descripcion, setDescripcion] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editTitulo, setEditTitulo] = useState("");
  const [editTipo, setEditTipo] = useState("inscripcion");
  const [editDescripcion, setEditDescripcion] = useState("");
  const [editError, setEditError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  const [activeEvidenceId, setActiveEvidenceId] = useState(null);

  const token = localStorage.getItem("token");

  const axiosAuth = axios.create({
    baseURL: API_URL,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    withCredentials: true,
  });

  const cargarEvidences = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await axiosAuth.get("/evidences?with_reports=1");
      setEvidences(res.data);
    } catch (err) {
      console.error("Error al cargar evidences:", err);
      setError(getApiErrorMessage(err, "No pudimos cargar los espacios de evidencias. Actualiza la pagina e intenta de nuevo."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarEvidences();
  }, []);

  const handleCrearEvidence = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      await axiosAuth.post("/evidences", {
        titulo,
        tipo,
        descripcion,
      });

      setTitulo("");
      setDescripcion("");
      setTipo("inscripcion");
      setShowCreateForm(false);
      setSuccess("Espacio creado correctamente.");

      await cargarEvidences();
    } catch (err) {
      console.error(err);
      setError(getApiErrorMessage(err, "No pudimos crear el espacio. Revisa el titulo y vuelve a intentar."));
    }
  };

  const empezarEdicion = (ev) => {
    setEditingId(ev.id);
    setEditTitulo(ev.titulo || "");
    setEditTipo(ev.tipo || "inscripcion");
    setEditDescripcion(ev.descripcion || "");
    setEditError("");
  };

  const cancelarEdicion = () => {
    setEditingId(null);
    setEditTitulo("");
    setEditTipo("inscripcion");
    setEditDescripcion("");
    setEditError("");
  };

  const handleActualizarEvidence = async (e) => {
    e.preventDefault();
    if (!editingId) return;
    setEditError("");
    setError("");
    setSuccess("");

    try {
      await axiosAuth.put(`/evidences/${editingId}`, {
        titulo: editTitulo,
        tipo: editTipo,
        descripcion: editDescripcion,
      });

      cancelarEdicion();
      setSuccess("Espacio actualizado correctamente.");
      await cargarEvidences();
    } catch (err) {
      console.error(err);
      setEditError(getApiErrorMessage(err, "No pudimos actualizar el espacio. Revisa los cambios e intenta de nuevo."));
    }
  };

  const handleEliminarEvidence = async (ev) => {
    const confirmDelete = window.confirm(
      `Vas a eliminar el espacio "${ev.titulo}". Los reportes asociados quedaran sin espacio.`
    );

    if (!confirmDelete) return;

    setDeletingId(ev.id);
    setError("");
    setSuccess("");
    setEditError("");

    try {
      const res = await axiosAuth.delete(`/evidences/${ev.id}`);

      if (editingId === ev.id) {
        cancelarEdicion();
      }

      if (activeEvidenceId === ev.id) {
        setActiveEvidenceId(null);
      }

      setSuccess(res.data?.message || "Espacio eliminado.");
      await cargarEvidences();
    } catch (err) {
      console.error(err);
      const message = getApiErrorMessage(err, "No pudimos eliminar el espacio. Revisa si tiene reportes asociados.");
      setError(message);
      if (editingId === ev.id) {
        setEditError(message);
      }
    } finally {
      setDeletingId(null);
    }
  };

  const abrirFormReporte = (evidenceId) => {
    setActiveEvidenceId(evidenceId);
  };

  const cerrarModalReportes = () => {
    setActiveEvidenceId(null);
  };

  const activeEvidence = evidences.find((ev) => ev.id === activeEvidenceId) || null;

  const stats = useMemo(() => {
    const total = evidences.length;
    const totalReportes = evidences.reduce(
      (acc, ev) => acc + (ev.reports ? ev.reports.length : 0),
      0
    );
    const conDescripcion = evidences.filter((ev) => ev.descripcion && ev.descripcion.trim() !== "").length;
    return { total, totalReportes, conDescripcion };
  }, [evidences]);

  return (
    <div className="p-3 p-md-4" style={{ background: "#f5f7fb", minHeight: "100vh" }}>
      <div className="container-fluid" style={{ maxWidth: "1150px" }}>
        <section
          className="rounded-4 text-white shadow-lg mb-4"
          style={{
            background: "linear-gradient(135deg, #2563eb 0%, #1e3a8a 100%)",
            padding: "22px 24px",
          }}
        >
          <p className="text-uppercase small mb-1" style={{ letterSpacing: "0.08em", opacity: 0.85 }}>
            Publicaciones
          </p>
          <div className="d-flex flex-wrap align-items-center gap-3">
            <div>
              <h1 className="h4 mb-1">Espacios de evidencias</h1>
              <p className="mb-0" style={{ maxWidth: "520px", opacity: 0.9 }}>
                Crea espacios, agrega reportes y gestiona los entregables de estudiantes.
              </p>
            </div>
            <div className="admin-hero-actions">
              <button
                type="button"
                className="btn btn-sm admin-hero-btn admin-hero-btn-primary"
                onClick={() => setShowCreateForm((prev) => !prev)}
              >
                {showCreateForm ? "Cerrar formulario" : "Nuevo espacio"}
              </button>
            </div>
          </div>
        </section>

        <div className="row g-3 mb-3">
          <div className="col-12 col-md-4">
            <div className="card shadow-sm border-0 h-100">
              <div className="card-body">
                <p className="text-muted small mb-1">Total espacios</p>
                <h4 className="mb-0">{stats.total}</h4>
              </div>
            </div>
          </div>
          <div className="col-12 col-md-4">
            <div className="card shadow-sm border-0 h-100">
              <div className="card-body">
                <p className="text-muted small mb-1">Reportes asociados</p>
                <h4 className="mb-0 text-primary">{stats.totalReportes}</h4>
              </div>
            </div>
          </div>
          <div className="col-12 col-md-4">
            <div className="card shadow-sm border-0 h-100">
              <div className="card-body">
                <p className="text-muted small mb-1">Con descripcion</p>
                <h4 className="mb-0 text-success">{stats.conDescripcion}</h4>
              </div>
            </div>
          </div>
        </div>

        {error && <div className="alert alert-danger py-2">{error}</div>}
        {success && <div className="alert alert-success py-2">{success}</div>}

        {showCreateForm && (
          <div className="card shadow-sm border-0 mb-4">
            <div className="card-body">
              <h5 className="mb-3">Crear nuevo espacio</h5>
              <form onSubmit={handleCrearEvidence} className="row g-3">
                <div className="col-12 col-md-6">
                  <label className="form-label">Titulo del espacio</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ej. Inscripcion, Reportes bimestrales"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    required
                  />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label">Tipo</label>
                  <select
                    className="form-select"
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value)}
                  >
                    {TIPO_OPCIONES.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-12">
                  <label className="form-label">Descripcion</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder="Describe que documentos iran en este espacio"
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                  />
                </div>
                <div className="col-12 d-flex gap-2">
                  <button type="submit" className="btn btn-primary">Guardar espacio</button>
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setShowCreateForm(false)}>
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="card shadow-sm border-0">
          <div className="card-body">
            <h5 className="mb-3">Espacios existentes</h5>
            {loading ? (
              <div className="text-muted">Cargando...</div>
            ) : evidences.length === 0 ? (
              <div className="text-muted">Aun no hay espacios creados.</div>
            ) : (
              <div className="row g-3">
                {evidences.map((ev) => (
                  <div key={ev.id} className="col-12 col-lg-6">
                    <div className="border rounded p-3 h-100 bg-white">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div>
                          <div className="fw-semibold">{ev.titulo}</div>
                          <div className="text-muted small">Tipo: {ev.tipo} — ID: {ev.id}</div>
                        </div>
                        <div className="d-flex gap-2">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleEliminarEvidence(ev)}
                            disabled={deletingId === ev.id}
                          >
                            {deletingId === ev.id ? "Eliminando..." : "Eliminar"}
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => empezarEdicion(ev)}
                            disabled={deletingId === ev.id}
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-success"
                            onClick={() => abrirFormReporte(ev.id)}
                            disabled={deletingId === ev.id}
                          >
                            Agregar reporte
                          </button>
                        </div>
                      </div>

                      {ev.descripcion && (
                        <p className="text-muted small mb-2">{ev.descripcion}</p>
                      )}

                      {ev.reports && ev.reports.length > 0 ? (
                        <div className="mb-2">
                          <div className="fw-semibold small mb-1">Reportes en este espacio</div>
                          <ul className="list-unstyled mb-0 text-muted small">
                            {ev.reports.slice(0, 3).map((rep) => (
                              <li key={rep.id}>
                                {rep.titulo}
                                {rep.fecha_limite && (
                                  <span className="text-secondary"> — limite: {rep.fecha_limite}</span>
                                )}
                              </li>
                            ))}
                            {ev.reports.length > 3 && (
                              <li className="text-secondary">… y {ev.reports.length - 3} mas</li>
                            )}
                          </ul>
                        </div>
                      ) : (
                        <div className="text-muted small">Aun no hay reportes en este espacio.</div>
                      )}

                      {editingId === ev.id && (
                        <form onSubmit={handleActualizarEvidence} className="mt-3 p-3 bg-light rounded">
                          <h6 className="mb-2">Editar espacio</h6>
                          {editError && <div className="alert alert-danger py-2">{editError}</div>}
                          <div className="row g-2">
                            <div className="col-12 col-md-6">
                              <label className="form-label small">Titulo</label>
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                value={editTitulo}
                                onChange={(e) => setEditTitulo(e.target.value)}
                                required
                              />
                            </div>
                            <div className="col-12 col-md-6">
                              <label className="form-label small">Tipo</label>
                              <select
                                className="form-select form-select-sm"
                                value={editTipo}
                                onChange={(e) => setEditTipo(e.target.value)}
                              >
                                {TIPO_OPCIONES.map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="col-12">
                              <label className="form-label small">Descripcion</label>
                              <textarea
                                className="form-control form-control-sm"
                                rows={2}
                                value={editDescripcion}
                                onChange={(e) => setEditDescripcion(e.target.value)}
                              />
                            </div>
                          </div>
                          <div className="d-flex gap-2 mt-2">
                            <button type="submit" className="btn btn-sm btn-primary">Guardar</button>
                            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={cancelarEdicion}>
                              Cancelar
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {activeEvidenceId !== null && (
          <div className="position-fixed top-0 start-0 w-100 h-100" style={{ background: "rgba(0,0,0,0.55)", zIndex: 1050 }}>
            <div className="position-absolute top-50 start-50 translate-middle bg-white rounded shadow-lg" style={{ width: "90%", maxWidth: "1100px", maxHeight: "90vh", overflowY: "auto", padding: "1rem" }}>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <div>
                  <h5 className="mb-0">Agregar reporte</h5>
                  {activeEvidence && (
                    <p className="text-muted small mb-0">Para el espacio: {activeEvidence.titulo} (ID {activeEvidence.id})</p>
                  )}
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={cerrarModalReportes}
                >
                  Cerrar
                </button>
              </div>

              <AdministratorReports
                embedded
                evidenceId={activeEvidenceId}
                onChange={cargarEvidences}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
