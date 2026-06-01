import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { APP_ROUTES } from "../../../routes";

const SIDEBAR_STYLE = {
  minWidth: "200px",
  width: "200px",
  flexShrink: 0,
  flexBasis: "200px",
  minHeight: "100vh",
  position: "sticky",
  top: 0,
  alignSelf: "flex-start",
  overflowY: "auto",
  background: "linear-gradient(180deg, #22c55e 0%, #15803d 85%)",
  color: "#ecfdf3",
  padding: "1.5rem 1.25rem",
  display: "flex",
  flexDirection: "column",
  gap: "1.5rem",
  boxShadow: "0 20px 40px -28px rgba(21, 128, 61, 0.65)",
};

const SECTION_TITLE_STYLE = {
  textTransform: "uppercase",
  fontSize: "0.75rem",
  letterSpacing: "0.08em",
  color: "rgba(236, 253, 243, 0.7)",
  marginBottom: "0.5rem",
};

const BASE_LINK_STYLE = {
  display: "flex",
  alignItems: "center",
  padding: "0.65rem 0.9rem",
  borderRadius: "0.85rem",
  textDecoration: "none",
  fontSize: "0.95rem",
  color: "#ecfdf3",
  transition: "background 0.2s ease, color 0.2s ease",
  border: "1px solid rgba(236, 253, 243, 0.08)",
  backgroundColor: "rgba(236, 253, 243, 0.05)",
};

const ACTIVE_LINK_STYLE = {
  backgroundColor: "rgba(255, 255, 255, 0.95)",
  color: "#14532d",
  fontWeight: 600,
  boxShadow: "0 10px 18px -14px rgba(21, 128, 61, 0.6)",
};

const PROFILE_CARD_STYLE = {
  backgroundColor: "rgba(236, 253, 243, 0.08)",
  border: "1px solid rgba(236, 253, 243, 0.15)",
};

const REMINDER_STYLE = {
  backgroundColor: "rgba(236, 253, 243, 0.08)",
  border: "1px solid rgba(236, 253, 243, 0.12)",
};

const MENU_LINKS = [
  { label: "Inicio", to: APP_ROUTES.student.home },
  { label: "Mis evidencias", to: APP_ROUTES.student.evidences },
];

export default function StudentSidebar({
  displayName = "Estudiante",
  email = "",
  onUploadEvidence,
  onOpenNextReport,
  hasEvidences = false,
}) {
  const { pathname } = useLocation();

  return (
    <aside className="app-sidebar app-sidebar-student" style={SIDEBAR_STYLE}>
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
                    <span className="badge bg-success text-white ms-auto">Activo</span>
                  )}
                </NavLink>
              );
            })}
          </div>
        </div>
      </div>

      <div className="app-sidebar-reminder mt-auto p-3 rounded-3" style={REMINDER_STYLE}>
        <p className="small mb-1" style={{ color: "rgba(236, 253, 243, 0.85)" }}>
          Recordatorio
        </p>
        <p className="mb-0" style={{ fontSize: "0.9rem", color: "#ecfdf3" }}>
          Manten tus reportes al dia y revisa tus evidencias activas.
        </p>
      </div>
    </aside>
  );
}
