import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Auth.css';
import { APP_ROUTES } from '../../routes';
import { getLoginErrorMessage } from '../../utils/errorMessages';

const StudentLogin = () => {
  const [noControl, setNoControl] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const { data } = await axios.post('/api/auth/login/student', {
        no_control: noControl,
        password,
      });

      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('student');
      localStorage.removeItem('admin');
      localStorage.removeItem('coordinator');

      const token = data.token ?? data.access_token; // soporta ambos
      if (token) {
        localStorage.setItem('token', token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } else {
        localStorage.removeItem('token');
        setError('No recibimos la confirmacion de acceso. Intenta iniciar sesion nuevamente.');
        return;
      }
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      } else {
        localStorage.removeItem('user');
      }
      if (data.student) {
        localStorage.setItem('student', JSON.stringify(data.student));
      } else {
        localStorage.removeItem('student');
      }

      navigate(APP_ROUTES.student.home, { replace: true });
    } catch (err) {
      setError(getLoginErrorMessage(err));
    }
  };

  return (
    <div className="login-container">
      <main className="login-shell">
        <section className="simple-banner" aria-label="Programa de Educación Dual">
          <h1>Programa de Educación Dual</h1>
          <p>Acceso a plataforma - Estudiantes</p>
        </section>

        <section className="login-panel" aria-label="Inicio de sesión para estudiantes">
          <div className="tabs">
            <button type="button" className="tab active" aria-current="page">
              Estudiantes
            </button>
            <button
              type="button"
              className="tab"
              onClick={() => navigate(APP_ROUTES.auth.coordinatorLogin)}
            >
              Coordinadores
            </button>
            <button
              type="button"
              className="tab"
              onClick={() => navigate(APP_ROUTES.auth.adminLogin)}
            >
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
              <label htmlFor="student-no-control">No. de Control</label>
              <input
                id="student-no-control"
                name="no_control"
                type="text"
                inputMode="numeric"
                pattern="\d*"
                autoComplete="username"
                value={noControl}
                onChange={(e) => setNoControl(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="student-password">Contraseña</label>
              <input
                id="student-password"
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

export default StudentLogin;
