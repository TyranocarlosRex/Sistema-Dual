import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const INICIALES = [
  { id: 1, nombre: "Ana López",  no_control: "A001", carrera: "Sistemas",  periodo: 1, documentos: ["Carta de presentación"] },
  { id: 2, nombre: "Bruno Pérez",no_control: "A002", carrera: "Industrial", periodo: 2, documentos: ["Carta de presentación","Vigencia de seguro"] },
  { id: 3, nombre: "Carla Ruiz", no_control: "A003", carrera: "Sistemas",  periodo: 1, documentos: [] },
];

const DOCUMENTOS = [
  "Carta de presentación",
  "Vigencia de seguro",
  "Formato PED",
  "Rúbrica PED",
  "Instrumento de competencias",
  "Acta de acreditación",
];

export default function StudentsList(){
  const [students, setStudents] = useState(INICIALES);
  const [search, setSearch] = useState("");
  const [orden, setOrden] = useState("AZ");
  const [filtroDocumento, setFiltroDocumento] = useState("");
  const navigate = useNavigate();

  const lista = useMemo(() => {
    let s = [...students];

    if (search.trim()) {
      const q = search.toLowerCase();
      s = s.filter(item =>
        [item.nombre, item.no_control, item.carrera]
          .join(" ")
          .toLowerCase()
          .includes(q)
      );
    }

    if (filtroDocumento) {
      s = s.filter(item => item.documentos.includes(filtroDocumento));
    }

    switch (orden) {
      case "AZ":
        s.sort((a, b) => a.nombre.localeCompare(b.nombre));
        break;
      case "CARRERA":
        s.sort((a, b) => a.carrera.localeCompare(b.carrera));
        break;
      case "P1":
        s.sort((a, b) => a.periodo - b.periodo);
        break;
      case "P2":
        s.sort((a, b) => b.periodo - a.periodo);
        break;
      default:
        break;
    }
    return s;
  }, [students, search, orden, filtroDocumento]);

  const actualizarEstado = (id, estado) => {
    setStudents(prev => prev.map(s => (
      s.id === id ? { ...s, estado } : s
    )));
  };

  const autorizar = (id) => actualizarEstado(id, "Autorizado");
  const rechazar = (id) => actualizarEstado(id, "Rechazado");
  const baja = (id) => setStudents(prev => prev.filter(s => s.id !== id));
  const alta2 = (id) => setStudents(prev => prev.map(s => (
    s.id === id ? { ...s, periodo: 2 } : s
  )));

  return (
    <div className="container">
      <h2 className="mb-3">Estudiantes</h2>
      <div className="d-flex gap-2 mb-3">
        <input
          className="form-control"
          style={{ maxWidth: 280 }}
          placeholder="Buscar..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          className="form-select"
          style={{ maxWidth: 180 }}
          value={orden}
          onChange={e => setOrden(e.target.value)}
        >
          <option value="AZ">A - Z</option>
          <option value="CARRERA">Carrera</option>
          <option value="P1">Periodo 1 → 2</option>
          <option value="P2">Periodo 2 → 1</option>
        </select>
      </div>

      <div className="d-flex gap-2 mb-3">
        <select
          className="form-select"
          style={{ maxWidth: 220 }}
          value={filtroDocumento}
          onChange={e => setFiltroDocumento(e.target.value)}
        >
          <option value="">Todos los documentos</option>
          {DOCUMENTOS.map(nombre => (
            <option key={nombre} value={nombre}>{nombre}</option>
          ))}
        </select>
        <button
          className="btn btn-outline-secondary"
          type="button"
          onClick={() => setFiltroDocumento("")}
        >
          Limpiar filtro
        </button>
      </div>

      <div className="table-responsive">
        <table className="table table-sm align-middle">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>No. Control</th>
              <th>Carrera</th>
              <th>Periodo</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {lista.map(s => (
              <tr key={s.id}>
                <td>{s.nombre}</td>
                <td>{s.no_control}</td>
                <td>{s.carrera}</td>
                <td>{s.periodo}</td>
                <td>{s.estado || <span className="text-muted">N/A</span>}</td>
                <td className="d-flex flex-wrap gap-2">
                  <button className="btn btn-success btn-sm" onClick={() => autorizar(s.id)}>Autorizar</button>
                  <button className="btn btn-danger btn-sm" onClick={() => rechazar(s.id)}>Rechazar</button>
                  <button className="btn btn-outline-warning btn-sm" onClick={() => navigate(`/coordinator-documents/revision/${s.id}`)}>Revisar docs</button>
                  <button className="btn btn-outline-secondary btn-sm" onClick={() => baja(s.id)}>Baja</button>
                  <button className="btn btn-primary btn-sm" onClick={() => alta2(s.id)}>Alta 2º periodo</button>
                </td>
              </tr>
            ))}
            {lista.length === 0 && (
              <tr>
                <td colSpan={6}>Sin resultados</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}