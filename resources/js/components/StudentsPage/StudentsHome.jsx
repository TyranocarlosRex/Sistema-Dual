
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import ClassroomBoard from "../Shared/ClassroomBoard";

const safeJSON = (str, fallback = null) => {
  try {
    return str ? JSON.parse(str) : fallback;
  } catch {
    return fallback;
  }
};

const StudentsHome = () => {
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const user = safeJSON(localStorage.getItem("user"));
  const student = safeJSON(localStorage.getItem("student"));
  const displayName = `${student?.Nombre ?? ""} ${student?.Apellidos ?? ""}`.trim() || student?.name || user?.name || "Estudiante";
  const correo = user?.email || student?.Correo || student?.correo;

  const [evidences, setEvidences] = useState([]);
  const [loadingEvidences, setLoadingEvidences] = useState(true);

  if (!token) {
    return (
      <div className="p-6">
        No has iniciado sesion.
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
    return <div className="p-6">Cargando usuario...</div>;
  }

  if (!student) {
    return <div className="p-6">No se encontro informacion de estudiante.</div>;
  }

  useEffect(() => {
    const fetchEvidences = async () => {
      try {
        setLoadingEvidences(true);
        const res = await axios.get("/api/student/evidences", {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
          withCredentials: true,
        });
        setEvidences(res.data);
      } catch (err) {
        setEvidences([]);
      } finally {
        setLoadingEvidences(false);
      }
    };

    fetchEvidences();
  }, [token]);

  return (
    <div className="container-lg" style={{ maxWidth: "1100px" }}>
      <section
        className="rounded-4 text-white shadow-lg mb-3"
        style={{
          background: "linear-gradient(135deg, #22c55e 0%, #15803d 100%)",
          padding: "2rem",
        }}
      >
        <p className="text-uppercase small mb-1" style={{ letterSpacing: "0.08em", opacity: 0.8 }}>
          Panel estudiante
        </p>
        <h1 className="h4 mb-2">Hola, {displayName}</h1>
        <p className="mb-0" style={{ maxWidth: "520px", opacity: 0.95 }}>
          Gestiona tus reportes y sigue tu avance en el programa dual.
        </p>
      </section>

      <div className="mt-3" id="panel-general">
        <ClassroomBoard
          evidences={evidences}
          loadingEvidences={loadingEvidences}
          onOpenEvidence={(id) => navigate(`/student-report?evidence=${id}`)}
        />
      </div>
    </div>
  );
};

export default StudentsHome;
