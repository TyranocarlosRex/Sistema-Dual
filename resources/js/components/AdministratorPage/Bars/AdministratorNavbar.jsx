import { NavLink, useNavigate } from "react-router-dom";
import axios from "axios";
import { useState, useEffect } from "react";

const NAVBAR_STYLE = {
  background: "linear-gradient(135deg, #1d4ed8 0%, #1e293b 100%)",
  boxShadow: "0 10px 24px -18px rgba(29, 78, 216, 0.9)",
};

export default function Navbar() {
  const navigate = useNavigate();
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    setIsAuthed(!!localStorage.getItem("token"));
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
      // se ignora el error y se limpia la sesión
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("role");
      localStorage.removeItem("coordinator");
      navigate("/");
    }
  };

  return (
    <nav className="navbar navbar-expand" style={NAVBAR_STYLE}>
      <div className="container-fluid px-4">
        <NavLink className="navbar-brand text-white fw-semibold" to="/administrator-home">
          Educación Dual
          <span className="d-block fs-6 fw-normal text-white-50">Panel administrador</span>
        </NavLink>

        {isAuthed && (
          <div className="d-flex align-items-center gap-3">
            <span className="text-white-50 small d-none d-sm-inline">Sesión activa</span>
            <button
              className="btn btn-light btn-sm"
              onClick={handleLogout}
            >
              Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}