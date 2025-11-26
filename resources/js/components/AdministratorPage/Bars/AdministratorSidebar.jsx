import React, { useState, useEffect, useRef } from "react";
import { NavLink, useLocation } from "react-router-dom";

export default function Sidebar() {
  const [openDocs, setOpenDocs] = useState(false);
  const [openPosts, setOpenPosts] = useState(false);
  const location = useLocation();
  const submenuRef = useRef(null);

  useEffect(() => {
    if (location.pathname.startsWith("/administrator-documents")) {
      setOpenDocs(true);
    }

    if (location.pathname.startsWith("/administrator-publications")) {
      setOpenPosts(true);
    }
  }, [location.pathname]);

  const toggleDocs = () => setOpenDocs((s) => !s);
  const togglePosts = () => setOpenPosts((s) => !s);

  return (
    <div className="bg-light border-end vh-100" style={{ width: "150px" }}>
      <ul className="nav flex-column p-3">
        <li className="nav-item mb-2">
          <NavLink className="nav-link" to="/administrator-users">
            Usuarios
          </NavLink>
        </li>

        <li className="nav-item mb-2">
          <NavLink className="nav-link" to="/administrator-tracking">
            Seguimiento
          </NavLink>
        </li>

        {/* PUBLICACIONES con dropdown */}
        <li className="nav-item mb-2">
          <button
            className="btn btn-link nav-link d-flex justify-content-between align-items-center w-100 text-start"
            onClick={togglePosts}
            aria-expanded={openPosts}
            aria-controls="posts-submenu"
            style={{ textDecoration: "none" }}
          >
            <span>Publicaciones</span>
            <span
              style={{
                transform: openPosts ? "rotate(90deg)" : "rotate(0deg)",
                transition: "transform .2s",
              }}
            />
          </button>

          <div
            id="posts-submenu"
            className={`submenu collapse-transition ${openPosts ? "show" : ""}`}
          >
            <ul className="nav flex-column ms-3">
              <li className="nav-item">
                <NavLink
                  className="nav-link"
                  to="/administrator-evidence"
                >
                  Evidencias
                </NavLink>
              </li>

              <li className="nav-item">
                <NavLink
                  className="nav-link"
                  to="/administrator-publications/anuncios"
                >
                  Anuncios
                </NavLink>
              </li>
            </ul>
          </div>
        </li>
        <li className="nav-item mb-2">
          <NavLink
            className="nav-link"
            to="/administrator-utilities/letterhead"
          >
            Utilerías
          </NavLink>
        </li>
      </ul>
    </div>
  );
}