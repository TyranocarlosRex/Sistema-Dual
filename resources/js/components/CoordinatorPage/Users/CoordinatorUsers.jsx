import React, { useState } from "react";

export default function CoordinatorUsers() {
  const [users, setUsers] = useState([]);

  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [rol, setRol] = useState("student");
  const [editandoId, setEditandoId] = useState(null);

  const agregarUsuario = () => {
    if (nombre.trim() === "" || correo.trim() === "" || rol.trim() === "") {
      alert("Completa todos los campos");
      return;
    }

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
