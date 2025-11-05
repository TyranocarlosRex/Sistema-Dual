import React, { useState } from "react";

export default function CoordinatorReports() {
  // Lista inicial vacía
  const [reports, setReports] = useState([]);

  // Datos del formulario
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");

  // Para edición
  const [editandoId, setEditandoId] = useState(null);

  // Agregar o actualizar reporte
  const guardarReporte = () => {
    if (titulo.trim() === "" || descripcion.trim() === "") {
      alert("Completa todos los campos");
      return;
    }

    if (editandoId === null) {
      // Nuevo reporte
      const nuevoReporte = {
        id: Date.now(),
        titulo,
        descripcion,
        fecha: new Date().toLocaleDateString(),
      };
      setReports([...reports, nuevoReporte]);
    } else {
      // Editar reporte existente
      const actualizados = reports.map((r) =>
        r.id === editandoId ? { ...r, titulo, descripcion } : r
      );
      setReports(actualizados);
      setEditandoId(null);
    }

    // Limpiar campos
    setTitulo("");
    setDescripcion("");
  };

  // Eliminar reporte
  const eliminarReporte = (id) => {
    setReports(reports.filter((r) => r.id !== id));
  };

  // Cargar datos en el formulario para editar
  const editarReporte = (reporte) => {
    setTitulo(reporte.titulo);
    setDescripcion(reporte.descripcion);
    setEditandoId(reporte.id);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Gestión de Reportes</h2>

      {/* Formulario */}
      <div style={{ marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="Título del reporte"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          style={{ marginRight: "10px", width: "200px" }}
        />
        <input
          type="text"
          placeholder="Descripción"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          style={{ marginRight: "10px", width: "300px" }}
        />
        <button onClick={guardarReporte}>
          {editandoId === null ? "Agregar" : "Actualizar"}
        </button>
        {editandoId !== null && (
          <button
            onClick={() => {
              setEditandoId(null);
              setTitulo("");
              setDescripcion("");
            }}
            style={{ marginLeft: "10px" }}
          >
            Cancelar
          </button>
        )}
      </div>

      {/* Tabla de reportes */}
      <table border="1" cellPadding="5" style={{ width: "100%", textAlign: "left" }}>
        <thead>
          <tr>
            <th>Título</th>
            <th>Descripción</th>
            <th>Fecha</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {reports.length === 0 ? (
            <tr>
              <td colSpan="4" style={{ textAlign: "center" }}>
                No hay reportes registrados
              </td>
            </tr>
          ) : (
            reports.map((r) => (
              <tr key={r.id}>
                <td>{r.titulo}</td>
                <td>{r.descripcion}</td>
                <td>{r.fecha}</td>
                <td>
                  <button onClick={() => editarReporte(r)}>Editar</button>
                  <button
                    onClick={() => eliminarReporte(r.id)}
                    style={{ marginLeft: "10px" }}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
