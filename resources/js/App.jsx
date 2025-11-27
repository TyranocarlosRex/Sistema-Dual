import React from 'react';
import 'bootstrap/dist/css/bootstrap.css'
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import StudentLogin from './components/Auth/StudentLogin';
import CoordinatorLogin from './components/Auth/CoordinatorLogin';
import StudentsHome from './components/StudentsPage/StudentsHome';
import StudentReport from './components/StudentsPage/Reports/StudentReport';
import StudentLayout from './components/Layout/StudentLayout';
import CoordinatorHome from './components/CoordinatorPage/CoordinatorHome';
import CoordinatorLayout from './components/Layout/CoordinatorLayout';
import AdminLogin from './components/Auth/AdminLogin';

import CoordinatorUsers from './components/CoordinatorPage/Users/CoordinatorUsers';
import AdminLayout from './components/Layout/AdminLayout';
import AdministratorHome from "./components/AdministratorPage/AdministratorHome";
import AdministratorUsers from "./components/AdministratorPage/Users/AdministratorUsers";
import AdministratorTracking from "./components/AdministratorPage/Tracking/AdministratorTracking";
import AdministratorReports from './components/AdministratorPage/Evidences/Reports/AdministratorReports';
import AdministratorEvidences from './components/AdministratorPage/Evidences/AdministratorEvidences'
import CoordinatorTracking from './components/CoordinatorPage/Tracking/CoordinatorTracking';

const safeParse = (raw) => {
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const RequireAdmin = ({ children }) => {
  const token = localStorage.getItem('token');
  const admin = safeParse(localStorage.getItem('admin'));
  if (!token || !admin) {
    return <Navigate to="/login-admin" replace />;
  }
  return children;
};

const RequireCoordinator = ({ children }) => {
  const token = localStorage.getItem('token');
  const coordinator = safeParse(localStorage.getItem('coordinator'));
  if (!token || !coordinator) {
    return <Navigate to="/login-coordinador" replace />;
  }
  return children;
};

const RequireStudent = ({ children }) => {
  const token = localStorage.getItem('token');
  const student = safeParse(localStorage.getItem('student'));
  if (!token || !student) {
    return <Navigate to="/" replace />;
  }
  return children;
};

const root = document.getElementById('root');

if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <Router>
        <Routes>
          {/* Login */}
          <Route path="/" element={<StudentLogin />} />
          <Route path="/login-coordinador" element={<CoordinatorLogin />} />
          <Route path="/login-admin" element={<AdminLogin />} />

          {/* Estudiantes */}
          <Route element={<RequireStudent><StudentLayout /></RequireStudent>}>
            <Route path="/students-home" element={<StudentsHome />} />
            <Route path="/student-report" element={<StudentReport />} />
          </Route>

          {/* Coordinadores */}
          <Route element={<RequireCoordinator><CoordinatorLayout/></RequireCoordinator>}>
            <Route path="/coordinator-home" element={<CoordinatorHome />} />
            <Route path="/coordinator-users" element={<CoordinatorUsers />} />
            <Route path="/coordinator-tracking" element={<CoordinatorTracking />} />
          </Route>
          {/* Administrador */}
          <Route element={<RequireAdmin><AdminLayout/></RequireAdmin>}>
            <Route path="/administrator-home" element={<AdministratorHome />} />
            <Route path="/administrator-users" element={<AdministratorUsers />} />
            <Route path="/administrator-tracking" element={<AdministratorTracking />} />
            <Route path="/administrator-evidence" element={<AdministratorEvidences/>} />
            <Route path="/administrator-report" element={<AdministratorReports/>} />
          </Route>
        </Routes>
      </Router>
    </React.StrictMode>,
  );
}
