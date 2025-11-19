import React from 'react';
import 'bootstrap/dist/css/bootstrap.css'
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import StudentLogin from './components/Auth/StudentLogin';
import CoordinatorLogin from './components/Auth/CoordinatorLogin';
import StudentsHome from './components/StudentsPage/StudentsHome';
import EnRoll from './components/StudentsPage/enRoll';
import StudentLayout from './components/Layout/StudentLayout';
import CoordinatorHome from './components/CoordinatorPage/CoordinatorHome';
import CoordinatorLayout from './components/Layout/CoordinatorLayout';
import AdminLogin from './components/Auth/AdminLogin';

import CoordinatorUsers from './components/CoordinatorPage/Users/CoordinatorUsers';
import CoordinatorReports from './components/CoordinatorPage/Reports/CoordinatorReports';
import StudentsList from "./components/CoordinatorPage/Documents/StudentsList";
import GestionDocumentos from "./components/CoordinatorPage/Documents/GestionDocumentos";
import DocumentsManager from "./components/CoordinatorPage/Documents/DocumentsManager";
import UtilitiesLetterhead from "./components/CoordinatorPage/Documents/Utilities/UtilitiesLetterhead";
import ListaProcesos from "./components/CoordinatorPage/Procesos/ListaProcesos";
import AdminLayout from './components/Layout/AdminLayout';
import AdminHome from "./components/AdministratorPage/AdministratorHome";
import AdministratorUsers from "./components/AdministratorPage/Users/AdministratorUsers";
import AdministratorTracking from "./components/AdministratorPage/Tracking/AdministratorTracking";


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
          <Route element={<StudentLayout />}>
            <Route path="/students-home" element={<StudentsHome />} />
            <Route path="/inscripcion" element={<EnRoll />} />
          </Route>

          {/* Coordinadores */}
          <Route element={<CoordinatorLayout/>}>
            <Route path="/coordinator-home" element={<CoordinatorHome />} />
            <Route path="/coordinator-users" element={<CoordinatorUsers />} />
            <Route path="/coordinator-reports" element={<CoordinatorReports />} />
            <Route path="/coordinator-students" element={<StudentsList />} />
            <Route path="/coordinator-documents/gestion" element={<GestionDocumentos />} />
            
            {/* Módulo de Procesos */}
            <Route path="/procesos" element={<ListaProcesos />} />
            <Route path="/coordinator-documents/gestionar" element={<DocumentsManager />} />
            <Route path="/coordinator-utilities/letterhead" element={<UtilitiesLetterhead />} />
          </Route>
          {/* Administrador */}
          <Route element={<AdminLayout/>}>
            <Route path="/administrator-home" element={<AdminHome />} />
            <Route path="/administrator-users" element={<AdministratorUsers />} />
            <Route path="/administrator-tracking" element={<AdministratorTracking />} />
            <Route path="/administrator-students" element={<StudentsList />} />
            <Route path="/administrator-documents/gestion" element={<GestionDocumentos />} />
            <Route path="/administrator-documents/gestionar" element={<DocumentsManager />} />
            <Route path="/administrator-utilities/letterhead" element={<UtilitiesLetterhead />} />
            <Route path="/administrador/procesos" element={<ListaProcesos />} />
          </Route>
        </Routes>
      </Router>
    </React.StrictMode>,
  );
}
