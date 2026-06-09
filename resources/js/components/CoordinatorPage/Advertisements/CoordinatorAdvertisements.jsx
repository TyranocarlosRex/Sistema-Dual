import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { getApiErrorMessage } from "../../../utils/errorMessages";

const HERO_STYLE = {
  background: "linear-gradient(135deg, #0ea5e9 0%, #0f172a 100%)",
  color: "#fff",
  borderRadius: "20px",
  padding: "24px 28px",
  boxShadow: "0 24px 54px -35px rgba(14, 165, 233, 0.65)",
};

const formatDateTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

export default function CoordinatorAdvertisements() {
  const fileInputRef = useRef(null);
  const [token] = useState(() => localStorage.getItem("token"));
  const [coordinator, setCoordinator] = useState(null);
  const [anuncios, setAnuncios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [buscar, setBuscar] = useState("");
  const [form, setForm] = useState({
    titulo: "",
    mensaje: "",
    visibleFrom: "",
    attachment: null,
  });

  const carrera = coordinator?.Carrera || "";

  const fetchOutbox = async () => {
    if (!token) {
      setError("Necesitas iniciar sesion para gestionar anuncios.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const profileResponse = await axios.get("/api/coordinator/me", {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });

      setCoordinator(profileResponse.data?.coordinator || null);

      const { data } = await axios.get("/api/advertisements?scope=outbox", {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });

      setAnuncios(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(getApiErrorMessage(err, "No pudimos cargar tus anuncios. Actualiza la pagina."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOutbox();
  }, [token]);

  const updateForm = (field) => (event) => {
    const value = field === "attachment" ? event.target.files?.[0] || null : event.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!carrera) {
      setError("Tu usuario de coordinador no tiene carrera asignada.");
      return;
    }

    try {
      setSaving(true);

      const formData = new FormData();
      formData.append("titulo", form.titulo);
      formData.append("mensaje", form.mensaje);
      formData.append("target_role", "student");
      formData.append("target_carrera", carrera);
      if (form.visibleFrom) formData.append("visible_from", form.visibleFrom);
      if (form.attachment) formData.append("attachment", form.attachment);

      await axios.post("/api/advertisements", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "multipart/form-data",
        },
      });

      setForm({
        titulo: "",
        mensaje: "",
        visibleFrom: "",
        attachment: null,
      });

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      setSuccess("Anuncio publicado para los estudiantes de tu carrera.");
      await fetchOutbox();
    } catch (err) {
      setError(getApiErrorMessage(err, "No pudimos publicar el anuncio. Revisa los datos."));
    } finally {
      setSaving(false);
    }
  };

  const anunciosFiltrados = useMemo(() => {
    const term = buscar.trim().toLowerCase();
    const filtered = anuncios.filter((item) => {
      if (!term) return true;
      return `${item.titulo ?? ""} ${item.mensaje ?? ""}`.toLowerCase().includes(term);
    });

    return filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [anuncios, buscar]);

  const stats = useMemo(() => {
    const now = new Date();
    return {
      total: anuncios.length,
      programados: anuncios.filter((item) => item.visible_from && new Date(item.visible_from) > now).length,
      conAdjunto: anuncios.filter((item) => !!item.attachment_path).length,
    };
  }, [anuncios]);

  return (
    <div className="p-3 p-md-4" style={{ background: "#f5f7fb", minHeight: "100vh" }}>
      <div className="container-fluid" style={{ maxWidth: "1100px" }}>
        <section style={HERO_STYLE} className="mb-4">
          <p className="text-uppercase small mb-1" style={{ letterSpacing: "0.08em", opacity: 0.85 }}>
            Publicaciones
          </p>
          <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
            <div>
              <h1 className="h4 mb-1">Anuncios para estudiantes</h1>
              <p className="mb-0" style={{ maxWidth: "560px", opacity: 0.92 }}>
                Carrera: {carrera || "Sin carrera asignada"}
              </p>
            </div>
            <button type="button" className="btn btn-light btn-sm" onClick={fetchOutbox} disabled={loading}>
              Actualizar
            </button>
          </div>
        </section>

        <div className="row g-3 mb-3">
          <div className="col-12 col-md-4">
            <div className="card shadow-sm border-0 h-100">
              <div className="card-body">
                <p className="text-muted small mb-1">Total anuncios</p>
                <h4 className="mb-0">{stats.total}</h4>
              </div>
            </div>
          </div>
          <div className="col-12 col-md-4">
            <div className="card shadow-sm border-0 h-100">
              <div className="card-body">
                <p className="text-muted small mb-1">Programados</p>
                <h4 className="mb-0 text-primary">{stats.programados}</h4>
              </div>
            </div>
          </div>
          <div className="col-12 col-md-4">
            <div className="card shadow-sm border-0 h-100">
              <div className="card-body">
                <p className="text-muted small mb-1">Con adjunto</p>
                <h4 className="mb-0 text-success">{stats.conAdjunto}</h4>
              </div>
            </div>
          </div>
        </div>

        <div className="row g-3">
          <div className="col-12 col-lg-5">
            <div className="card shadow-sm border-0 h-100">
              <div className="card-body">
                <h5 className="mb-3">Nuevo anuncio</h5>
                {error && <div className="alert alert-danger py-2">{error}</div>}
                {success && <div className="alert alert-success py-2">{success}</div>}

                <form onSubmit={handleSubmit} className="d-grid gap-3">
                  <div>
                    <label className="form-label">Titulo</label>
                    <input
                      type="text"
                      className="form-control"
                      value={form.titulo}
                      onChange={updateForm("titulo")}
                      required
                      maxLength={255}
                    />
                  </div>

                  <div>
                    <label className="form-label">Mensaje</label>
                    <textarea
                      className="form-control"
                      rows={5}
                      value={form.mensaje}
                      onChange={updateForm("mensaje")}
                      required
                    />
                  </div>

                  <div className="row g-2">
                    <div className="col-12 col-md-6">
                      <label className="form-label">Dirigido a</label>
                      <input className="form-control" value="Estudiantes" disabled />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label">Carrera</label>
                      <input className="form-control" value={carrera} disabled />
                    </div>
                  </div>

                  <div>
                    <label className="form-label">Visible desde</label>
                    <input
                      type="datetime-local"
                      className="form-control"
                      value={form.visibleFrom}
                      onChange={updateForm("visibleFrom")}
                    />
                    <div className="form-text">Si lo dejas vacio, sera visible de inmediato.</div>
                  </div>

                  <div>
                    <label className="form-label">Adjunto</label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="form-control"
                      onChange={updateForm("attachment")}
                    />
                  </div>

                  <button className="btn btn-primary" type="submit" disabled={saving || !carrera}>
                    {saving ? "Publicando..." : "Publicar anuncio"}
                  </button>
                </form>
              </div>
            </div>
          </div>

          <div className="col-12 col-lg-7">
            <div className="card shadow-sm border-0 h-100">
              <div className="card-body">
                <div className="d-flex flex-wrap gap-2 align-items-center mb-3">
                  <h5 className="mb-0">Mis anuncios</h5>
                  <input
                    type="text"
                    className="form-control form-control-sm ms-auto"
                    placeholder="Buscar titulo o mensaje"
                    value={buscar}
                    onChange={(event) => setBuscar(event.target.value)}
                    style={{ minWidth: "220px", maxWidth: "280px" }}
                  />
                </div>

                {loading ? (
                  <div className="text-center text-muted">Cargando...</div>
                ) : anunciosFiltrados.length === 0 ? (
                  <div className="text-muted">No hay anuncios publicados.</div>
                ) : (
                  <div className="d-grid gap-3">
                    {anunciosFiltrados.map((item) => (
                      <div key={item.id} className="border rounded p-3 bg-white shadow-sm">
                        <div className="d-flex justify-content-between align-items-start gap-2">
                          <div className="d-flex flex-wrap gap-1 align-items-center">
                            <span
                              className="badge bg-primary-subtle text-primary text-uppercase"
                              style={{ letterSpacing: "0.05em" }}
                            >
                              Estudiantes
                            </span>
                            {item.target_carrera && (
                              <span className="badge bg-light text-dark">{item.target_carrera}</span>
                            )}
                            <span className="badge bg-secondary-subtle text-secondary">
                              {item.visible_from ? `Desde ${formatDateTime(item.visible_from)}` : "Disponible ya"}
                            </span>
                          </div>
                          <span className="text-muted small">
                            {formatDateTime(item.created_at)}
                          </span>
                        </div>
                        <h6 className="mt-2 mb-1">{item.titulo}</h6>
                        <p className="mb-2 text-muted" style={{ whiteSpace: "pre-line" }}>
                          {item.mensaje}
                        </p>
                        {item.attachment_path && (
                          <a
                            href={`/storage/${item.attachment_path}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-sm btn-outline-primary"
                          >
                            Ver adjunto
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
