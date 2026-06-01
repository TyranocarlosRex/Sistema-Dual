import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { getApiErrorMessage } from "../../../utils/errorMessages";

const HERO_STYLE = {
  background: "linear-gradient(135deg, #0f172a 0%, #1d4ed8 100%)",
  color: "#fff",
  borderRadius: "20px",
  padding: "24px 28px",
  boxShadow: "0 24px 54px -35px rgba(29, 78, 216, 0.7)",
};

const INITIAL_FORM = {
  anio: new Date().getFullYear(),
  numero: "1",
  estatus: "borrador",
  fecha_inicio: "",
  fecha_fin: "",
  clonar_estudiantes_desde_periodo_id: "",
};

const toDateInputValue = (value) => {
  if (!value) return "";
  const text = String(value);
  const match = text.match(/^\d{4}-\d{2}-\d{2}/);
  return match ? match[0] : "";
};

const createFormFromPeriod = (periodo) => ({
  anio: String(periodo?.anio ?? new Date().getFullYear()),
  numero: String(periodo?.numero ?? "1"),
  estatus: periodo?.estatus === "activo" ? "activo" : "borrador",
  fecha_inicio: toDateInputValue(periodo?.fecha_inicio),
  fecha_fin: toDateInputValue(periodo?.fecha_fin),
  clonar_estudiantes_desde_periodo_id: "",
});

const badgeClassForStatus = (estatus) => {
  const val = (estatus || "").toLowerCase();
  if (val === "activo") return "badge rounded-pill bg-success";
  if (val === "cerrado") return "badge rounded-pill bg-secondary";
  return "badge rounded-pill bg-warning text-dark";
};

const formatDate = (value) => {
  if (!value) return "No definida";

  try {
    const dateOnly = toDateInputValue(value);
    const dateValue =
      dateOnly
        ? new Date(`${dateOnly}T00:00:00`)
        : new Date(value);

    return new Intl.DateTimeFormat("es-MX", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    }).format(dateValue);
  } catch {
    return value;
  }
};

const formatDateTime = (value) => {
  if (!value) return "No definida";

  try {
    return new Intl.DateTimeFormat("es-MX", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
};

const EMPTY_STATISTICS_MODAL = {
  open: false,
  loading: false,
  error: "",
  data: null,
  period: null,
};

const submissionBadgeClass = (status) => {
  if (status === "aceptado") return "badge rounded-pill text-bg-success";
  if (status === "rechazado") return "badge rounded-pill text-bg-danger";
  return "badge rounded-pill text-bg-warning text-dark";
};

export default function AdministratorPeriods() {
  const [periodos, setPeriodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [actingId, setActingId] = useState(null);
  const [editingPeriodId, setEditingPeriodId] = useState(null);
  const [statisticsModal, setStatisticsModal] = useState(EMPTY_STATISTICS_MODAL);

  const token = localStorage.getItem("token");

  const axiosAuth = useMemo(
    () =>
      axios.create({
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      }),
    [token]
  );

  const cargarPeriodos = async () => {
    setLoading(true);
    setError("");

    try {
      const { data } = await axiosAuth.get("/api/periods");
      setPeriodos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError(getApiErrorMessage(err, "No pudimos cargar los periodos. Actualiza la pagina e intenta de nuevo."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      setError("No hay sesion de administrador.");
      setLoading(false);
      return;
    }

    cargarPeriodos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const resumen = useMemo(() => {
    const total = periodos.length;
    const activos = periodos.filter((p) => p.estatus === "activo").length;
    const borradores = periodos.filter((p) => p.estatus === "borrador").length;
    const cerrados = periodos.filter((p) => p.estatus === "cerrado").length;
    return { total, activos, borradores, cerrados };
  }, [periodos]);

  const periodosOrdenados = useMemo(() => {
    return [...periodos].sort((a, b) => {
      if ((b.anio ?? 0) !== (a.anio ?? 0)) return (b.anio ?? 0) - (a.anio ?? 0);
      return (b.numero ?? 0) - (a.numero ?? 0);
    });
  }, [periodos]);

  const periodosClonables = useMemo(() => {
    return periodosOrdenados.filter((p) => p.id);
  }, [periodosOrdenados]);

  const periodoActivo = useMemo(() => {
    return periodos.find((p) => p.estatus === "activo") ?? null;
  }, [periodos]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setForm(INITIAL_FORM);
  };

  const openCreateForm = () => {
    setEditingPeriodId(null);
    resetForm();
    setShowForm(true);
  };

  const openEditForm = (periodo) => {
    setEditingPeriodId(periodo.id);
    setForm(createFormFromPeriod(periodo));
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingPeriodId(null);
    resetForm();
  };

  const closeStatisticsModal = () => {
    setStatisticsModal(EMPTY_STATISTICS_MODAL);
  };

  const openStatisticsModal = async (periodo) => {
    if (!periodo?.id) return;

    setStatisticsModal({
      open: true,
      loading: true,
      error: "",
      data: null,
      period: periodo,
    });

    try {
      const { data } = await axiosAuth.get(`/api/periods/${periodo.id}/statistics`);

      setStatisticsModal({
        open: true,
        loading: false,
        error: "",
        data,
        period: data?.period ?? periodo,
      });
    } catch (err) {
      console.error(err);
      setStatisticsModal({
        open: true,
        loading: false,
        error: getApiErrorMessage(err, `No pudimos cargar las estadisticas de ${periodo.codigo}.`),
        data: null,
        period: periodo,
      });
    }
  };

  const guardarPeriodo = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const formData = new FormData(event.currentTarget);
      const field = (name, fallback = "") => {
        const value = formData.get(name);
        return value === null || value === undefined ? fallback : String(value);
      };
      const payload = {
        anio: Number(field("anio", form.anio)),
        numero: Number(field("numero", form.numero)),
        estatus: field("estatus", form.estatus),
        fecha_inicio: field("fecha_inicio", form.fecha_inicio) || null,
        fecha_fin: field("fecha_fin", form.fecha_fin) || null,
      };

      const cloneFromPeriod = field(
        "clonar_estudiantes_desde_periodo_id",
        form.clonar_estudiantes_desde_periodo_id
      );

      if (cloneFromPeriod) {
        payload.clonar_estudiantes_desde_periodo_id = Number(cloneFromPeriod);
      }

      if (editingPeriodId) {
        await axiosAuth.put(`/api/periods/${editingPeriodId}`, payload);
        setSuccess("Periodo actualizado correctamente.");
      } else {
        await axiosAuth.post("/api/periods", payload);
        setSuccess("Periodo creado correctamente.");
      }

      closeForm();
      await cargarPeriodos();
    } catch (err) {
      console.error(err);
      setError(
        getApiErrorMessage(
          err,
          editingPeriodId
            ? "No pudimos actualizar el periodo. Revisa los datos e intenta de nuevo."
            : "No pudimos crear el periodo. Revisa los datos e intenta de nuevo."
        )
      );
    } finally {
      setSaving(false);
    }
  };

  const activarPeriodo = async (periodo) => {
    setActingId(periodo.id);
    setError("");
    setSuccess("");

    try {
      await axiosAuth.post(`/api/periods/${periodo.id}/activate`);
      setSuccess(`Periodo ${periodo.codigo} activado.`);
      await cargarPeriodos();
    } catch (err) {
      console.error(err);
      setError(getApiErrorMessage(err, `No pudimos activar ${periodo.codigo}.`));
    } finally {
      setActingId(null);
    }
  };

  const cerrarPeriodo = async (periodo) => {
    const confirmado = window.confirm(
      `Vas a cerrar el periodo ${periodo.codigo}. Despues solo sera de consulta.`
    );

    if (!confirmado) return;

    setActingId(periodo.id);
    setError("");
    setSuccess("");

    try {
      const { data } = await axiosAuth.post(`/api/periods/${periodo.id}/close`);
      setSuccess(`Periodo ${periodo.codigo} cerrado.`);
      await cargarPeriodos();
      await openStatisticsModal(data || periodo);
    } catch (err) {
      console.error(err);
      setError(getApiErrorMessage(err, `No pudimos cerrar ${periodo.codigo}.`));
    } finally {
      setActingId(null);
    }
  };

  const statisticsPeriod = statisticsModal.data?.period ?? statisticsModal.period;
  const statisticsSummary = statisticsModal.data?.summary ?? {};
  const statisticsCards = [
    {
      key: "alumnos",
      label: "Alumnos",
      value: statisticsSummary.alumnos ?? 0,
      tone: "text-dark",
      note: "registrados en el periodo",
    },
    {
      key: "ingresos",
      label: "Ingresos",
      value: statisticsSummary.ingresos ?? 0,
      tone: "text-primary",
      note: "altas registradas",
    },
    {
      key: "activos",
      label: "Activos",
      value: statisticsSummary.activos ?? 0,
      tone: "text-success",
      note: "siguen en proceso",
    },
    {
      key: "inactivos",
      label: "Inactivos",
      value: statisticsSummary.inactivos ?? 0,
      tone: "text-secondary",
      note: "sin movimiento actual",
    },
    {
      key: "bajas",
      label: "Bajas",
      value: statisticsSummary.bajas ?? 0,
      tone: "text-warning",
      note: "concluyeron antes del cierre",
    },
    {
      key: "reportes",
      label: "Reportes",
      value: statisticsSummary.reportes ?? 0,
      tone: "text-dark",
      note: "asignaciones configuradas",
    },
    {
      key: "entregas",
      label: "Entregas",
      value: statisticsSummary.entregas ?? 0,
      tone: "text-info",
      note: "documentos recibidos",
    },
    {
      key: "con_acceso",
      label: "Con acceso",
      value: statisticsSummary.con_acceso ?? 0,
      tone: "text-primary",
      note: "ingresaron al sistema",
    },
  ];

  return (
    <div className="p-3 p-md-4" style={{ background: "#f5f7fb", minHeight: "100vh" }}>
      <div className="container-fluid" style={{ maxWidth: "1240px" }}>
        <section style={HERO_STYLE} className="mb-4">
          <p className="text-uppercase small mb-1" style={{ letterSpacing: "0.08em", opacity: 0.85 }}>
            Administracion de periodos
          </p>
          <div className="d-flex flex-wrap align-items-center gap-3">
            <div>
              <h1 className="h4 mb-1">Organiza ciclos, alumnos y cierres</h1>
              <p className="mb-0" style={{ maxWidth: "560px", opacity: 0.9 }}>
                Crea nuevos periodos, define cual esta activo y conserva los cerrados solo para consulta y estadisticas.
              </p>
            </div>
            <div className="admin-hero-actions">
              <button
                className="btn btn-sm admin-hero-btn admin-hero-btn-primary"
                type="button"
                onClick={() => (showForm ? closeForm() : openCreateForm())}
              >
                {showForm ? "Ocultar formulario" : "Nuevo periodo"}
              </button>
              <button
                className="btn btn-sm admin-hero-btn admin-hero-btn-secondary"
                type="button"
                onClick={cargarPeriodos}
                disabled={loading}
              >
                {loading ? "Actualizando..." : "Actualizar"}
              </button>
            </div>
          </div>
        </section>

        <div className="row g-3 mb-4">
          <div className="col-12 col-md-3">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <p className="text-muted small mb-1">Total periodos</p>
                <h4 className="mb-0">{resumen.total}</h4>
              </div>
            </div>
          </div>
          <div className="col-12 col-md-3">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <p className="text-muted small mb-1">Activos</p>
                <h4 className="mb-0 text-success">{resumen.activos}</h4>
              </div>
            </div>
          </div>
          <div className="col-12 col-md-3">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <p className="text-muted small mb-1">Borradores</p>
                <h4 className="mb-0 text-warning">{resumen.borradores}</h4>
              </div>
            </div>
          </div>
          <div className="col-12 col-md-3">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <p className="text-muted small mb-1">Cerrados</p>
                <h4 className="mb-0 text-secondary">{resumen.cerrados}</h4>
              </div>
            </div>
          </div>
        </div>

        {periodoActivo && (
          <div className="alert alert-success shadow-sm border-0 d-flex flex-wrap align-items-center gap-2 mb-4">
            <strong>Periodo activo:</strong>
            <span>{periodoActivo.codigo}</span>
            <span className="text-muted">
              {periodoActivo.students_count ?? 0} alumnos, {periodoActivo.reports_count ?? 0} reportes
            </span>
          </div>
        )}

        {showForm && (
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                <div>
                  <h2 className="h5 mb-1">{editingPeriodId ? "Modificar periodo" : "Nuevo periodo"}</h2>
                  <p className="text-muted mb-0">
                    {editingPeriodId
                      ? "Ajusta la configuracion del periodo. Los periodos cerrados no se pueden editar."
                      : "Crealo en borrador y despues agrega o clona alumnos antes de activarlo."}
                  </p>
                </div>
              </div>

              <form onSubmit={guardarPeriodo}>
                <div className="row g-3">
                  <div className="col-md-3">
                    <label className="form-label">Anio</label>
                    <input
                      className="form-control"
                      type="number"
                      min="2000"
                      max="2100"
                      name="anio"
                      value={form.anio}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="col-md-2">
                    <label className="form-label">Periodo</label>
                    <select className="form-select" name="numero" value={form.numero} onChange={handleInputChange}>
                      <option value="1">1</option>
                      <option value="2">2</option>
                    </select>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Estatus inicial</label>
                    <select className="form-select" name="estatus" value={form.estatus} onChange={handleInputChange}>
                      <option value="borrador">Borrador</option>
                      <option value="activo">Activo</option>
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Clonar alumnos desde</label>
                    <select
                      className="form-select"
                      name="clonar_estudiantes_desde_periodo_id"
                      value={form.clonar_estudiantes_desde_periodo_id}
                      onChange={handleInputChange}
                      disabled={Boolean(editingPeriodId)}
                    >
                      <option value="">No clonar</option>
                      {periodosClonables.map((periodo) => (
                        <option key={periodo.id} value={periodo.id}>
                          {periodo.codigo}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Fecha inicio</label>
                    <input
                      className="form-control"
                      type="date"
                      name="fecha_inicio"
                      value={form.fecha_inicio}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Fecha fin</label>
                    <input
                      className="form-control"
                      type="date"
                      name="fecha_fin"
                      value={form.fecha_fin}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="col-12 d-flex justify-content-end gap-2">
                    <button type="button" className="btn btn-outline-secondary" onClick={closeForm} disabled={saving}>
                      Cancelar
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                      {saving ? "Guardando..." : editingPeriodId ? "Guardar cambios" : "Crear periodo"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {error && (
          <div className="alert alert-danger shadow-sm" role="alert">
            {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success shadow-sm" role="alert">
            {success}
          </div>
        )}

        <div className="row g-3">
          {loading && (
            <div className="col-12">
              <div className="card border-0 shadow-sm">
                <div className="card-body text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Cargando...</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!loading && periodosOrdenados.length === 0 && (
            <div className="col-12">
              <div className="card border-0 shadow-sm">
                <div className="card-body text-center py-5">
                  <h2 className="h5 mb-2">Todavia no hay periodos</h2>
                  <p className="text-muted mb-3">Empieza creando el primer periodo para cargar alumnos y activar el ciclo.</p>
                  <button className="btn btn-primary" type="button" onClick={openCreateForm}>
                    Crear primer periodo
                  </button>
                </div>
              </div>
            </div>
          )}

          {!loading &&
            periodosOrdenados.map((periodo) => {
              const isActing = actingId === periodo.id;
              const puedeActivar = periodo.estatus !== "activo" && periodo.estatus !== "cerrado";
              const puedeCerrar = periodo.estatus === "activo";
              const puedeEditar = periodo.estatus !== "cerrado";

              return (
                <div className="col-12 col-xl-6" key={periodo.id}>
                  <div className="card border-0 shadow-sm h-100">
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
                        <div>
                          <div className="d-flex align-items-center gap-2 flex-wrap">
                            <h2 className="h5 mb-0">{periodo.codigo}</h2>
                            <span className={badgeClassForStatus(periodo.estatus)}>{periodo.estatus}</span>
                          </div>
                          <p className="text-muted mb-0 mt-1">
                            Del {formatDate(periodo.fecha_inicio)} al {formatDate(periodo.fecha_fin)}
                          </p>
                        </div>
                        <div className="text-end small text-muted">
                          <div>Creado: {formatDate(periodo.created_at)}</div>
                          <div>Cierre: {formatDate(periodo.fecha_cierre)}</div>
                        </div>
                      </div>

                      <div className="row g-2 mb-3">
                        <div className="col-6 col-md-3">
                          <div className="rounded-3 p-3" style={{ background: "#f8fafc" }}>
                            <div className="small text-muted">Alumnos</div>
                            <div className="fw-semibold">{periodo.students_count ?? 0}</div>
                          </div>
                        </div>
                        <div className="col-6 col-md-3">
                          <div className="rounded-3 p-3" style={{ background: "#f8fafc" }}>
                            <div className="small text-muted">Activos</div>
                            <div className="fw-semibold text-success">{periodo.active_students_count ?? 0}</div>
                          </div>
                        </div>
                        <div className="col-6 col-md-3">
                          <div className="rounded-3 p-3" style={{ background: "#f8fafc" }}>
                            <div className="small text-muted">Bajas</div>
                            <div className="fw-semibold text-warning">{periodo.dropped_students_count ?? 0}</div>
                          </div>
                        </div>
                        <div className="col-6 col-md-3">
                          <div className="rounded-3 p-3" style={{ background: "#f8fafc" }}>
                            <div className="small text-muted">Reportes</div>
                            <div className="fw-semibold">{periodo.reports_count ?? 0}</div>
                          </div>
                        </div>
                      </div>

                      <div className="d-flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => openEditForm(periodo)}
                          disabled={!puedeEditar || isActing}
                        >
                          Modificar
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-primary btn-sm"
                          onClick={() => activarPeriodo(periodo)}
                          disabled={!puedeActivar || isActing}
                        >
                          {isActing && puedeActivar ? "Activando..." : "Activar"}
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => cerrarPeriodo(periodo)}
                          disabled={!puedeCerrar || isActing}
                        >
                          {isActing && puedeCerrar ? "Cerrando..." : "Cerrar"}
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-dark btn-sm"
                          onClick={() => openStatisticsModal(periodo)}
                          disabled={isActing}
                        >
                          Ver estadisticas
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-secondary btn-sm"
                          onClick={() => {
                            setEditingPeriodId(null);
                            setShowForm(true);
                            setForm((prev) => ({
                              ...INITIAL_FORM,
                              clonar_estudiantes_desde_periodo_id: String(periodo.id),
                            }));
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                        >
                          Usar como origen
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {statisticsModal.open && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
          style={{ background: "rgba(15, 23, 42, 0.72)", zIndex: 1700 }}
          onClick={closeStatisticsModal}
        >
          <div
            className="bg-white rounded-4 shadow-lg w-100 d-flex flex-column"
            style={{ maxWidth: "1160px", maxHeight: "90vh" }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="border-bottom p-3 p-md-4 d-flex justify-content-between align-items-start gap-3 flex-wrap">
              <div>
                <div className="small text-uppercase fw-semibold text-muted mb-1" style={{ letterSpacing: "0.08em" }}>
                  Estadisticas del periodo
                </div>
                <h2 className="h4 mb-1">{statisticsPeriod?.codigo || "Periodo seleccionado"}</h2>
                <div className="d-flex flex-wrap gap-2 small text-muted">
                  <span className={badgeClassForStatus(statisticsPeriod?.estatus)}>{statisticsPeriod?.estatus || "Sin estatus"}</span>
                  <span>Inicio: {formatDate(statisticsPeriod?.fecha_inicio)}</span>
                  <span>Fin: {formatDate(statisticsPeriod?.fecha_fin)}</span>
                  {statisticsPeriod?.fecha_cierre && <span>Cierre: {formatDateTime(statisticsPeriod.fecha_cierre)}</span>}
                </div>
              </div>
              <div className="d-flex gap-2 flex-wrap">
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => openStatisticsModal(statisticsPeriod)}
                  disabled={statisticsModal.loading}
                >
                  {statisticsModal.loading ? "Actualizando..." : "Actualizar"}
                </button>
                <button type="button" className="btn btn-primary btn-sm" onClick={closeStatisticsModal}>
                  Cerrar
                </button>
              </div>
            </div>

            <div className="p-3 p-md-4 overflow-auto">
              {statisticsModal.loading && (
                <div className="d-flex align-items-center justify-content-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Cargando estadisticas...</span>
                  </div>
                </div>
              )}

              {!statisticsModal.loading && statisticsModal.error && (
                <div className="alert alert-danger mb-0">{statisticsModal.error}</div>
              )}

              {!statisticsModal.loading && !statisticsModal.error && statisticsModal.data && (
                <div className="d-grid gap-4">
                  <div className="row g-3">
                    {statisticsCards.map((card) => (
                      <div className="col-6 col-lg-3" key={card.key}>
                        <div className="card border-0 shadow-sm h-100">
                          <div className="card-body">
                            <div className="small text-muted">{card.label}</div>
                            <div className={`display-6 fw-semibold ${card.tone}`}>{card.value}</div>
                            <div className="small text-muted">{card.note}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="row g-3">
                    <div className="col-12 col-xl-4">
                      <div className="card border-0 shadow-sm h-100">
                        <div className="card-body">
                          <h3 className="h6 mb-3">Motivos de baja</h3>
                          {statisticsModal.data.drop_reasons?.length > 0 ? (
                            <div className="d-grid gap-2">
                              {statisticsModal.data.drop_reasons.map((item) => (
                                <div
                                  key={`${item.label}-${item.total}`}
                                  className="d-flex justify-content-between align-items-start gap-3 rounded-3 p-3"
                                  style={{ background: "#f8fafc" }}
                                >
                                  <div className="small fw-semibold">{item.label}</div>
                                  <span className="badge rounded-pill text-bg-warning">{item.total}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-muted mb-0">No se registraron bajas en este periodo.</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="col-12 col-xl-4">
                      <div className="card border-0 shadow-sm h-100">
                        <div className="card-body">
                          <div className="d-flex justify-content-between align-items-center mb-3">
                            <h3 className="h6 mb-0">Carreras participantes</h3>
                            <span className="badge rounded-pill text-bg-light border">
                              {statisticsSummary.carreras_activas ?? 0} carrera(s)
                            </span>
                          </div>
                          {statisticsModal.data.career_breakdown?.length > 0 ? (
                            <div className="d-grid gap-2">
                              {statisticsModal.data.career_breakdown.map((item) => (
                                <div
                                  key={`${item.label}-${item.total}`}
                                  className="d-flex justify-content-between align-items-start gap-3 rounded-3 p-3"
                                  style={{ background: "#f8fafc" }}
                                >
                                  <div className="small fw-semibold">{item.label}</div>
                                  <span className="badge rounded-pill text-bg-primary">{item.total}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-muted mb-0">No hay carreras registradas para este periodo.</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="col-12 col-xl-4">
                      <div className="card border-0 shadow-sm h-100">
                        <div className="card-body">
                          <h3 className="h6 mb-3">Entregas por estatus</h3>
                          <div className="d-grid gap-2">
                            {statisticsModal.data.submission_breakdown?.map((item) => (
                              <div
                                key={`${item.status}-${item.total}`}
                                className="d-flex justify-content-between align-items-center gap-3 rounded-3 p-3"
                                style={{ background: "#f8fafc" }}
                              >
                                <div className="small fw-semibold">{item.label}</div>
                                <span className={submissionBadgeClass(item.status)}>{item.total}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="row g-3">
                    <div className="col-12 col-xl-6">
                      <div className="card border-0 shadow-sm h-100">
                        <div className="card-body">
                          <div className="d-flex justify-content-between align-items-center mb-3">
                            <h3 className="h6 mb-0">Empresas vinculadas</h3>
                            <span className="badge rounded-pill text-bg-light border">
                              {statisticsSummary.empresas_vinculadas ?? 0} empresa(s)
                            </span>
                          </div>
                          {statisticsModal.data.company_breakdown?.length > 0 ? (
                            <div className="d-grid gap-2">
                              {statisticsModal.data.company_breakdown.map((item) => (
                                <div
                                  key={`${item.label}-${item.total}`}
                                  className="d-flex justify-content-between align-items-start gap-3 rounded-3 p-3"
                                  style={{ background: "#f8fafc" }}
                                >
                                  <div className="small fw-semibold">{item.label}</div>
                                  <span className="badge rounded-pill text-bg-info">{item.total}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-muted mb-0">Ningun alumno quedo vinculado a una empresa en este periodo.</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="col-12 col-xl-6">
                      <div className="card border-0 shadow-sm h-100">
                        <div className="card-body">
                          <h3 className="h6 mb-3">Lectura rapida</h3>
                          <div className="d-grid gap-2">
                            <div className="rounded-3 p-3" style={{ background: "#eff6ff" }}>
                              <div className="small text-muted mb-1">Balance general</div>
                              <div className="fw-semibold">
                                {statisticsSummary.activos ?? 0} activos, {statisticsSummary.inactivos ?? 0} inactivos y{" "}
                                {statisticsSummary.bajas ?? 0} bajas al cierre.
                              </div>
                            </div>
                            <div className="rounded-3 p-3" style={{ background: "#f0fdf4" }}>
                              <div className="small text-muted mb-1">Participacion</div>
                              <div className="fw-semibold">
                                {statisticsSummary.con_acceso ?? 0} alumno(s) ingresaron al sistema durante el periodo.
                              </div>
                            </div>
                            <div className="rounded-3 p-3" style={{ background: "#fff7ed" }}>
                              <div className="small text-muted mb-1">Documentacion</div>
                              <div className="fw-semibold">
                                Se recibieron {statisticsSummary.entregas ?? 0} entrega(s) sobre {statisticsSummary.reportes ?? 0} reporte(s) configurados.
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
