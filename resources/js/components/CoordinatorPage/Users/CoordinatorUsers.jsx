import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { getApiErrorMessage } from "../../../utils/errorMessages";

function LegacyCoordinatorUsers() {
  const [users, setUsers] = useState([]);

  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [rol, setRol] = useState("student");
  const [editandoId, setEditandoId] = useState(null);
  const [legacyError, setLegacyError] = useState("");

  const agregarUsuario = () => {
    if (nombre.trim() === "" || correo.trim() === "" || rol.trim() === "") {
      setLegacyError("Completa nombre, correo y rol para agregar el usuario.");
      return;
    }

    setLegacyError("");
    const nuevo = {
      id: Date.now(),
      nombre,
      correo,
      rol,
    };

    setUsers(users.concat(nuevo));
    setNombre("");
    setCorreo("");
    setRol("student");
  };

  const eliminarUsuario = (id) => {
    const nuevaLista = users.filter((u) => u.id !== id);
    setUsers(nuevaLista);
  };

  const empezarEdicion = (usuario) => {
    setEditandoId(usuario.id);
    setNombre(usuario.nombre);
    setCorreo(usuario.correo);
    setRol(usuario.rol);
  };

  const guardarCambios = () => {
    const actualizados = users.map((u) => {
      if (u.id === editandoId) {
        return { ...u, nombre, correo, rol };
      }
      return u;
    });

    setUsers(actualizados);
    setEditandoId(null);
    setNombre("");
    setCorreo("");
    setRol("student");
  };

  return (
    <div style={{ padding: "20px" }}>
      {legacyError && <div style={{ color: "#b91c1c", marginBottom: "12px" }}>{legacyError}</div>}
      <h2>Gestión de Usuarios</h2>

      {}
      <div style={{ marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="Nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          style={{ marginRight: "10px" }}
        />
        <input
          type="email"
          placeholder="Correo"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
          style={{ marginRight: "10px" }}
        />
        <select
          value={rol}
          onChange={(e) => setRol(e.target.value)}
          style={{ marginRight: "10px" }}
        >
          <option value="student">Estudiante</option>
          <option value="coordinator">Coordinador</option>
        </select>

        {editandoId ? (
          <button onClick={guardarCambios}>Guardar Cambios</button>
        ) : (
          <button onClick={agregarUsuario}>Agregar</button>
        )}
      </div>

      {}
      <table border="1" cellPadding="5" style={{ width: "100%", textAlign: "left" }}>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Correo</th>
            <th>Rol</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.nombre}</td>
              <td>{u.correo}</td>
              <td>{u.rol}</td>
              <td>
                <button onClick={() => empezarEdicion(u)}>Editar</button>
                <button
                  onClick={() => eliminarUsuario(u.id)}
                  style={{ marginLeft: "10px" }}
                >
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
          {users.length === 0 && (
            <tr>
              <td colSpan="4" style={{ textAlign: "center" }}>
                No hay usuarios
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function CoordinatorUsers() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filtroNombre, setFiltroNombre] = useState("");
  const [filtroNoControl, setFiltroNoControl] = useState("");
  const [filtroEstatus, setFiltroEstatus] = useState("");
  const getEmpresa = (student) =>
    student?.Empresa ?? student?.empresa ?? "Sin empresa";

  const coordinator = useMemo(() => {
    const raw = localStorage.getItem("coordinator");
    try {
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || !coordinator) {
      setLoading(false);
      return;
    }

    const fetchStudents = async () => {
      try {
        setLoading(true);
        setError("");
        const carrera = coordinator.Carrera ?? coordinator.carrera ?? "";
        const res = await axios.get("/api/students", {
          params: {
            carrera,
            nombre: filtroNombre || undefined,
            no_control: filtroNoControl || undefined,
            estatus: filtroEstatus || undefined,
          },
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = res.data?.data ?? res.data ?? [];
        setStudents(data);
      } catch (err) {
        console.error(err);
        setError(getApiErrorMessage(err, "No pudimos cargar los estudiantes de tu carrera. Actualiza la pagina e intenta de nuevo."));
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [coordinator, filtroNombre, filtroNoControl, filtroEstatus]);

  return (
    <div className="container py-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
        <div>
          <p className="text-muted mb-0 small">Coordinador</p>
          <h4 className="mb-0">Estudiantes de tu carrera</h4>
          {coordinator && (
            <div className="text-secondary small">
              Carrera: <strong>{coordinator.Carrera || coordinator.carrera || "N/D"}</strong>
            </div>
          )}
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card mb-3">
        <div className="card-body">
          <div className="row g-3 align-items-end">
            <div className="col-12 col-md-4">
              <label className="form-label">Nombre</label>
              <input
                type="text"
                className="form-control"
                value={filtroNombre}
                onChange={(e) => setFiltroNombre(e.target.value)}
                placeholder="Buscar por nombre"
              />
            </div>
            <div className="col-12 col-md-3">
              <label className="form-label">No. Control</label>
              <input
                type="text"
                className="form-control"
                value={filtroNoControl}
                onChange={(e) => setFiltroNoControl(e.target.value)}
                placeholder="Ej. 12345"
              />
            </div>
            <div className="col-12 col-md-3">
              <label className="form-label">Estatus</label>
              <select
                className="form-select"
                value={filtroEstatus}
                onChange={(e) => setFiltroEstatus(e.target.value)}
              >
                <option value="">Todos</option>
                <option value="Activo">Activo</option>
                <option value="Inactivo">Inactivo</option>
                <option value="Baja">Baja</option>
              </select>
            </div>
            <div className="col-12 col-md-2">
              <label className="form-label d-block">&nbsp;</label>
              <div className="text-muted small">
                {loading ? "Cargando..." : `${students.length} registros`}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Nombre</th>
                  <th>Correo</th>
                  <th>Empresa</th>
                  <th>No. Control</th>
                  <th>Estatus</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" className="text-center py-3 text-muted">
                      Cargando...
                    </td>
                  </tr>
                ) : students.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-3 text-muted">
                      No hay estudiantes para esta carrera.
                    </td>
                  </tr>
                ) : (
                  students.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <div className="fw-semibold">
                          {s.Nombre} {s.Apellidos}
                        </div>
                        <div className="small text-muted">
                          {s.Correo || "-"}
                        </div>
                      </td>
                      <td>{s.Correo || "-"}</td>
                      <td>{getEmpresa(s)}</td>
                      <td>{s.No_control || "-"}</td>
                      <td>
                        <span
                          className={`badge text-bg-${
                            (s.estatus || s.Estatus || "").toLowerCase() === "activo"
                              ? "success"
                              : (s.estatus || s.Estatus || "").toLowerCase() === "baja"
                              ? "warning"
                              : "secondary"
                          }`}
                        >
                          {s.estatus || s.Estatus || "N/D"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CoordinatorUsers;
