import React, { useState } from "react";

export default function OtrosDocumentos() {
  const [documents, setDocuments] = useState([]);
  const [nombre, setNombre] = useState("");
  const [archivo, setArchivo] = useState(null);
  const [editandoId, setEditandoId] = useState(null);

  const guardarDocumento = () => {
    if (nombre.trim() === "" || !archivo) {
      alert("Por favor completa el nombre y selecciona un archivo.");
      return;
    }

    if (editandoId === null) {
      const nuevoDoc = {
        id: Date.now(),
        nombre,
        archivo: archivo.name,
        fecha: new Date().toLocaleDateString(),
      };
      setDocuments([...documents, nuevoDoc]);
    } else {
      const actualizados = documents.map((d) =>
        d.id === editandoId ? { ...d, nombre, archivo: archivo.name } : d
      );
      setDocuments(actualizados);
      setEditandoId(null);
    }

    setNombre("");
    setArchivo(null);
  };

  const eliminarDocumento = (id) => {
    setDocuments(documents.filter((d) => d.id !== id));
  };

  const editarDocumento = (doc) => {
    setNombre(doc.nombre);
    setArchivo({ name: doc.archivo });
    setEditandoId(doc.id);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Otros Documentos</h2>
      <p>Administra documentos generales como reglamentos, formatos y constancias.</p>

      {}
      <div style={{ marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="Nombre del documento"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          style={{ marginRight: "10px", width: "200px" }}
        />
        <input
          type="file"
          onChange={(e) => setArchivo(e.target.files[0])}
          style={{ marginRight: "10px" }}
        />
        <button onClick={guardarDocumento}>
          {editandoId === null ? "Agregar" : "Actualizar"}
        </button>
        {editandoId !== null && (
          <button
            onClick={() => {
              setEditandoId(null);
              setNombre("");
              setArchivo(null);
            }}
            style={{ marginLeft: "10px" }}
          >
            Cancelar
          </button>
        )}
      </div>

      {}
      <table border="1" cellPadding="5" style={{ width: "100%", textAlign: "left" }}>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Archivo</th>
            <th>Fecha</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {documents.length === 0 ? (
            <tr>
              <td colSpan="4" style={{ textAlign: "center" }}>
                No hay documentos registrados
              </td>
            </tr>
          ) : (
            documents.map((d) => (
              <tr key={d.id}>
                <td>{d.nombre}</td>
                <td>{d.archivo}</td>
                <td>{d.fecha}</td>
                <td>
                  <button onClick={() => editarDocumento(d)}>Editar</button>
                  <button
                    onClick={() => eliminarDocumento(d.id)}
                    style={{ marginLeft: "10px" }}
                  >
                    Eliminar
                  </button>
                  <button
                    style={{ marginLeft: "10px" }}
                    onClick={() => alert(`Descargando: ${d.archivo}`)}
                  >
                    Descargar
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
