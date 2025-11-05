import React, { useState } from "react";

export default function DocumentsManager(){
  const [docs, setDocs] = useState([
    { id: 1, alumno: "Ana López", nombre: "Carta de presentación", fecha_limite: "2025-10-05", estado: "pendiente", url: "#" },
    { id: 2, alumno: "—",        nombre: "Vigencia de seguro",    fecha_limite: "2025-10-12", estado: "pendiente", url: "#" },
  ]);
  const [nombre, setNombre] = useState("");
  const [fecha, setFecha] = useState("");

  const agregar = (e)=>{
    e.preventDefault();
    if (!nombre || !fecha) return alert("Completa nombre y fecha"); // why: validación básica clara
    const id = Math.max(0, ...docs.map(d=>d.id)) + 1;
    setDocs([...docs, { id, alumno:"—", nombre, fecha_limite: fecha, estado:"pendiente", url:"#"}]);
    setNombre(""); setFecha("");
  };
  const eliminar = (id)=> setDocs(docs.filter(d=>d.id!==id));

  return (
    <div className="container">
      <h2 className="mb-3">Gestión de documentos</h2>

      <form className="card p-3 mb-3" onSubmit={agregar}>
        <div className="row g-2">
          <div className="col"><input className="form-control" placeholder="Nombre del documento" value={nombre} onChange={e=>setNombre(e.target.value)} /></div>
          <div className="col"><input className="form-control" type="date" value={fecha} onChange={e=>setFecha(e.target.value)} /></div>
          <div className="col-auto"><button className="btn btn-primary">Agregar</button></div>
        </div>
      </form>

      <table className="table table-sm">
        <thead><tr><th>Alumno</th><th>Documento</th><th>Fecha límite</th><th>Estado</th><th>Opciones</th></tr></thead>
        <tbody>
          {docs.map(d=>(
            <tr key={d.id}>
              <td>{d.alumno}</td>
              <td>{d.nombre}</td>
              <td>{d.fecha_limite}</td>
              <td>
                <span className={
                  d.estado==='aprobado' ? 'badge bg-success' :
                  d.estado==='rechazado' ? 'badge bg-danger' : 'badge bg-warning text-dark'
                }>{d.estado}</span>
              </td>
              <td className="d-flex gap-2">
                <a className="btn btn-outline-secondary btn-sm" href={d.url}>Ver</a>
                <button className="btn btn-outline-danger btn-sm" onClick={()=>eliminar(d.id)}>Eliminar</button>
              </td>
            </tr>
          ))}
          {docs.length===0 && <tr><td colSpan={5}>Sin documentos</td></tr>}
        </tbody>
      </table>
    </div>
  );
}