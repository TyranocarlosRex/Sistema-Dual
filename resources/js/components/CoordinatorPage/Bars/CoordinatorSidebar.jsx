import React, { useState, useEffect, useRef } from "react";
import { NavLink, useLocation } from "react-router-dom";

export default function Sidebar() {
  const [openDocs, setOpenDocs] = useState(false);
  const location = useLocation();
  const submenuRef = useRef(null);

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
          <NavLink className="nav-link" to="/coordinator-documents/gestion">
            Gestión de Documentos
          </NavLink>
        </li>

        <li className="nav-item mb-2">
          <NavLink className="nav-link" to="/coordinator-utilities/letterhead">
            Utilerías
          </NavLink>
        </li>
      </ul>
    </div>
  );
}
