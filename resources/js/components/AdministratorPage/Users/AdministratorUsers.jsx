import React, { useEffect, useState } from "react";
import axios from "axios";

export default function AdministratorUsers() {
  const [tipo, setTipo] = useState("students");

  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [carrera, setCarrera] = useState("");

  const [rows, setRows] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    buscarUsuarios();
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

    const estatus =
      u?.estatus ?? u?.Estatus ?? u?.status ?? u?.Status ?? "-";

    const id =
    u?.id ??
    `${(email || "sin-correo")}-${(n || "").trim()}-${(a || "").trim()}`.replaceAll(" ", "_");
    
    return {
      id,
      nombre: n || "-",
      apellidos: a || "-",
      correo: email,
      carrera: career,
      no_control: noControl,
      estatus: estatus,
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
          { key: "no_control", label: "No_control" },
          { key: "apellidos", label: "Apellidos" },
          { key: "nombre", label: "Nombre" },
          { key: "correo", label: "Correo" },
          { key: "carrera", label: "Carrera" },
          { key: "estatus", label: "Estatus" },
        ];

  const buscarUsuarios = async () => {
    setCargando(true);
    setError("");
    try {
      const url = endpointPorTipo();
      const { data } = await axios.get(url, {params: {
        rol: tipo === 'students' ? 'student' : 'coordinator',
        nombre: nombre || undefined,
        correo: correo || undefined,
        carrera: carrera || undefined,
        page: 1,
        per_page: 10,
      },
      withCredentials: true,
      headers: { Accept: 'application/json' },
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
        "No se pudo obtener la lista. Verifica el endpoint del tipo seleccionado o los parámetros."
      );
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>
        Usuarios — {tipo === "students" ? "Estudiantes" : "Coordinadores"}
      </h2>

      {}
      <div
        style={{
          marginBottom: 12,
          display: "flex",
          gap: 12,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <label>
          Ver:&nbsp;
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            style={{ padding: "6px 8px" }}
          >
            <option value="students">Estudiantes</option>
            <option value="coordinators">Coordinadores</option>
          </select>
        </label>
      </div>

      {}
      <div
        style={{
          marginBottom: 16,
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        <input
          type="text"
          placeholder="Nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />
        <input
          type="email"
          placeholder="Correo"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
        />
        <input
          type="text"
          placeholder="Carrera"
          value={carrera}
          onChange={(e) => setCarrera(e.target.value)}
        />
        <button onClick={buscarUsuarios} disabled={cargando}>
          {cargando ? "Buscando..." : "Buscar"}
        </button>
      </div>

      {error && (
        <div style={{ marginBottom: 10, color: "crimson" }}>{error}</div>
      )}

      {}
      <table
        border="1"
        cellPadding="5"
        style={{ width: "100%", textAlign: "left" }}
      >
        <thead>
          <tr>
            {columnas.map((c) => (
              <th key={c.key}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              {columnas.map((c) => (
                <td key={c.key}>{r[c.key] ?? "-"}</td>
              ))}
            </tr>
          ))}
          {rows.length === 0 && !cargando && (
            <tr>
              <td colSpan={columnas.length} style={{ textAlign: "center" }}>
                Sin resultados
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}