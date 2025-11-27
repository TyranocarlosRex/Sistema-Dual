import React, { useEffect, useState } from "react";
import axios from "axios";
import AdministratorReports from "./Reports/AdministratorReports";

const API_URL = "http://localhost:8000/api";

const TIPO_OPCIONES = [
  { value: "inscripcion", label: "Inscripción" },
  { value: "programa", label: "Programa (reportes del programa)" },
];

export default function AdminEvidences() {
  const [evidences, setEvidences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showReportsModal, setShowReportsModal] = useState(false);

  // formulario para crear evidence
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [tipo, setTipo] = useState("inscripcion");
  const [descripcion, setDescripcion] = useState("");

  // editar evidence
  const [editingId, setEditingId] = useState(null);
  const [editTitulo, setEditTitulo] = useState("");
  const [editTipo, setEditTipo] = useState("inscripcion");
  const [editDescripcion, setEditDescripcion] = useState("");
  const [editError, setEditError] = useState("");

  // estado para saber en qué espacio se abre el modal
  const [activeEvidenceId, setActiveEvidenceId] = useState(null);
  const [repTitulo, setRepTitulo] = useState("");
  const [repDescripcion, setRepDescripcion] = useState("");
  const [repFechaLimite, setRepFechaLimite] = useState("");
  const [repAttachment, setRepAttachment] = useState(null);
  const [reportError, setReportError] = useState("");

  const token = localStorage.getItem("token");

  const axiosAuth = axios.create({
    baseURL: API_URL,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    withCredentials: true,
  });

  const cargarEvidences = async () => {
  try {
    setLoading(true);
    const res = await axiosAuth.get("/evidences?with_reports=1");
    console.log("EVIDENCES:", res.data); // 👈 mira si vienen reports
    setEvidences(res.data);
  } catch (err) {
    console.error("Error al cargar evidences:", err);
    setError("Error al cargar los espacios (evidences).");
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    cargarEvidences();
  }, []);

  const handleCrearEvidence = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await axiosAuth.post("/evidences", {
        titulo,
        tipo,
        descripcion,
      });

      setTitulo("");
      setDescripcion("");
      setTipo("inscripcion");
      setShowCreateForm(false);

      await cargarEvidences();
    } catch (err) {
      console.error(err);
      setError("No se pudo crear el espacio.");
    }
  };

  const empezarEdicion = (ev) => {
    setEditingId(ev.id);
    setEditTitulo(ev.titulo || "");
    setEditTipo(ev.tipo || "inscripcion");
    setEditDescripcion(ev.descripcion || "");
    setEditError("");
  };

  const cancelarEdicion = () => {
    setEditingId(null);
    setEditTitulo("");
    setEditTipo("inscripcion");
    setEditDescripcion("");
    setEditError("");
  };

  const handleActualizarEvidence = async (e) => {
    e.preventDefault();
    if (!editingId) return;
    setEditError("");

    try {
      await axiosAuth.put(`/evidences/${editingId}`, {
        titulo: editTitulo,
        tipo: editTipo,
        descripcion: editDescripcion,
      });

      cancelarEdicion();
      await cargarEvidences();
    } catch (err) {
      console.error(err);
      setEditError("No se pudo actualizar el espacio.");
    }
  };

  const abrirFormReporte = (evidenceId) => {
    setActiveEvidenceId(evidenceId);
    setShowReportsModal(true);
  };

  const handleCrearReporte = async (e) => {
    e.preventDefault();
    setReportError("");

    if (!activeEvidenceId) {
      setReportError("Selecciona un espacio válido.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("evidence_id", activeEvidenceId);
      formData.append("titulo", repTitulo);
      formData.append("descripcion", repDescripcion);
      if (repFechaLimite) formData.append("fecha_limite", repFechaLimite);
      if (repAttachment) formData.append("attachment", repAttachment);

      await axiosAuth.post("/reports", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setActiveEvidenceId(null);
      setRepTitulo("");
      setRepDescripcion("");
      setRepFechaLimite("");
      setRepAttachment(null);

      await cargarEvidences();
    } catch (err) {
      console.error(err);
      setReportError("No se pudo crear el reporte.");
    }
  };

  const activeEvidence = evidences.find((ev) => ev.id === activeEvidenceId);

  return (
    <div className="p-6 space-y-6">
      {/* Header con título + botón azul */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          Evidencias
        </h1>

        <button
          type="button"
          onClick={() => setShowCreateForm((prev) => !prev)}
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
        >
          {showCreateForm ? "Cerrar" : "Nuevo espacio"}
        </button>
      </div>

      {/* Formulario crear espacio (toggle) */}
      {showCreateForm && (
        <form
          onSubmit={handleCrearEvidence}
          className="bg-white shadow rounded-lg p-4 space-y-4"
        >
          <h2 className="text-lg font-semibold">Crear nuevo espacio</h2>

          {error && (
            <div className="text-red-600 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">
              Título del espacio
            </label>
            <input
              type="text"
              className="border rounded w-full px-2 py-1"
              placeholder="Ej. Inscripción, Reportes bimestrales..."
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Tipo
            </label>
            <select
              className="border rounded w-full px-2 py-1"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
            >
              {TIPO_OPCIONES.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Descripción
            </label>
            <textarea
              className="border rounded w-full px-2 py-1"
              rows={3}
              placeholder="Describe qué documentos irán en este espacio..."
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
            >
              Guardar espacio
            </button>
            <button
              type="button"
              className="border px-4 py-2 rounded text-sm"
              onClick={() => setShowCreateForm(false)}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Body: solo los espacios creados */}
      <div className="bg-white shadow rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-3">
          Espacios existentes
        </h2>

        {loading ? (
          <div>Cargando...</div>
        ) : evidences.length === 0 ? (
          <div className="text-sm text-gray-500">
            Aún no hay espacios creados.
          </div>
        ) : (
          <div className="space-y-4">
            {evidences.map((ev) => (
              <div key={ev.id} className="border rounded p-3">
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <div className="font-semibold">
                      {ev.titulo}
                    </div>
                    <div className="text-xs text-gray-500">
                      Tipo: {ev.tipo} — ID: {ev.id}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => empezarEdicion(ev)}
                      className="text-xs border px-3 py-1 rounded hover:bg-gray-100"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => abrirFormReporte(ev.id)}
                      className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                    >
                      Agregar reporte
                    </button>
                  </div>
                </div>

                {ev.descripcion && (
                  <p className="text-sm text-gray-700 mb-2">
                    {ev.descripcion}
                  </p>
                )}

                {editingId === ev.id && (
                  <form
                    onSubmit={handleActualizarEvidence}
                    className="mt-3 border-t pt-3 space-y-2 bg-gray-50 p-3 rounded"
                  >
                    <h3 className="text-sm font-semibold">
                      Editar espacio
                    </h3>

                    {editError && (
                      <div className="text-red-600 text-xs mb-1">
                        {editError}
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-medium mb-1">
                        Título
                      </label>
                      <input
                        type="text"
                        className="border rounded w-full px-2 py-1 text-sm"
                        value={editTitulo}
                        onChange={(e) => setEditTitulo(e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium mb-1">
                        Tipo
                      </label>
                      <select
                        className="border rounded w-full px-2 py-1 text-sm"
                        value={editTipo}
                        onChange={(e) => setEditTipo(e.target.value)}
                      >
                        {TIPO_OPCIONES.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium mb-1">
                        Descripción
                      </label>
                      <textarea
                        className="border rounded w-full px-2 py-1 text-sm"
                        rows={2}
                        value={editDescripcion}
                        onChange={(e) => setEditDescripcion(e.target.value)}
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700"
                      >
                        Guardar cambios
                      </button>
                      <button
                        type="button"
                        className="border px-3 py-1 rounded text-xs"
                        onClick={cancelarEdicion}
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                )}

                {/* Lista de reportes */}
                <div className="mt-2">
                  <div className="text-sm font-medium">
                    Reportes en este espacio:
                  </div>
                  {ev.reports && ev.reports.length > 0 ? (
                    <ul className="list-disc list-inside text-sm">
                      {ev.reports.map((rep) => (
                        <li key={rep.id}>
                          {rep.titulo}{" "}
                          {rep.fecha_limite && (
                            <span className="text-xs text-gray-500">
                              (límite: {rep.fecha_limite})
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-xs text-gray-500">
                      Aún no hay reportes en este espacio.
                    </div>
                  )}
                </div>

                {/* Formulario crear reporte para este evidence */}
                {false && activeEvidenceId === ev.id && (
                  <form
                    onSubmit={handleCrearReporte}
                    className="mt-3 border-t pt-3 space-y-2"
                  >
                    <h3 className="text-sm font-semibold">
                      Nuevo reporte en: {ev.titulo}
                    </h3>

                    {reportError && (
                      <div className="text-red-600 text-xs mb-1">
                        {reportError}
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-medium mb-1">
                        Título del reporte
                      </label>
                      <input
                        type="text"
                        className="border rounded w-full px-2 py-1 text-sm"
                        value={repTitulo}
                        onChange={(e) => setRepTitulo(e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium mb-1">
                        Descripción
                      </label>
                      <textarea
                        className="border rounded w-full px-2 py-1 text-sm"
                        rows={2}
                        value={repDescripcion}
                        onChange={(e) => setRepDescripcion(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium mb-1">
                        Fecha límite
                      </label>
                      <input
                        type="date"
                        className="border rounded px-2 py-1 text-sm"
                        value={repFechaLimite}
                        onChange={(e) => setRepFechaLimite(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium mb-1">
                        Archivo base (formato, guía, etc.) opcional
                      </label>
                      <input
                        type="file"
                        className="text-xs"
                        onChange={(e) =>
                          setRepAttachment(e.target.files[0] || null)
                        }
                      />
                    </div>

                    <div className="flex gap-2 mt-2">
                      <button
                        type="submit"
                        className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700"
                      >
                        Guardar reporte
                      </button>
                      <button
                        type="button"
                        className="border px-3 py-1 rounded text-xs"
                        onClick={() => setActiveEvidenceId(null)}
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showReportsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded shadow-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-lg font-semibold">Agregar reporte</h3>
                {activeEvidence && (
                  <p className="text-sm text-gray-500">
                    Para el espacio: {activeEvidence.titulo} (ID {activeEvidence.id})
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowReportsModal(false);
                  setActiveEvidenceId(null);
                }}
                className="text-gray-500 hover:text-gray-700 text-xl leading-none"
              >
                ×
              </button>
            </div>

            <AdministratorReports
              embedded
              onClose={() => {
                setShowReportsModal(false);
                setActiveEvidenceId(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
