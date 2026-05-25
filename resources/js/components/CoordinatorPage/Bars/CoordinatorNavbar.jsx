import { NavLink, useNavigate } from "react-router-dom";
import axios from "axios";
import { useState, useEffect, useRef } from "react";
import { APP_ROUTES } from "../../../routes";

const NAVBAR_STYLE = {
  background: "linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%)",
  boxShadow: "0 10px 24px -18px rgba(6, 182, 212, 0.6)",
};

const safeParse = (raw) => {
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const getCoordinatorName = (coordinator, user) => {
  return (
    coordinator?.Nombre ||
    coordinator?.name ||
    user?.name ||
    "Coordinador"
  );
};

export default function Navbar() {
  const navigate = useNavigate();
  const [isAuthed, setIsAuthed] = useState(false);
  const [coordinatorName, setCoordinatorName] = useState("Coordinador");
  const [openMenu, setOpenMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    setIsAuthed(!!localStorage.getItem("token"));
    const coordinator = safeParse(localStorage.getItem("coordinator"));
    const user = safeParse(localStorage.getItem("user"));
    setCoordinatorName(getCoordinatorName(coordinator, user));
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
      // se ignora error y se limpia sesion
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("role");
      localStorage.removeItem("coordinator");
      navigate(APP_ROUTES.auth.studentLogin);
    }
  };

  return (
    <nav className="navbar navbar-expand" style={NAVBAR_STYLE}>
      <div className="container-fluid px-4">
        <NavLink className="navbar-brand text-white fw-semibold" to={APP_ROUTES.coordinator.home}>
          Educacion Dual
          <span className="d-block fs-6 fw-normal text-white-50">Panel coordinador</span>
        </NavLink>

        {isAuthed && (
          <div className="d-flex align-items-center gap-3" ref={menuRef}>
            <div className="text-white-50 small d-none d-sm-inline">Sesion activa</div>
            <button
              type="button"
              className="btn btn-light btn-sm d-flex align-items-center gap-2"
              onClick={() => setOpenMenu((prev) => !prev)}
            >
              <span className="badge bg-info text-white">CO</span>
              <span className="text-dark">{coordinatorName}</span>
              <span style={{ fontSize: "0.8rem" }}>{openMenu ? "^" : "v"}</span>
            </button>
            {openMenu && (
              <div className="dropdown-menu show mt-2" style={{ right: 0, left: "auto" }}>
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
