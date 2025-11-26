import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const safeJSON = (str, fallback = null) => {
  try {
    return str ? JSON.parse(str) : fallback;
  } catch {
    return fallback;
  }
};

// Helper para mostrar el tipo bonito
const LABEL_TIPO = {
  inscripcion: "Inscripción",
  programa: "Programa (reportes del programa)",
};

const StudentsHome = () => {
  const navigate = useNavigate();

  // Lee del storage en cada render
  const token = localStorage.getItem("token");
  const user = safeJSON(localStorage.getItem("user"));
  const student = safeJSON(localStorage.getItem("student"));

  // Estado para evidencias
  const [evidences, setEvidences] = useState([]);
  const [loadingEvidences, setLoadingEvidences] = useState(true);
  const [evidencesError, setEvidencesError] = useState("");

  // Guards
  if (!token) {
    return (
      <div className="p-6">
        No has iniciado sesión.
        <div className="mt-3">
          <button
            className="px-3 py-2 border rounded"
            onClick={() => navigate("/login-student")}
          >
            Ir al login
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return <div className="p-6">Cargando usuario…</div>;
  }

  if (!student) {
    return <div className="p-6">No se encontró información de estudiante.</div>;
  }

  // Cargar evidences del backend
  useEffect(() => {
  const fetchEvidences = async () => {
    try {
      setLoadingEvidences(true);
      setEvidencesError("");
      const res = await axios.get("/api/student/evidences", {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        withCredentials: true,
      });
      console.log("STUDENT HOME EVIDENCES:", res.data); // 👈
      setEvidences(res.data);
    } catch (err) {
      // ...
    } finally {
      setLoadingEvidences(false);
    }
  };

  fetchEvidences();
}, [token]);

  // Helper para obtener fecha del próximo reporte (por fecha_limite)
  const getProximoReporte = (reports) => {
    if (!reports || reports.length === 0) return "-";

    const conFecha = reports.filter((r) => r.fecha_limite);
    if (conFecha.length === 0) return "-";

    const sorted = [...conFecha].sort(
      (a, b) => new Date(a.fecha_limite) - new Date(b.fecha_limite)
    );

    const primero = sorted[0];
    return `${primero.fecha_limite} (${primero.titulo})`;
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-4">
      <h1 className="text-3xl">
        Bienvenido, {(student?.Nombre ?? "")} {(student?.Apellidos ?? "")}
      </h1>
      <hr />

      {/* Datos básicos del alumno */}
      <div className="grid md:grid-cols-3 gap-4">
        <div>
          <label className="block mb-1 text-sm font-semibold">
            No. de Control
          </label>
          <input
            type="text"
            readOnly
            value={student?.No_control ?? ""}
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block mb-1 text-sm font-semibold">
            Carrera
          </label>
          <input
            type="text"
            readOnly
            value={student?.carrera ?? ""}
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block mb-1 text-sm font-semibold">
            Estatus
          </label>
          <input
            type="text"
            readOnly
            value={student?.estatus ?? ""}
            className="w-full p-2 border rounded"
          />
        </div>
      </div>

      <hr />
      <h2 className="text-2xl">Datos Adicionales</h2>

      <div className="grid md:grid-cols-3 gap-4">
        <div>
          <label className="block mb-1 text-sm font-semibold">
            Dirección
          </label>
          <input
            type="text"
            readOnly
            value={student?.Direccion ?? ""}
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block mb-1 text-sm font-semibold">
            Teléfono
          </label>
          <input
            type="text"
            readOnly
            value={student?.Telefono ?? ""}
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block mb-1 text-sm font-semibold">
            Correo Institucional
          </label>
          <input
            type="text"
            readOnly
            value={student?.Correo_institucional ?? ""}
            className="w-full p-2 border rounded"
          />
        </div>
      </div>

      <hr />

      {/* SECCIÓN: cuadros por cada evidencia */}
      <h2 className="text-2xl mb-2">Evidencias del programa</h2>

      {loadingEvidences && (
        <p className="text-sm text-gray-500">Cargando evidencias…</p>
      )}

      {evidencesError && !loadingEvidences && (
        <p className="text-sm text-red-600">{evidencesError}</p>
      )}

      {!loadingEvidences && !evidencesError && evidences.length === 0 && (
        <p className="text-sm text-gray-500">
          Por el momento no hay evidencias configuradas.
        </p>
      )}

      {/* Un cuadro (card) por cada evidence */}
      <div className="space-y-4">
        {evidences.map((ev) => {
          const totalReports = ev.reports ? ev.reports.length : 0;
          const proximo = getProximoReporte(ev.reports || []);

          return (
            <div key={ev.id} className="border rounded shadow-sm">
              {/* Header gris, con título de la evidencia */}
              <div className="px-4 py-3 border-b bg-gray-100 flex justify-between items-center">
                <h3 className="text-xl font-semibold">{ev.titulo}</h3>
                <span className="text-xs px-2 py-1 rounded bg-blue-600 text-white">
                  {LABEL_TIPO[ev.tipo] || ev.tipo}
                </span>
              </div>

              {/* Body con descripción, conteos, próximo reporte, etc */}
              <div className="px-4 py-3">
                {ev.descripcion && (
                  <p className="mb-2">
                    <span className="font-semibold">Descripción: </span>
                    {ev.descripcion}
                  </p>
                )}

                <p className="mb-1">
                  <span className="font-semibold">Total de reportes: </span>
                  {totalReports}
                </p>

                <p className="mb-1">
                  <span className="font-semibold">Próximo reporte: </span>
                  {proximo}
                </p>

                {/* puedes mostrar un preview de los primeros reportes */}
                {totalReports > 0 && (
                  <div className="mt-2">
                    <p className="font-semibold text-sm mb-1">
                      Reportes en este espacio:
                    </p>
                    <ul className="list-disc list-inside text-sm text-gray-700">
                      {ev.reports.slice(0, 3).map((rep) => (
                        <li key={rep.id}>
                          {rep.titulo}
                          {rep.fecha_limite && (
                            <span className="text-xs text-gray-500">
                              {" "}
                              · límite: {rep.fecha_limite}
                            </span>
                          )}
                        </li>
                      ))}
                      {totalReports > 3 && (
                        <li className="text-xs text-gray-500">
                          … y {totalReports - 3} más
                        </li>
                      )}
                    </ul>
                  </div>
                )}

                {/* botón Ver más que manda a otra página */}
                <div className="flex justify-end mt-3">
                  <button
                    type="button"
                    className="px-4 py-2 rounded text-white bg-teal-600 hover:bg-teal-700 text-sm flex items-center gap-2"
                    onClick={() =>
                      navigate(`/student-report?evidence=${ev.id}`)
                    }
                  >
                    {/* si usas bootstrap icons puedes poner el iconito */}
                    {/* <span className="bi bi-eye" /> */}
                    Ver más
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StudentsHome;