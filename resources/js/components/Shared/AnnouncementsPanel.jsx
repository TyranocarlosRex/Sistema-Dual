import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

const ROLE_LABELS = {
  all: "Todos",
  student: "Estudiantes",
  coordinator: "Coordinadores",
  admin: "Administradores",
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

const truncate = (text, limit = 200) => {
  if (!text) return "";
  return text.length > limit ? `${text.slice(0, limit - 3)}...` : text;
};

export default function AnnouncementsPanel({
  title = "Anuncios",
  emptyMessage = "No hay anuncios para mostrar.",
  maxItems = 4,
  compact = false,
  className = "",
}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        setError("");
        const token = localStorage.getItem("token");
        if (!token) {
          setError("Necesitas iniciar sesión para ver los anuncios.");
          return;
        }

        const { data } = await axios.get("/api/advertisements", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setItems(Array.isArray(data) ? data : []);
      } catch (err) {
        setError("No se pudieron cargar los anuncios.");
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();
  }, []);

  const visibleItems = useMemo(
    () => items.slice(0, maxItems),
    [items, maxItems]
  );

  return (
    <div className={`card shadow-sm border-0 h-100 ${className}`.trim()}>
      <div className="card-header bg-light d-flex justify-content-between align-items-center">
        <div>
          <p
            className="text-uppercase small mb-1 text-muted"
            style={{ letterSpacing: "0.08em" }}
          >
            Comunicados
          </p>
          <h6 className="mb-0">{title}</h6>
        </div>
        {loading && (
          <span
            className="spinner-border spinner-border-sm text-secondary"
            role="status"
            aria-label="Cargando anuncios"
          />
        )}
      </div>

      <div className="card-body">
        {error && <div className="alert alert-danger py-2 mb-0">{error}</div>}

        {!error && loading && (
          <div className="text-muted small">Cargando anuncios...</div>
        )}

        {!error && !loading && visibleItems.length === 0 && (
          <div className="text-muted small">{emptyMessage}</div>
        )}

        {!error && !loading && visibleItems.length > 0 && (
          <div className="d-grid gap-3">
            {visibleItems.map((item) => (
              <div
                key={item.id ?? item.titulo}
                className="border rounded p-3 bg-white"
              >
                <div className="d-flex justify-content-between align-items-start gap-2">
                  <div className="d-flex flex-wrap gap-1 align-items-center">
                    <span
                      className="badge bg-primary-subtle text-primary text-uppercase"
                      style={{ letterSpacing: "0.05em" }}
                    >
                      {ROLE_LABELS[item.target_role] || item.target_role || "Todos"}
                    </span>
                    {item.target_carrera && (
                      <span className="badge bg-light text-secondary">
                        {item.target_carrera}
                      </span>
                    )}
                  </div>
                  {item.created_at && (
                    <span className="text-muted small">
                      {formatDateTime(item.created_at)}
                    </span>
                  )}
                </div>

                <h6 className="mt-2 mb-1">{item.titulo}</h6>
                <p className="mb-2 text-muted small" style={{ whiteSpace: "pre-line" }}>
                  {compact ? truncate(item.mensaje) : item.mensaje}
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
  );
}
