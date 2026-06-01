import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { APP_ROUTES } from "../../../routes";

const SIDEBAR_STYLE = {
  minWidth: "200px",
  width: "200px",
  flexShrink: 0,
  flexBasis: "200px",
  minHeight: "100vh",
  background: "linear-gradient(180deg, #0ea5e9 0%, #0f172a 80%)",
  color: "#e2e8f0",
  padding: "1.75rem 1.25rem",
  display: "flex",
  flexDirection: "column",
  gap: "1.5rem",
  boxShadow: "0 20px 40px -28px rgba(15, 23, 42, 0.65)",
};

const SECTION_TITLE_STYLE = {
  textTransform: "uppercase",
  fontSize: "0.75rem",
  letterSpacing: "0.08em",
  color: "rgba(226, 232, 240, 0.7)",
  marginBottom: "0.5rem",
};

const BASE_LINK_STYLE = {
  display: "flex",
  alignItems: "center",
  padding: "0.6rem 0.9rem",
  borderRadius: "0.75rem",
  textDecoration: "none",
  fontSize: "0.95rem",
  color: "#e2e8f0",
  transition: "background 0.2s ease, color 0.2s ease",
};

const ACTIVE_LINK_STYLE = {
  backgroundColor: "rgba(255, 255, 255, 0.95)",
  color: "#0f172a",
  fontWeight: 600,
};

const MENU_LINKS = [
  { label: "Inicio", to: APP_ROUTES.coordinator.home },
  { label: "Usuarios", to: APP_ROUTES.coordinator.users },
  { label: "Seguimiento", to: APP_ROUTES.coordinator.tracking },
  { label: "Pendientes", to: APP_ROUTES.coordinator.pending },
];

export default function Sidebar() {
  const { pathname } = useLocation();

  return (
    <aside className="app-sidebar app-sidebar-coordinator" style={SIDEBAR_STYLE}>
      <div className="d-grid gap-3">
        <div>
          <p style={SECTION_TITLE_STYLE}>Panel</p>
          <div className="app-sidebar-links d-grid gap-2">
            {MENU_LINKS.map((link) => {
              const isActive = pathname.startsWith(link.to);
              const linkStyle = { ...BASE_LINK_STYLE, ...(isActive ? ACTIVE_LINK_STYLE : {}) };

              return (
                <NavLink key={link.to} to={link.to} style={linkStyle}>
                  <span>{link.label}</span>
                  {isActive && (
                    <span className="badge bg-info text-dark ms-auto">Activo</span>
                  )}
                </NavLink>
              );
            })}
          </div>
        </div>
      </div>

      <div
        className="app-sidebar-reminder mt-auto p-3 rounded-3"
        style={{ backgroundColor: "rgba(226, 232, 240, 0.08)", border: "1px solid rgba(226, 232, 240, 0.12)" }}
      >
        <p className="small mb-1" style={{ color: "rgba(226, 232, 240, 0.9)" }}>
          Recordatorio
        </p>
        <p className="mb-0" style={{ fontSize: "0.9rem", color: "#f8fafc" }}>
          Revisa entregas y documentos pendientes.
        </p>
      </div>
    </aside>
  );
}
