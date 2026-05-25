import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { APP_ROUTES } from "../../../routes";
import { getApiErrorMessage } from "../../../utils/errorMessages";

const HERO_STYLE = {
  background: "linear-gradient(135deg, #0ea5e9 0%, #0f172a 100%)",
  color: "#fff",
  borderRadius: "20px",
  padding: "24px 28px",
  boxShadow: "0 24px 54px -35px rgba(14, 165, 233, 0.6)",
};

export default function CoordinatorTracking() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterEstatus, setFilterEstatus] = useState("todos");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("token");
        const res = await axios.get("/api/students", {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
          params: { per_page: 200, rol: "student" },
          withCredentials: true,
        });

        const data = Array.isArray(res.data?.data) ? res.data.data : res.data;
        setStudents(data || []);
      } catch (err) {
        console.error("Error cargando estudiantes:", err);
        setError(getApiErrorMessage(err, "No pudimos cargar los estudiantes. Actualiza la pagina e intenta de nuevo."));
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  const getEmpresa = (s) => s.empresa ?? s.Empresa ?? "Sin empresa";
  const getEstatus = (s) => s.estatus ?? s.Estatus ?? s.status ?? "Sin estatus";
  const getNombreCompleto = (s) => {
    const nombre = s.Nombre ?? s.nombre ?? s.name ?? "";
    const apellidos = s.Apellidos ?? s.apellidos ?? s.last_name ?? "";
    return `${nombre} ${apellidos}`.trim() || "Sin nombre";
  };
  const getNoControl = (s) => s.No_control ?? s.no_control ?? s.noControl ?? "";
  const getPeriodo = (s) => {
    const period = s.periodo ?? s.Periodo ?? s.period ?? null;

    if (!period) return "-";
    if (typeof period === "string" || typeof period === "number") return String(period);
    if (typeof period === "object") {
      return period.codigo ?? period.nombre ?? period.name ?? String(period.id ?? "-");
    }

    return "-";
  };
  const getStatusKey = (s) => String(getEstatus(s) || "").trim().toLowerCase();

  const estados = useMemo(() => {
    const set = new Set();
    students.forEach((s) => set.add(getEstatus(s)));
    return Array.from(set);
  }, [students]);

  const filteredStudents = useMemo(() => {
    const searchLower = search.toLowerCase();
    return students.filter((s) => {
      const estatus = getEstatus(s);
      const nombre = getNombreCompleto(s);
      const noCtrl = getNoControl(s);

      if (filterEstatus !== "todos" && estatus !== filterEstatus) return false;
      if (searchLower) {
        const texto = `${nombre} ${noCtrl}`.toLowerCase();
        if (!texto.includes(searchLower)) return false;
      }
      return true;
    });
  }, [students, filterEstatus, search]);

  const totalFiltrados = filteredStudents.length;

  const getProgreso = (s) => {
    const value = Number(s.progress_percent ?? 0);
    if (!Number.isFinite(value)) return 0;
    return Math.max(0, Math.min(100, Math.round(value)));
  };

  const resumen = useMemo(() => {
    const total = filteredStudents.length;
    const activos = filteredStudents.filter((s) => getStatusKey(s) === "activo").length;
    const inactivos = filteredStudents.filter((s) => getStatusKey(s) === "inactivo").length;
    const bajas = filteredStudents.filter((s) => getStatusKey(s) === "baja").length;
    return { total, activos, inactivos, bajas };
  }, [filteredStudents]);

  if (loading) {
    return <div className="container mt-4">Cargando...</div>;
  }

  if (error) {
    return <div className="container mt-4 text-danger">{error}</div>;
  }

  return (
    <div className="p-3 p-md-4" style={{ background: "#f5f7fb", minHeight: "100vh" }}>
      <div className="container-fluid" style={{ maxWidth: "1200px" }}>
        <section style={HERO_STYLE} className="mb-4">
          <p className="text-uppercase small mb-1" style={{ letterSpacing: "0.08em", opacity: 0.85 }}>
            Seguimiento de estudiantes
          </p>
          <div className="d-flex flex-wrap align-items-center gap-3">
            <div>
              <h1 className="h4 mb-1">Visualiza avance y entregas</h1>
              <p className="mb-0" style={{ maxWidth: "540px", opacity: 0.9 }}>
                Filtra por estatus y revisa el progreso de tus estudiantes.
              </p>
            </div>
            <div className="ms-auto d-flex gap-2">
              <button
                className="btn btn-light btn-sm"
                type="button"
                onClick={() => window.location.reload()}
              >
                Refrescar
              </button>
            </div>
          </div>
        </section>

        <div className="row g-3 mb-3">
          <div className="col-12 col-md-3">
            <div className="card shadow-sm border-0 h-100">
              <div className="card-body">
                <p className="text-muted small mb-1">Total filtrado</p>
                <h4 className="mb-0">{resumen.total}</h4>
              </div>
            </div>
          </div>
          <div className="col-12 col-md-3">
            <div className="card shadow-sm border-0 h-100">
              <div className="card-body">
                <p className="text-muted small mb-1">Activos</p>
                <h4 className="mb-0 text-success">{resumen.activos}</h4>
              </div>
            </div>
          </div>
          <div className="col-12 col-md-3">
            <div className="card shadow-sm border-0 h-100">
              <div className="card-body">
                <p className="text-muted small mb-1">Inactivos</p>
                <h4 className="mb-0 text-danger">{resumen.inactivos}</h4>
              </div>
            </div>
          </div>
          <div className="col-12 col-md-3">
            <div className="card shadow-sm border-0 h-100">
              <div className="card-body">
                <p className="text-muted small mb-1">Bajas</p>
                <h4 className="mb-0 text-warning">{resumen.bajas}</h4>
              </div>
            </div>
          </div>
        </div>

        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body">
            <div className="row g-3 align-items-end">
              <div className="col-md-6">
                <label className="form-label">Buscar</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Nombre o No. de control"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Estatus</label>
                <select
                  className="form-select"
                  value={filterEstatus}
                  onChange={(e) => setFilterEstatus(e.target.value)}
                >
                  <option value="todos">Todos</option>
                  {estados.map((e) => (
                    <option key={e} value={e}>
                      {e}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="card shadow-sm border-0 mb-4">
          <div className="card-header bg-light d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Progreso de estudiantes</h5>
            <span className="text-muted small">Mostrando {Math.min(totalFiltrados, 20)} de {totalFiltrados}</span>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Estudiante</th>
                    <th>No. Control</th>
                    <th>Empresa</th>
                    <th>Periodo</th>
                    <th>Progreso</th>
                    <th>Estado</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center text-muted">
                        No hay estudiantes que coincidan con los filtros.
                      </td>
                    </tr>
                  )}

                  {filteredStudents.slice(0, 20).map((s) => {
                    const nombre = getNombreCompleto(s);
                    const noCtrl = getNoControl(s);
                    const empresa = getEmpresa(s);
                    const periodo = getPeriodo(s);
                    const estatus = getEstatus(s);
                    const progreso = getProgreso(s);
                    const studentId = s.id ?? s.student_id ?? s.studentId;
                    const statusKey = getStatusKey(s);

                    let estadoClass = "secondary";
                    if (statusKey === "activo") estadoClass = "success";
                    else if (statusKey === "baja") estadoClass = "warning text-dark";
                    else if (/egresado/i.test(estatus)) estadoClass = "primary";
                    else if (/proceso/i.test(estatus)) estadoClass = "info";

                    return (
                      <tr key={s.id || `${nombre}-${noCtrl}`}>
                        <td className="text-break" style={{ whiteSpace: "normal" }}>{nombre}</td>
                        <td>{noCtrl}</td>
                        <td className="text-break" style={{ whiteSpace: "normal" }}>{empresa}</td>
                        <td>{periodo}</td>
                        <td style={{ whiteSpace: "normal" }}>
                          <div className="d-flex align-items-center">
                            <div className="progress flex-grow-1 me-2" style={{ height: "6px" }}>
                              <div
                                className={`progress-bar bg-${
                                  progreso < 30 ? "danger" : progreso < 70 ? "warning" : "success"
                                }`}
                                role="progressbar"
                                style={{ width: `${progreso}%` }}
                              ></div>
                            </div>
                            <small className="text-muted">{progreso}%</small>
                          </div>
                        </td>
                        <td>
                          <span className={`badge bg-${estadoClass}`}>{estatus}</span>
                        </td>
                        <td>
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => navigate(APP_ROUTES.coordinator.studentDetails(studentId || ""))}
                            disabled={!studentId}
                          >
                            Ver detalle
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
