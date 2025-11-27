import React from "react";
import { NavLink, useLocation } from "react-router-dom";

const SIDEBAR_STYLE = {
  minWidth: "210px",
  minHeight: "100vh",
  background: "linear-gradient(180deg, #0f172a 0%, #1e293b 55%, #1d4ed8 100%)",
  color: "#f8fafc",
  padding: "1.75rem 1.25rem",
  display: "flex",
  flexDirection: "column",
  gap: "1.5rem",
};

const SECTION_TITLE_STYLE = {
  textTransform: "uppercase",
  fontSize: "0.75rem",
  letterSpacing: "0.08em",
  color: "rgba(226, 232, 240, 0.7)",
  marginBottom: "0.75rem",
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
  backgroundColor: "rgba(255, 255, 255, 0.9)",
  color: "#0f172a",
  fontWeight: 600,
};

const menuGroups = [
  {
    title: "Principal",
    links: [
      { label: "Usuarios", to: "/administrator-users" },
      { label: "Seguimiento", to: "/administrator-tracking" },
    ],
  },
  {
    title: "Publicaciones",
    links: [
      { label: "Evidencias", to: "/administrator-evidence" },
      { label: "Anuncios", to: "/administrator-publications/anuncios" },
    ],
  },
  {
    title: "Herramientas",
    links: [{ label: "Utilerías", to: "/administrator-utilities/letterhead" }],
  },
];

export default function Sidebar() {
  const { pathname } = useLocation();

  return (
    <aside style={SIDEBAR_STYLE}>
      <div className="d-grid gap-4">
        {menuGroups.map((group) => (
          <div key={group.title}>
            <p style={SECTION_TITLE_STYLE}>{group.title}</p>
            <div className="d-grid gap-2">
              {group.links.map((link) => {
                const isActive = pathname.startsWith(link.to);
                const linkStyle = {
                  ...BASE_LINK_STYLE,
                  ...(isActive ? ACTIVE_LINK_STYLE : {}),
                };

                return (
                  <NavLink key={link.to} to={link.to} style={linkStyle}>
                    <span>{link.label}</span>
                    {isActive && (
                      <span className="badge bg-primary ms-auto">Activo</span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div
        className="mt-auto p-3 rounded-3"
        style={{ backgroundColor: "rgba(226, 232, 240, 0.1)" }}
      >
        <p className="small mb-1" style={{ color: "rgba(248, 250, 252, 0.8)" }}>
          Recordatorios
        </p>
        <p className="mb-0" style={{ fontSize: "0.9rem", color: "#f8fafc" }}>
          Revisa tus evidencias.
        </p>
      </div>
    </aside>
  );
}