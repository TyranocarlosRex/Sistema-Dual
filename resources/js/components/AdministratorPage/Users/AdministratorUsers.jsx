import axios from "axios";
import React, { useEffect, useState } from "react";
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

export default function AdministratorUsers() {
  const navigate = useNavigate();

  const [tipo, setTipo] = useState("students");

  const [nombre, setNombre] = useState("");   // sólo se usa para students
  const [correo, setCorreo] = useState("");   // sólo se usa para coordinators
  const [carrera, setCarrera] = useState("");
  const [estatus, setEstatus] = useState(""); // sólo se usa para students

  const [rows, setRows] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const [actualizandoId, setActualizandoId] = useState(null);

  useEffect(() => {
    // cuando cambias de tipo, limpio filtros que no aplican
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
          { key: "nombre", label: "Nombre" },
          { key: "carrera", label: "Carrera" },
          { key: "estatus", label: "Estado" },
        ];

  const buscarUsuarios = async () => {
    setCargando(true);
    setError("");
    try {
      const url = endpointPorTipo();

      const params = {
        rol: tipo === "students" ? "student" : "coordinator",
        carrera: carrera || undefined,
        page: 1,
        per_page: 10,
      };

      if (tipo === "students") {
        const trimmed = nombre.trim();
        const esNumeroControl = trimmed !== "" && /^\d+$/.test(trimmed);

        params.nombre = !esNumeroControl ? (trimmed || undefined) : undefined;
        params.no_control = esNumeroControl ? trimmed : undefined;
        params.estatus = estatus || undefined;
      } else {
        // coordinators: sólo correo + carrera
        const trimmedCorreo = correo.trim();
        params.correo = trimmedCorreo || undefined;
      }

      const { data } = await axios.get(url, {
        params,
        withCredentials: true,
        headers: { Accept: "application/json" },
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
        "No se pudo obtener la lista. Verifica el tipo seleccionado o los parámetros de búsqueda."
      );
    } finally {
      setCargando(false);
    }
  };

  // SOLO estudiantes: actualizar estatus en la BD
  const cambiarEstatusEstudiante = async (fila, nuevoEstatus) => {
    if (tipo !== "students") return;

    try {
      setActualizandoId(fila.id);

      const idBack = fila._raw?.id ?? fila.id;

      await axios.patch(
        `/api/students/${idBack}/estatus`,
        { estatus: nuevoEstatus },
        {
          withCredentials: true,
          headers: { Accept: "application/json" },
        }
      );

      setRows((prev) =>
        prev.map((r) =>
          r.id === fila.id ? { ...r, estatus: nuevoEstatus } : r
        )
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

  return (
    <div className="container py-3">
      {/* Título */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">
          Usuarios — {tipo === "students" ? "Estudiantes" : "Coordinadores"}
        </h2>
      </div>

      {/* Selector de tipo */}
      <div className="d-flex gap-2 mb-3 flex-wrap align-items-center">
        <span className="fw-semibold">Ver:</span>
        <select
          className="form-select"
          style={{ maxWidth: 220 }}
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
        >
          <option value="students">Estudiantes</option>
          <option value="coordinators">Coordinadores</option>
        </select>
      </div>

      {/* Card de filtros */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            {tipo === "students" && (
              <>
                {/* Nombre / No. Control */}
                <div className="col-md-4">
                  <label className="form-label">Nombre o No. Control</label>
                  <input
                    className="form-control"
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                  />
                </div>

                {/* Carrera */}
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

                {/* Estado */}
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

            {tipo === "coordinators" && (
              <>
                {/* Correo */}
                <div className="col-md-6">
                  <label className="form-label">Correo</label>
                  <input
                    className="form-control"
                    type="email"
                    value={correo}
                    onChange={(e) => setCorreo(e.target.value)}
                  />
                </div>

                {/* Carrera */}
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

            <div className="col-12 d-flex justify-content-end">
              <button
                className="btn btn-outline-secondary me-2"
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

      {/* Error */}
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {/* Tabla */}
      <div className="table-responsive">
        <table className="table table-sm align-middle">
          <thead>
            <tr>
              {columnas.map((c) => (
                <th key={c.key}>{c.label}</th>
              ))}
              {tipo === "students" && <th>Acciones</th>}
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

                {tipo === "students" && (
                  <td>
                    <div className="d-flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="btn btn-outline-primary btn-sm"
                        onClick={() => verDetalle(r)}
                      >
                        👁️
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
                <td colSpan={colSpanExtra} className="text-center text-muted">
                  Sin resultados
                </td>
              </tr>
            )}

            {cargando && (
              <tr>
                <td colSpan={colSpanExtra} className="text-center">
                  Cargando...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}