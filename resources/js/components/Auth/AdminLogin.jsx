import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Auth.css';
import { APP_ROUTES } from '../../routes';
import { getLoginErrorMessage } from '../../utils/errorMessages';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const { data } = await axios.post('/api/auth/login/admin', { email, password });

      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('student');
      localStorage.removeItem('coordinator');
      localStorage.removeItem('admin');

      // Soporta varias llaves de token (back viejo/nuevo)
      const token =
        data.access_token ??
        data.token ??
        data.plainTextToken ??
        null;

      if (!token) {
        setError('No recibimos la confirmacion de acceso. Intenta iniciar sesion nuevamente.');
        return;
      }

      localStorage.setItem('token', token);

      // Guarda user y admin de forma robusta
      localStorage.setItem('user', JSON.stringify(data.user ?? null));

      localStorage.setItem('admin', JSON.stringify(
        data.admin ?? data.user?.admin ?? null
      ));

      navigate(APP_ROUTES.admin.home, { replace: true });
    } catch (err) {
      setError(getLoginErrorMessage(err));
    }
  };

  return (
    <div className="login-container">
      <main className="login-shell">
        <section className="simple-banner" aria-label="Programa de Educación Dual">
          <h1>Programa de Educación Dual</h1>
          <p>Acceso a plataforma - Administradores</p>
        </section>

        <section className="login-panel" aria-label="Inicio de sesión para administradores">
          <div className="tabs">
            <button
              type="button"
              className="tab"
              onClick={() => navigate(APP_ROUTES.auth.studentLogin)}
            >
              Estudiantes
            </button>
            <button
              type="button"
              className="tab"
              onClick={() => navigate(APP_ROUTES.auth.coordinatorLogin)}
            >
              Coordinadores
            </button>
            <button type="button" className="tab active" aria-current="page">
              Administrativos
            </button>
          </div>

          {error && (
            <div className="login-error" role="alert">
              <strong>No pudimos iniciar sesion</strong>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="admin-email">Usuario (correo)</label>
              <input
                id="admin-email"
                name="email"
                type="text"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="admin-password">Contraseña</label>
              <input
                id="admin-password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="login-button">Entrar</button>
          </form>
        </section>
      </main>
    </div>
  );
};

export default AdminLogin;
