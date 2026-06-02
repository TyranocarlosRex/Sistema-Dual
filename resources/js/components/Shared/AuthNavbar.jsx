import { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import axios from "axios";
import { APP_ROUTES } from "../../routes";
import { clearAuthSession, getAuthToken } from "../../utils/authSession";

export default function AuthNavbar({
  brand,
  subtitle,
  to,
  style,
  badgeClassName,
  badgeText,
  storageKey,
  defaultName,
  resolveName,
  logoutKeys = [],
}) {
  const navigate = useNavigate();
  const [isAuthed, setIsAuthed] = useState(false);
  const [displayName, setDisplayName] = useState(defaultName);
  const [openMenu, setOpenMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    setIsAuthed(Boolean(getAuthToken()));
    setDisplayName(defaultName);
  }, [defaultName, resolveName, storageKey]);

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
    try {
      if (getAuthToken()) {
        await axios.post(
          "/api/logout",
          {}
        );
      }
    } catch {
    } finally {
      clearAuthSession(logoutKeys);
      navigate(APP_ROUTES.auth.studentLogin);
    }
  };

  return (
    <nav className="navbar navbar-expand dual-navbar" style={style}>
      <div className="container-fluid px-4 dual-navbar-inner">
        <NavLink className="navbar-brand text-white fw-semibold dual-navbar-brand" to={to}>
          {brand}
          <span className="d-block fs-6 fw-normal text-white-50">{subtitle}</span>
        </NavLink>

        {isAuthed && (
          <div className="d-flex align-items-center gap-3" ref={menuRef}>
            <div className="text-white-50 small d-none d-sm-inline">Sesion activa</div>
            <button
              type="button"
              className="btn btn-light btn-sm d-flex align-items-center gap-2 dual-user-button"
              onClick={() => setOpenMenu((prev) => !prev)}
            >
              <span className={`badge ${badgeClassName} text-white`}>{badgeText}</span>
              <span className="text-dark dual-user-name">{displayName}</span>
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
