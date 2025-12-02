import { NavLink, useNavigate } from "react-router-dom";
import axios from "axios";
import { useState, useEffect, useRef } from "react";

const NAVBAR_STYLE = {
  background: "linear-gradient(135deg, #22c55e 0%, #15803d 100%)",
  boxShadow: "0 10px 24px -18px rgba(34, 197, 94, 0.55)",
};

const safeParse = (raw) => {
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const getStudentName = (student, user) => {
  const fullName = `${student?.Nombre ?? ""} ${student?.Apellidos ?? ""}`.trim();
  if (fullName) return fullName;
  return student?.name || user?.name || "Estudiante";
};

export default function Navbar() {
  const navigate = useNavigate();
  const [isAuthed, setIsAuthed] = useState(false);
  const [studentName, setStudentName] = useState("Estudiante");
  const [openMenu, setOpenMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    setIsAuthed(!!localStorage.getItem("token"));
    const student = safeParse(localStorage.getItem("student"));
    const user = safeParse(localStorage.getItem("user"));
    setStudentName(getStudentName(student, user));
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
      // Si el token ya no es valido, igual limpiaremos cliente
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("role");
      localStorage.removeItem("student");
      navigate("/");
    }
  };

  return (
    <nav className="navbar navbar-expand" style={NAVBAR_STYLE}>
      <div className="container-fluid px-4">
        <NavLink className="navbar-brand text-white fw-semibold" to="/students-home">
          Sistema Dual
          <span className="d-block fs-6 fw-normal text-white-50">Panel estudiante</span>
        </NavLink>

        {isAuthed && (
          <div className="d-flex align-items-center gap-3" ref={menuRef}>
            <div className="text-white-50 small d-none d-sm-inline">Sesion activa</div>
            <button
              type="button"
              className="btn btn-light btn-sm d-flex align-items-center gap-2"
              onClick={() => setOpenMenu((prev) => !prev)}
            >
              <span className="badge bg-success text-white">ES</span>
              <span className="text-dark">{studentName}</span>
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
