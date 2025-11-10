import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function RevisionEstudiante() {
  const navigate = useNavigate();

  const [students, setStudents] = useState([
    { id: 1, nombre: "Juan Pérez", estado: "pendiente" },
    { id: 2, nombre: "Ana López", estado: "pendiente" },
    { id: 3, nombre: "Carlos Ruiz", estado: "aprobado" },
    { id: 4, nombre: "Luis Torres", estado: "rechazado" },
  ]);

  const pendientes = students.filter(s => s.estado === "pendiente");
  const aprobados = students.filter(s => s.estado === "aprobado");
  const rechazados = students.filter(s => s.estado === "rechazado");

  const handleView = (id) => {
    navigate(`/coordinator-documents/revision/${id}`);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Revisión de Documentos - Estudiantes</h2>

      <div style={{ display: "flex", gap: "30px", marginTop: "20px", flexWrap: "wrap" }}>
        
        {}
        <div style={{ flex: "1", minWidth: "300px" }}>
          <h3>Pendientes por Revisar</h3>
          {pendientes.length === 0 ? (
            <p>No hay estudiantes pendientes.</p>
          ) : (
            pendientes.map(s => (
              <div
                key={s.id}
                style={{
                  border: "1px solid #ccc",
                  borderRadius: "8px",
                  padding: "10px",
                  marginBottom: "10px",
                  background: "#fff8e1",
                }}
              >
                <p><strong>{s.nombre}</strong></p>
                <button
                  onClick={() => handleView(s.id)}
                  style={{ backgroundColor: "#007bff", color: "white", padding: "5px 10px" }}
                >
                  Ver más
                </button>
              </div>
            ))
          )}
        </div>

        {}
        <div style={{ flex: "1", minWidth: "300px" }}>
          <h3>Revisados</h3>
          {aprobados.length === 0 ? (
            <p>No hay estudiantes revisados.</p>
          ) : (
            aprobados.map(s => (
              <div
                key={s.id}
                style={{
                  border: "1px solid #ccc",
                  borderRadius: "8px",
                  padding: "10px",
                  marginBottom: "10px",
                  background: "#e8f5e9",
                }}
              >
                <p><strong>{s.nombre}</strong></p>
                <button
                  onClick={() => handleView(s.id)}
                  style={{ backgroundColor: "#007bff", color: "white", padding: "5px 10px" }}
                >
                  Ver más
                </button>
              </div>
            ))
          )}
        </div>

        {}
        <div style={{ flex: "1", minWidth: "300px" }}>
          <h3>Rechazados</h3>
          {rechazados.length === 0 ? (
            <p>No hay estudiantes rechazados.</p>
          ) : (
            rechazados.map(s => (
              <div
                key={s.id}
                style={{
                  border: "1px solid #ccc",
                  borderRadius: "8px",
                  padding: "10px",
                  marginBottom: "10px",
                  background: "#ffebee",
                }}
              >
                <p><strong>{s.nombre}</strong></p>
                <button
                  onClick={() => handleView(s.id)}
                  style={{ backgroundColor: "#007bff", color: "white", padding: "5px 10px" }}
                >
                  Ver más
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
