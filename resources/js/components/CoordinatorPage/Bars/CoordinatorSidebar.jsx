// resources/js/components/CoordinatorSidebar.jsx
import React, { useState, useEffect, useRef } from "react";
import { NavLink, useLocation } from "react-router-dom";

export default function Sidebar() {
  const [openDocs, setOpenDocs] = useState(false);
  const location = useLocation();
  const submenuRef = useRef(null);

  // Abrir submenú si estás en rutas de documentos
  useEffect(() => {
    if (location.pathname.startsWith("/coordinator-documents")) {
      setOpenDocs(true);
    }
  }, [location.pathname]);

  const toggleDocs = () => setOpenDocs((s) => !s);

  return (
    <div className="bg-light border-end vh-100" style={{ width: "150px" }}>
      <ul className="nav flex-column p-3">
        <li className="nav-item mb-2">
          <NavLink className="nav-link" to="/coordinator-users">
            Usuarios
          </NavLink>
        </li>

        <li className="nav-item mb-2">
          <NavLink className="nav-link" to="/coordinator-reports">
            Reportes
          </NavLink>
        </li>

        {/* === NUEVO: enlace top-level a Estudiantes === */}
        <li className="nav-item mb-2">
          <NavLink className="nav-link" to="/coordinator-students">
            Estudiantes
          </NavLink>
        </li>

        <li className="nav-item mb-2">
          <NavLink className="nav-link" to="/procesos">
            <i className="bi bi-diagram-3 me-1"></i> Procesos
          </NavLink>
        </li>

        <li className="nav-item mb-2">
          <button
            className="btn btn-link nav-link d-flex justify-content-between align-items-center w-100 text-start"
            onClick={toggleDocs}
            aria-expanded={openDocs}
            aria-controls="docs-submenu"
            style={{ textDecoration: "none" }}
          >
            <span>Documentos</span>
            <span
              style={{
                transform: openDocs ? "rotate(90deg)" : "rotate(0deg)",
                transition: "transform .2s",
              }}
            />
          </button>

          <div
            id="docs-submenu"
            ref={submenuRef}
            className={`submenu collapse-transition ${openDocs ? "show" : ""}`}
          >
            <ul className="nav flex-column ms-3">
              
              <li className="nav-item">
                <NavLink className="nav-link" to="/coordinator-documents/gestion">
                  Gestión de Documentos
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink className="nav-link" to="/coordinator-documents/revision">
                  Revisión de Documentos
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink className="nav-link" to="/coordinator-documents/otros">
                  Otros Documentos
                </NavLink>
              </li>
              {/* Módulo de Procesos */}
              <li className="nav-item">
                <NavLink className="nav-link" to="/coordinator-processes">
                  <i className="bi bi-gear me-2"></i>
                  Procesos
                </NavLink>
              </li>
            </ul>
          </div>
        </li>

        {/* === NUEVO: Utilerías top-level === */}
        <li className="nav-item mb-2">
          <NavLink className="nav-link" to="/coordinator-utilities/letterhead">
            Utilerías
          </NavLink>
        </li>
      </ul>
    </div>
  );
}
