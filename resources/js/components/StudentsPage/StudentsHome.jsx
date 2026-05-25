
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import ClassroomBoard from "../Shared/ClassroomBoard";
import { useToast } from "../Shared/ToastProvider";
import { APP_ROUTES } from "../../routes";
import { getApiErrorMessage } from "../../utils/errorMessages";

const safeJSON = (str, fallback = null) => {
  try {
    return str ? JSON.parse(str) : fallback;
  } catch {
    return fallback;
  }
};

const normalizeValue = (value) => String(value ?? "").trim();

const StudentsHome = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [token] = useState(() => localStorage.getItem("token"));
  const [user] = useState(() => safeJSON(localStorage.getItem("user")));
  const [student] = useState(() => safeJSON(localStorage.getItem("student")));

  const [evidences, setEvidences] = useState([]);
  const [loadingEvidences, setLoadingEvidences] = useState(true);
  const [evidencesError, setEvidencesError] = useState("");
  const [profile, setProfile] = useState(student);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [contactForm, setContactForm] = useState({
    Telefono: student?.Telefono ?? "",
    Direccion: student?.Direccion ?? "",
  });

  const activeStudent = profile || student;
  const displayName =
    `${activeStudent?.Nombre ?? ""} ${activeStudent?.Apellidos ?? ""}`.trim() ||
    activeStudent?.name ||
    user?.name ||
    "Estudiante";
  const correo =
    activeStudent?.Correo_institucional ||
    user?.email ||
    activeStudent?.Correo ||
    activeStudent?.correo;
  const noControl = activeStudent?.No_control || activeStudent?.no_control || "-";
  const carrera = activeStudent?.Carrera || activeStudent?.career || "-";
  const semestre = activeStudent?.Semestre ?? activeStudent?.semester ?? "-";
  const phoneMissing = !normalizeValue(contactForm.Telefono);
  const addressMissing = !normalizeValue(contactForm.Direccion);
  const contactDirty =
    normalizeValue(contactForm.Telefono) !== normalizeValue(activeStudent?.Telefono) ||
    normalizeValue(contactForm.Direccion) !== normalizeValue(activeStudent?.Direccion);

  const syncStoredStudent = (nextStudent) => {
    if (!nextStudent) {
      return;
    }

    const currentStoredStudent = safeJSON(localStorage.getItem("student"), {});
    localStorage.setItem(
      "student",
      JSON.stringify({
        ...(currentStoredStudent || {}),
        ...nextStudent,
      })
    );
  };

  useEffect(() => {
    if (!token || !user || !student) {
      setProfileLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        setProfileLoading(true);
        setProfileError("");

        const { data } = await axios.get("/api/student/me", {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
          withCredentials: true,
        });

        const nextStudent = data.student || null;
        setProfile(nextStudent);
        setContactForm({
          Telefono: nextStudent?.Telefono ?? "",
          Direccion: nextStudent?.Direccion ?? "",
        });
        syncStoredStudent(nextStudent);
      } catch (err) {
        setProfileError(
          getApiErrorMessage(err, "No pudimos cargar tu perfil. Puedes intentar actualizar la pagina.")
        );
      } finally {
        setProfileLoading(false);
      }
    };

    fetchProfile();
  }, [student, token, user]);

  useEffect(() => {
    if (!token || !user || !student) {
      setLoadingEvidences(false);
      return;
    }

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
        setEvidences(res.data);
      } catch (err) {
        setEvidences([]);
        setEvidencesError(
          getApiErrorMessage(err, "No pudimos cargar tus evidencias del periodo activo.")
        );
      } finally {
        setLoadingEvidences(false);
      }
    };

    fetchEvidences();
  }, [student, token, user]);

  const handleContactFieldChange = (field) => (event) => {
    const { value } = event.target;
    setContactForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveContact = async () => {
    try {
      setProfileSaving(true);
      setProfileError("");

      const { data } = await axios.patch(
        "/api/student/me",
        {
          telefono: contactForm.Telefono,
          direccion: contactForm.Direccion,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
          withCredentials: true,
        }
      );

      const nextStudent = data.student || null;
      setProfile(nextStudent);
      setContactForm({
        Telefono: nextStudent?.Telefono ?? "",
        Direccion: nextStudent?.Direccion ?? "",
      });
      syncStoredStudent(nextStudent);
      showToast({
        title: "Perfil actualizado",
        message: "Tu telefono y direccion ya quedaron guardados.",
        variant: "success",
      });
    } catch (err) {
      const message = getApiErrorMessage(err, "No pudimos guardar tus datos de contacto. Revisa la informacion e intenta de nuevo.");
      setProfileError(message);
      showToast({
        title: "No se pudo guardar",
        message,
        variant: "error",
      });
    } finally {
      setProfileSaving(false);
    }
  };

  if (!token) {
    return (
      <div className="p-6">
        No has iniciado sesion.
        <div className="mt-3">
          <button
            className="px-3 py-2 border rounded"
            onClick={() => navigate(APP_ROUTES.auth.studentLogin)}
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

      <section className="card border-0 shadow-sm mb-4">
        <div className="card-body p-4">
          <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap mb-3">
            <div>
              <h2 className="h5 mb-1">Datos de contacto</h2>
              <p className="text-muted mb-0">
                Completa tu telefono y direccion para mantener tu perfil actualizado y usarlos en documentos generados.
              </p>
            </div>
            {(phoneMissing || addressMissing) && (
              <span className="badge text-bg-warning">Completar perfil</span>
            )}
          </div>

          {profileError && (
            <div className="alert alert-warning py-2 mb-3">
              {profileError}
            </div>
          )}

          <div className="row g-3">
            <div className="col-12 col-md-4">
              <div className="border rounded-3 p-3 h-100 bg-light">
                <div className="text-muted small">No. de control</div>
                <div className="fw-semibold">{noControl}</div>
              </div>
            </div>
            <div className="col-12 col-md-4">
              <div className="border rounded-3 p-3 h-100 bg-light">
                <div className="text-muted small">Correo institucional</div>
                <div className="fw-semibold">{correo || "No registrado"}</div>
              </div>
            </div>
            <div className="col-12 col-md-4">
              <div className="border rounded-3 p-3 h-100 bg-light">
                <div className="text-muted small">Carrera y semestre</div>
                <div className="fw-semibold">
                  {carrera}
                  {semestre !== "-" ? ` - Semestre ${semestre}` : ""}
                </div>
              </div>
            </div>

            <div className="col-12 col-md-4">
              <label className="form-label fw-semibold">Telefono</label>
              <input
                type="text"
                className="form-control"
                value={contactForm.Telefono}
                onChange={handleContactFieldChange("Telefono")}
                placeholder="Ej. 6141234567"
                maxLength={20}
                disabled={profileLoading || profileSaving}
              />
              <div className="form-text">Puedes capturar solo los numeros o un formato corto.</div>
            </div>

            <div className="col-12 col-md-8">
              <label className="form-label fw-semibold">Direccion</label>
              <textarea
                className="form-control"
                rows={3}
                value={contactForm.Direccion}
                onChange={handleContactFieldChange("Direccion")}
                placeholder="Calle, numero, colonia, ciudad y referencias si hacen falta"
                maxLength={255}
                disabled={profileLoading || profileSaving}
              />
            </div>
          </div>

          <div className="d-flex justify-content-end align-items-center gap-2 flex-wrap mt-3">
            {profileLoading && <span className="text-muted small">Cargando perfil...</span>}
            <button
              type="button"
              className="btn btn-success"
              onClick={handleSaveContact}
              disabled={profileLoading || profileSaving || !contactDirty}
            >
              {profileSaving ? "Guardando..." : "Guardar datos"}
            </button>
          </div>
        </div>
      </section>

      <div className="mt-3" id="panel-general">
        {!loadingEvidences && !evidencesError && evidences.length === 0 && (
          <div className="alert alert-warning">
            No hay evidencias visibles para tu periodo actual. Revisa que exista un periodo activo y al menos una
            evidencia de inscripcion con reportes configurados.
          </div>
        )}

        <ClassroomBoard
          evidences={evidences}
          loadingEvidences={loadingEvidences}
          evidencesError={evidencesError}
          onOpenEvidence={(id) => navigate(`${APP_ROUTES.student.evidences}?evidencia=${id}`)}
        />
      </div>
    </div>
  );
};

export default StudentsHome;
