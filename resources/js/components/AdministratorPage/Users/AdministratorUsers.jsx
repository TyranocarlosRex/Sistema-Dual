import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const CARRERAS = [
  "Ingenieria Biomedica",
  "Ingenieria Electrica",
  "Ingenieria Electronica",
  "Ingenieria Industrial",
  "Ingenieria Mecanica",
  "Ingenieria Mecatronica",
  "Licenciatura en Administracion",
  "Ingenieria en Sistemas Computacionales",
  "Ingenieria Informatica",
  "Ingenieria en Gestion Empresarial",
  "Ingenieria Aeronautica",
];

const ESTATUS = ["Activo", "Inactivo"];

const HERO_STYLE = {
  background: "linear-gradient(135deg, #2563eb 0%, #0f172a 100%)",
  color: "#fff",
  borderRadius: "20px",
  padding: "24px 28px",
  boxShadow: "0 24px 54px -35px rgba(37, 99, 235, 0.7)",
};

export default function AdministratorUsers() {
  const navigate = useNavigate();

  const [tipo, setTipo] = useState("students");
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [carrera, setCarrera] = useState("");
  const [estatus, setEstatus] = useState("");

  const [rows, setRows] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [actualizandoId, setActualizandoId] = useState(null);

  useEffect(() => {
    setNombre("");
    setCorreo("");
    setCarrera("");
    setEstatus("");
    buscarUsuarios();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipo]);

  const endpointPorTipo = () => {
    switch (tipo) {
      case "coordinators":
        return "/api/coordinators";
      case "students":
      default:
        return "/api/students";
    }
  };

  const normalize = (u) => {
    const n =
      u?.nombre ?? u?.Nombre ?? u?.first_name ?? u?.firstName ?? u?.name ?? "";
    const a =
      u?.apellidos ??
      u?.Apellidos ??
      u?.last_name ??
      u?.lastName ??
      u?.surname ??
      "";

    const email =
      u?.correo ??
      u?.Correo ??
      u?.email ??
      u?.Email ??
      u?.user?.email ??
      u?.user?.Email ??
      "-";

    const careerRaw =
      u?.carrera ?? u?.Carrera ?? u?.career ?? u?.Career ?? u?.programa ?? null;
    const career = Array.isArray(careerRaw)
      ? careerRaw.join(", ")
      : careerRaw ?? "-";

    const noControl =
      u?.No_control ??
      u?.no_control ??
      u?.noControl ??
      u?.matricula ??
      u?.Matricula ??
      u?.control ??
      "-";

    const estatusNormalizado =
      u?.estatus ?? u?.Estatus ?? u?.status ?? u?.Status ?? "-";

    const id =
      u?.id ??
      `${(email || "sin-correo")}-${(n || "").trim()}-${(a || "").trim()}`.replaceAll(
        " ",
        "_"
      );

    return {
      id,
      nombre: n || "-",
      apellidos: a || "-",
      correo: email,
      carrera: career,
      no_control: noControl,
      estatus: estatusNormalizado,
      _raw: u,
    };
  };

  const columnas =
    tipo === "coordinators"
      ? [
          { key: "apellidos", label: "Apellidos" },
          { key: "nombre", label: "Nombre" },
          { key: "correo", label: "Correo" },
          { key: "carrera", label: "Carrera" },
        ]
      : [
          { key: "no_control", label: "No. Control" },
          { key: "apellidos", label: "Apellidos" },
          { key: "nombre", label: "Nombre" },
          { key: "carrera", label: "Carrera" },
          { key: "estatus", label: "Estado" },
        ];

  const buscarUsuarios = async (page = 1) => {
    setCargando(true);
    setError("");

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setRows([]);
        setError("No hay sesion de administrador. Vuelve a iniciar sesion.");
        return;
      }

      const url = endpointPorTipo();

      const params = {
        page,
        per_page: 12,
      };

      if (carrera) {
        params.carrera = carrera;
      }

      if (tipo === "students") {
        const trimmed = nombre.trim();
        const esNumeroControl = trimmed !== "" && /^\d+$/.test(trimmed);

        params.rol = "student";
        params.nombre = !esNumeroControl ? (trimmed || undefined) : undefined;
        params.no_control = esNumeroControl ? trimmed : undefined;
        params.estatus = estatus || undefined;
      } else {
        params.rol = "coordinator";
        const trimmedCorreo = correo.trim();
        params.correo = trimmedCorreo || undefined;
      }

      const { data } = await axios.get(url, {
        params,
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      const listaCruda = Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data)
        ? data
        : Array.isArray(data?.results)
        ? data.results
        : [];

      setRows(listaCruda.map(normalize));
    } catch (e) {
      console.error(e);
      setRows([]);
      setError(
        "No se pudo obtener la lista. Verifica el tipo seleccionado o los parametros de busqueda."
      );
    } finally {
      setCargando(false);
    }
  };

  const cambiarEstatusEstudiante = async (fila, nuevoEstatus) => {
    if (tipo !== "students") return;

    try {
      setActualizandoId(fila.id);

      const token = localStorage.getItem("token");
      if (!token) {
        alert("La sesion ha expirado, vuelve a iniciar sesion como administrador.");
        return;
      }

      const idBack = fila._raw?.id ?? fila.id;

      await axios.patch(
        `/api/students/${idBack}/estatus`,
        { estatus: nuevoEstatus },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      setRows((prev) =>
        prev.map((r) => (r.id === fila.id ? { ...r, estatus: nuevoEstatus } : r))
      );
    } catch (e) {
      console.error(e);
      alert("No se pudo actualizar el estatus del estudiante.");
    } finally {
      setActualizandoId(null);
    }
  };

  const verDetalle = (fila) => {
    const idBack = fila._raw?.id ?? fila.id;
    navigate(`/administrator/students/${idBack}`);
  };

  const badgeClassForStatus = (estatus) => {
    const val = (estatus || "").toLowerCase();
    if (val === "activo") return "badge rounded-pill bg-success";
    if (val === "inactivo") return "badge rounded-pill bg-danger";
    if (val === "pendiente") return "badge rounded-pill bg-warning text-dark";
    if (val === "rechazado") return "badge rounded-pill bg-danger";
    return "badge rounded-pill bg-secondary";
  };

  const colSpanExtra = columnas.length + (tipo === "students" ? 1 : 0);
  const isStudents = tipo === "students";

  const resumen = useMemo(() => {
    const total = rows.length;
    const activos = rows.filter((r) => (r.estatus || "").toLowerCase() === "activo").length;
    const inactivos = rows.filter((r) => (r.estatus || "").toLowerCase() === "inactivo").length;
    return { total, activos, inactivos };
  }, [rows]);

  return (
    <div className="p-3 p-md-4" style={{ background: "#f5f7fb", minHeight: "100vh" }}>
      <div className="container-fluid" style={{ maxWidth: "1200px" }}>
        <section style={HERO_STYLE} className="mb-4">
          <p className="text-uppercase small mb-1" style={{ letterSpacing: "0.08em", opacity: 0.85 }}>
            Usuarios {isStudents ? "— Estudiantes" : "— Coordinadores"}
          </p>
          <div className="d-flex flex-wrap align-items-center gap-3">
            <div>
              <h1 className="h4 mb-1">Gestiona usuarios y estados</h1>
              <p className="mb-0" style={{ maxWidth: "520px", opacity: 0.9 }}>
                Filtra, consulta y actualiza el estatus desde un panel limpio con acciones rapidas.
              </p>
            </div>
            <div className="ms-auto d-flex gap-2">
              <button
                className="btn btn-light btn-sm"
                type="button"
                onClick={buscarUsuarios}
                disabled={cargando}
              >
                {cargando ? "Actualizando..." : "Actualizar lista"}
              </button>
            </div>
          </div>
        </section>

        <div className="row g-3 mb-3">
          <div className="col-12 col-md-4">
            <div className="card shadow-sm border-0 h-100">
              <div className="card-body">
                <p className="text-muted small mb-1">Total</p>
                <h4 className="mb-0">{resumen.total}</h4>
              </div>
            </div>
          </div>
          <div className="col-12 col-md-4">
            <div className="card shadow-sm border-0 h-100">
              <div className="card-body">
                <p className="text-muted small mb-1">Activos</p>
                <h4 className="mb-0 text-success">{resumen.activos}</h4>
              </div>
            </div>
          </div>
          <div className="col-12 col-md-4">
            <div className="card shadow-sm border-0 h-100">
              <div className="card-body">
                <p className="text-muted small mb-1">Inactivos</p>
                <h4 className="mb-0 text-danger">{resumen.inactivos}</h4>
              </div>
            </div>
          </div>
        </div>

        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body">
            <div className="d-flex flex-wrap gap-2 align-items-center mb-3">
              <span className="fw-semibold">Ver:</span>
              <div className="btn-group" role="group">
                <button
                  type="button"
                  className={`btn btn-sm ${isStudents ? "btn-primary" : "btn-outline-primary"}`}
                  onClick={() => setTipo("students")}
                  disabled={cargando}
                >
                  Estudiantes
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${!isStudents ? "btn-primary" : "btn-outline-primary"}`}
                  onClick={() => setTipo("coordinators")}
                  disabled={cargando}
                >
                  Coordinadores
                </button>
              </div>
              <span className="badge bg-light text-dark ms-auto">
                {rows.length} resultados
              </span>
            </div>

            <div className="row g-3">
              {isStudents && (
                <>
                  <div className="col-md-4">
                    <label className="form-label">Nombre o No. Control</label>
                    <input
                      className="form-control"
                      type="text"
                      placeholder="Ej. Ana Lopez o 20231234"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Carrera</label>
                    <select
                      className="form-select"
                      value={carrera}
                      onChange={(e) => setCarrera(e.target.value)}
                    >
                      <option value="">Todas las carreras</option>
                      {CARRERAS.map((car) => (
                        <option key={car} value={car}>
                          {car}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Estado</label>
                    <select
                      className="form-select"
                      value={estatus}
                      onChange={(e) => setEstatus(e.target.value)}
                    >
                      <option value="">Todos</option>
                      {ESTATUS.map((eOpt) => (
                        <option key={eOpt} value={eOpt}>
                          {eOpt}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {!isStudents && (
                <>
                  <div className="col-md-6">
                    <label className="form-label">Correo</label>
                    <input
                      className="form-control"
                      type="email"
                      placeholder="coordinador@ejemplo.com"
                      value={correo}
                      onChange={(e) => setCorreo(e.target.value)}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Carrera</label>
                    <select
                      className="form-select"
                      value={carrera}
                      onChange={(e) => setCarrera(e.target.value)}
                    >
                      <option value="">Todas las carreras</option>
                      {CARRERAS.map((car) => (
                        <option key={car} value={car}>
                          {car}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <div className="col-12 d-flex justify-content-end gap-2">
                <button
                  className="btn btn-outline-secondary"
                  type="button"
                  onClick={() => {
                    setNombre("");
                    setCorreo("");
                    setCarrera("");
                    setEstatus("");
                    buscarUsuarios();
                  }}
                  disabled={cargando}
                >
                  Limpiar
                </button>
                <button
                  className="btn btn-primary"
                  type="button"
                  onClick={buscarUsuarios}
                  disabled={cargando}
                >
                  {cargando ? "Buscando..." : "Buscar"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger shadow-sm" role="alert">
            {error}
          </div>
        )}

        <div className="card border-0 shadow-sm">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    {columnas.map((c) => (
                      <th key={c.key} style={{ whiteSpace: "nowrap" }}>{c.label}</th>
                    ))}
                    {isStudents && <th style={{ width: "200px" }}>Acciones</th>}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id}>
                      {columnas.map((c) => {
                        if (c.key === "estatus") {
                          return (
                            <td key={c.key}>
                              {r.estatus && r.estatus !== "-" ? (
                                <span className={badgeClassForStatus(r.estatus)}>
                                  {r.estatus}
                                </span>
                              ) : (
                                <span className="text-muted">N/A</span>
                              )}
                            </td>
                          );
                        }
                        return <td key={c.key}>{r[c.key] ?? "-"}</td>;
                      })}

                      {isStudents && (
                        <td>
                          <div className="d-flex flex-wrap gap-2">
                            <button
                              type="button"
                              className="btn btn-outline-primary btn-sm"
                              onClick={() => verDetalle(r)}
                            >
                              Ver
                            </button>
                            <button
                              type="button"
                              className="btn btn-success btn-sm"
                              disabled={
                                actualizandoId === r.id || r.estatus === "Activo"
                              }
                              onClick={() => cambiarEstatusEstudiante(r, "Activo")}
                            >
                              Activo
                            </button>
                            <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              disabled={
                                actualizandoId === r.id || r.estatus === "Inactivo"
                              }
                              onClick={() => cambiarEstatusEstudiante(r, "Inactivo")}
                            >
                              Inactivo
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}

                  {rows.length === 0 && !cargando && (
                    <tr>
                      <td colSpan={colSpanExtra} className="text-center text-muted py-4">
                        Sin resultados
                      </td>
                    </tr>
                  )}

                  {cargando && (
                    <tr>
                      <td colSpan={colSpanExtra} className="text-center py-4">
                        <div className="spinner-border text-primary" role="status">
                          <span className="visually-hidden">Cargando...</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
