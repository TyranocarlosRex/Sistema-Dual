import React, { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";

const SIDEBAR_STYLE = {
  minWidth: "180px",
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
  marginBottom: "0.25rem",
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

const SECTION_TOGGLE_STYLE = {
  ...SECTION_TITLE_STYLE,
  marginBottom: 0,
  padding: "0.4rem 0.5rem",
  borderRadius: "0.5rem",
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
  width: "100%",
  background: "transparent",
  border: "1px solid rgba(255, 255, 255, 0.08)",
  color: SECTION_TITLE_STYLE.color,
  cursor: "pointer",
};

const menuGroups = [
  {
    title: "Administracion",
    links: [
      { label: "Inicio", to: "/administrator-home" },
      { label: "Usuarios", to: "/administrator-users" },
      { label: "Seguimiento", to: "/administrator-tracking" },
    ],
  },
  {
    title: "Publicaciones",
    links: [
      { label: "Evidencias", to: "/administrator-evidence" },
      { label: "Reportes", to: "/administrator-report" },
    ],
  },
];

export default function Sidebar() {
  const { pathname } = useLocation();
  const [openGroups, setOpenGroups] = useState(() => {
    const initialState = {};
    menuGroups.forEach((group) => {
      const hasActiveLink = group.links.some((link) =>
        pathname.startsWith(link.to)
      );
      initialState[group.title] = hasActiveLink;
    });
    return initialState;
  });

  useEffect(() => {
    setOpenGroups((prev) => {
      const next = { ...prev };
      menuGroups.forEach((group) => {
        const hasActiveLink = group.links.some((link) =>
          pathname.startsWith(link.to)
        );
        if (hasActiveLink) {
          next[group.title] = true;
        }
      });
      return next;
    });
  }, [pathname]);

  const toggleGroup = (title) => {
    setOpenGroups((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  return (
    <aside style={SIDEBAR_STYLE}>
      <div className="d-grid gap-4">
        {menuGroups.map((group) => (
          <div key={group.title}>
            <button
              type="button"
              onClick={() => toggleGroup(group.title)}
              style={SECTION_TOGGLE_STYLE}
              aria-expanded={openGroups[group.title]}
            >
              <span>{group.title}</span>
              <span
                className="ms-auto"
                style={{
                  fontSize: "0.85rem",
                  color: "#cbd5e1",
                  transition: "transform 0.2s ease",
                  transform: openGroups[group.title] ? "rotate(90deg)" : "rotate(0)",
                }}
              >
                &gt;
              </span>
            </button>

            {openGroups[group.title] && (
              <div className="d-grid gap-2 mt-2">
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
            )}
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
