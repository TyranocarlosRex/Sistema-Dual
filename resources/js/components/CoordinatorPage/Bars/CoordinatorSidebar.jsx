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
          <NavLink className="nav-link" to="/coordinator-tracking">
            Seguimiento
          </NavLink>
        </li>
      </ul>
    </div>
  );
}
