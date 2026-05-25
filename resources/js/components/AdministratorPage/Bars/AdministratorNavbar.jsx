import { NavLink, useNavigate } from "react-router-dom";
import axios from "axios";
import { useState, useEffect, useRef } from "react";
import { APP_ROUTES } from "../../../routes";

const NAVBAR_STYLE = {
  background: "linear-gradient(135deg, #1d4ed8 0%, #1e293b 100%)",
  boxShadow: "0 10px 24px -18px rgba(29, 78, 216, 0.9)",
};

const safeParse = (raw) => {
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export default function Navbar() {
  const navigate = useNavigate();
  const [isAuthed, setIsAuthed] = useState(false);
  const [adminName, setAdminName] = useState("Administrador");
  const [openMenu, setOpenMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    setIsAuthed(!!localStorage.getItem("token"));
    const admin = safeParse(localStorage.getItem("admin"));
    if (admin?.name) {
      setAdminName(admin.name);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    const token = localStorage.getItem("token");
    try {
      if (token) {
        await axios.post(
          "/api/logout",
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
    } catch (e) {
      // se ignora el error y se limpia la sesion
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("role");
      localStorage.removeItem("coordinator");
      localStorage.removeItem("admin");
      navigate(APP_ROUTES.auth.studentLogin);
    }
  };

  return (
    <nav className="navbar navbar-expand" style={NAVBAR_STYLE}>
      <div className="container-fluid px-4">
        <NavLink className="navbar-brand text-white fw-semibold" to={APP_ROUTES.admin.home}>
          Educacion Dual
          <span className="d-block fs-6 fw-normal text-white-50">Panel administrador</span>
        </NavLink>

        {isAuthed && (
          <div className="d-flex align-items-center gap-3" ref={menuRef}>
            <div className="text-white-50 small d-none d-sm-inline">Sesion activa</div>
            <button
              type="button"
              className="btn btn-light btn-sm d-flex align-items-center gap-2"
              onClick={() => setOpenMenu((prev) => !prev)}
            >
              <span className="badge bg-primary text-white">AD</span>
              <span className="text-dark">{adminName}</span>
              <span style={{ fontSize: "0.8rem" }}>{openMenu ? "^" : "v"}</span>
            </button>
            {openMenu && (
              <div
                className="dropdown-menu show mt-2"
                style={{ right: 0, left: "auto" }}
              >
                <button className="dropdown-item" type="button" onClick={handleLogout}>
                  Cerrar sesion
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
