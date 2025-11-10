import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function DetalleRevisionEstudiante() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [student, setStudent] = useState({
    nombre: "",
    documentos: []
  });

  useEffect(() => {
    const dummyStudent = {
      nombre: "Juan Pérez",
      documentos: [
        { id: 1, nombre: "Carta de presentación", estado: "pendiente" },
        { id: 2, nombre: "Formato PED", estado: "pendiente" },
        { id: 3, nombre: "Rúbrica PED", estado: "pendiente" },
        { id: 4, nombre: "Instrumento de competencias", estado: "pendiente" },
      ]
    };
    setStudent(dummyStudent);
  }, [id]);

  const actualizarEstado = (docId, nuevoEstado) => {
    setStudent(prev => ({
      ...prev,
      documentos: prev.documentos.map(doc =>
        doc.id === docId ? { ...doc, estado: nuevoEstado } : doc
      )
    }));
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Revisión de Documentos de {student.nombre}</h2>
      <button
        onClick={() => navigate(-1)}
        style={{ marginBottom: "20px", backgroundColor: "#ccc", padding: "5px 10px" }}
      >
        Volver
      </button>

      <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
        {student.documentos.map(doc => (
          <div
            key={doc.id}
            style={{
              border: "1px solid #ccc",
              borderRadius: "8px",
              padding: "15px",
              width: "220px",
              background:
                doc.estado === "aprobado" ? "#e8f5e9" :
                doc.estado === "rechazado" ? "#ffebee" : "#fff8e1",
            }}
          >
            <h4>{doc.nombre}</h4>
            <p>Estado: <strong>{doc.estado}</strong></p>
            <button
              onClick={() => actualizarEstado(doc.id, "aprobado")}
              style={{ backgroundColor: "green", color: "white", marginRight: "5px" }}
            >
              Aprobar
            </button>
            <button
              onClick={() => actualizarEstado(doc.id, "rechazado")}
              style={{ backgroundColor: "red", color: "white" }}
            >
              Rechazar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
