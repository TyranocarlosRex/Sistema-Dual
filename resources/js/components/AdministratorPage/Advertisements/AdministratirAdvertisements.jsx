import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { getApiErrorMessage } from "../../../utils/errorMessages";

const HERO_STYLE = {
  background: "linear-gradient(135deg, #1d4ed8 0%, #1e293b 100%)",
  color: "#fff",
  borderRadius: "20px",
  padding: "24px 28px",
  boxShadow: "0 24px 54px -35px rgba(29, 78, 216, 0.6)",
};

const ROLE_OPTIONS = [
  { value: "all", label: "Todos" },
  { value: "student", label: "Estudiantes" },
  { value: "coordinator", label: "Coordinadores" },
  { value: "admin", label: "Administradores" },
];

export default function AdministratirAdvertisements() {
  const [anuncios, setAnuncios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [titulo, setTitulo] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [targetRole, setTargetRole] = useState("all");
  const [targetCarrera, setTargetCarrera] = useState("");
  const [visibleFrom, setVisibleFrom] = useState("");
  const [attachment, setAttachment] = useState(null);

  const [filtroRol, setFiltroRol] = useState("all");
  const [buscar, setBuscar] = useState("");

  const token = localStorage.getItem("token");

  const fetchAnuncios = async () => {
    try {
      setLoading(true);
      setError("");
      const { data } = await axios.get("/api/advertisements?scope=outbox", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAnuncios(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError(getApiErrorMessage(err, "No pudimos cargar los anuncios. Actualiza la pagina."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchAnuncios();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const formData = new FormData();
      formData.append("titulo", titulo);
      formData.append("mensaje", mensaje);
      formData.append("target_role", targetRole);
      if (targetCarrera) formData.append("target_carrera", targetCarrera);
      if (visibleFrom) formData.append("visible_from", visibleFrom);
      if (attachment) formData.append("attachment", attachment);

      await axios.post("/api/advertisements", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setTitulo("");
      setMensaje("");
      setTargetRole("all");
      setTargetCarrera("");
      setVisibleFrom("");
      setAttachment(null);
      setSuccess("Anuncio creado.");
      fetchAnuncios();
    } catch (err) {
      console.error(err);
      setError(getApiErrorMessage(err, "No pudimos crear el anuncio. Revisa los datos."));
    }
  };

  const anunciosOrdenados = useMemo(() => {
    const filtrados = anuncios.filter((a) => {
      const coincideRol = filtroRol === "all" || a.target_role === filtroRol;
      const texto = `${a.titulo} ${a.mensaje}`.toLowerCase();
      const coincideTexto = buscar.trim() === "" || texto.includes(buscar.toLowerCase());
      return coincideRol && coincideTexto;
    });
    return filtrados.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [anuncios, filtroRol, buscar]);

  const stats = useMemo(() => {
    const total = anuncios.length;
    const programados = anuncios.filter((a) => a.visible_from && new Date(a.visible_from) > new Date()).length;
    const conAdjunto = anuncios.filter((a) => !!a.attachment_path).length;
    return { total, programados, conAdjunto };
  }, [anuncios]);

  return (
    <div className="p-3 p-md-4" style={{ background: "#f5f7fb", minHeight: "100vh" }}>
      <div className="container-fluid" style={{ maxWidth: "1100px" }}>
        <section style={HERO_STYLE} className="mb-4">
          <p className="text-uppercase small mb-1" style={{ letterSpacing: "0.08em", opacity: 0.85 }}>
            Publicaciones
          </p>
          <h1 className="h4 mb-1">Anuncios del administrador</h1>
          <p className="mb-0" style={{ maxWidth: "520px", opacity: 0.9 }}>
            Crea avisos segmentados por rol o carrera, con fechas de visibilidad y adjuntos opcionales.
          </p>
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

        <div className="row g-3 mb-3">
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
                      value={titulo}
                      onChange={(e) => setTitulo(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="form-label">Mensaje</label>
                    <textarea
                      className="form-control"
                      rows={4}
                      value={mensaje}
                      onChange={(e) => setMensaje(e.target.value)}
                      required
                    />
                  </div>

                  <div className="row g-2">
                    <div className="col-12 col-md-6">
                      <label className="form-label">Dirigido a</label>
                      <select
                        className="form-select"
                        value={targetRole}
                        onChange={(e) => setTargetRole(e.target.value)}
                      >
                        {ROLE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label">Carrera (opcional)</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Ej. Sistemas, Industrial"
                        value={targetCarrera}
                        onChange={(e) => setTargetCarrera(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="form-label">Visible desde</label>
                    <input
                      type="datetime-local"
                      className="form-control"
                      value={visibleFrom}
                      onChange={(e) => setVisibleFrom(e.target.value)}
                    />
                    <div className="form-text">Si lo dejas vacio, sera visible de inmediato.</div>
                  </div>

                  <div>
                    <label className="form-label">Adjunto (opcional)</label>
                    <input
                      type="file"
                      className="form-control"
                      onChange={(e) => setAttachment(e.target.files[0] || null)}
                    />
                  </div>

                  <button className="btn btn-primary" type="submit">
                    Publicar anuncio
                  </button>
                </form>
              </div>
            </div>
          </div>

          <div className="col-12 col-lg-7">
            <div className="card shadow-sm border-0 h-100">
              <div className="card-body">
                <div className="d-flex flex-wrap gap-2 align-items-center mb-3">
                  <h5 className="mb-0">Anuncios publicados</h5>
                  <div className="ms-auto d-flex gap-2">
                    <select
                      className="form-select form-select-sm"
                      style={{ minWidth: "140px" }}
                      value={filtroRol}
                      onChange={(e) => setFiltroRol(e.target.value)}
                    >
                      <option value="all">Todos</option>
                      <option value="student">Estudiantes</option>
                      <option value="coordinator">Coordinadores</option>
                      <option value="admin">Administradores</option>
                    </select>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Buscar titulo o mensaje"
                      value={buscar}
                      onChange={(e) => setBuscar(e.target.value)}
                      style={{ minWidth: "180px" }}
                    />
                  </div>
                </div>

                {loading ? (
                  <div className="text-center text-muted">Cargando...</div>
                ) : anunciosOrdenados.length === 0 ? (
                  <div className="text-muted">No hay anuncios disponibles.</div>
                ) : (
                  <div className="d-grid gap-3">
                    {anunciosOrdenados.map((a) => (
                      <div key={a.id} className="border rounded p-3 bg-white shadow-sm">
                        <div className="d-flex justify-content-between align-items-start gap-2">
                          <div className="d-flex flex-wrap gap-1 align-items-center">
                            <span
                              className="badge bg-primary-subtle text-primary text-uppercase"
                              style={{ letterSpacing: "0.05em" }}
                            >
                              {a.target_role === "all" ? "Todos" : a.target_role}
                            </span>
                            {a.target_carrera && (
                              <span className="badge bg-light text-dark">{a.target_carrera}</span>
                            )}
                            <span className="badge bg-secondary-subtle text-secondary">
                              {a.visible_from
                                ? `Desde ${new Date(a.visible_from).toLocaleString()}`
                                : "Disponible ya"}
                            </span>
                          </div>
                          <span className="text-muted small">
                            {a.created_at ? new Date(a.created_at).toLocaleString() : ""}
                          </span>
                        </div>
                        <h6 className="mt-2 mb-1">{a.titulo}</h6>
                        <p className="mb-2 text-muted" style={{ whiteSpace: "pre-line" }}>
                          {a.mensaje}
                        </p>
                        <div className="d-flex align-items-center gap-2 flex-wrap">
                          {a.attachment_path && (
                            <a
                              href={`/storage/${a.attachment_path}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-sm btn-outline-primary"
                            >
                              Ver adjunto
                            </a>
                          )}
                        </div>
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
