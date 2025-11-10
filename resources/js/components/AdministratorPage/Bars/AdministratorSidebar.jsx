import React, { useState, useEffect, useRef } from "react";
import { NavLink, useLocation } from "react-router-dom";

export default function Sidebar() {
  const [openDocs, setOpenDocs] = useState(false);
  const location = useLocation();
  const submenuRef = useRef(null);

  useEffect(() => {
    if (location.pathname.startsWith("/administrator-documents")) {
      setOpenDocs(true);
    }
  }, [location.pathname]);

  const toggleDocs = () => setOpenDocs((s) => !s);

  return (
    <div className="bg-light border-end vh-100" style={{ width: "150px" }}>
      <ul className="nav flex-column p-3">
        <li className="nav-item mb-2">
          <NavLink className="nav-link" to="/administrator-users">
            Usuarios
          </NavLink>
        </li>

        <li className="nav-item mb-2">
          <NavLink className="nav-link" to="/administrator-reports">
            Reportes
          </NavLink>
        </li>

        <li className="nav-item mb-2">
          <NavLink className="nav-link" to="/administrator-students">
            Estudiantes
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
                <NavLink className="nav-link" to="/administrator-documents/gestionar">
                  Gestión de documentos
                </NavLink>
              </li>

              <li className="nav-item">
                <NavLink className="nav-link" to="/administrator-documents/revision">
                  Revisar Documentos
                </NavLink>
              </li>
            </ul>
          </div>
        </li>

        {}
        <li className="nav-item mb-2">
          <NavLink className="nav-link" to="/administrator-utilities/letterhead">
            Utilerías
          </NavLink>
        </li>
      </ul>
    </div>
  );
}
