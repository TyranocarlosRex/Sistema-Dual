import React from 'react';
import 'bootstrap/dist/css/bootstrap.css'
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom';

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
import AdministratorPeriods from "./components/AdministratorPage/Periods/AdministratorPeriods";
import AdministratorUsers from "./components/AdministratorPage/Users/AdministratorUsers";
import AdministratorTracking from "./components/AdministratorPage/Tracking/AdministratorTracking";
import AdministratorReports from './components/AdministratorPage/Evidences/Reports/AdministratorReports';
import AdministratorEvidences from './components/AdministratorPage/Evidences/AdministratorEvidences'
import AdministratorDocumentImports from './components/AdministratorPage/Documents/AdministratorDocumentImports';
import CoordinatorTracking from './components/CoordinatorPage/Tracking/CoordinatorTracking';
import CoordinatorPending from './components/CoordinatorPage/Tracking/CoordinatorPending';
import AdministratirAdvertisements from "./components/AdministratorPage/Advertisements/AdministratirAdvertisements";
import StudentDetails from './components/Shared/StudentDetails';
import { ToastProvider } from "./components/Shared/ToastProvider";
import { APP_ROUTES } from './routes';

const safeParse = (raw) => {
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const RedirectWithSearch = ({ to, searchParamMap = {} }) => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);

  Object.entries(searchParamMap).forEach(([from, target]) => {
    if (searchParams.has(from) && !searchParams.has(target)) {
      searchParams.set(target, searchParams.get(from));
      searchParams.delete(from);
    }
  });

  const search = searchParams.toString();

  return (
    <Navigate
      to={{
        pathname: to,
        search: search ? `?${search}` : "",
        hash: location.hash,
      }}
      replace
    />
  );
};

const RedirectStudentDetails = ({ to }) => {
  const { id } = useParams();
  const location = useLocation();

  return (
    <Navigate
      to={{
        pathname: to(id),
        search: location.search,
        hash: location.hash,
      }}
      replace
    />
  );
};

const RequireAdmin = ({ children }) => {
  const token = localStorage.getItem('token');
  const admin = safeParse(localStorage.getItem('admin'));
  if (!token || !admin) {
    return <Navigate to={APP_ROUTES.auth.adminLogin} replace />;
  }
  return children;
};

const RequireCoordinator = ({ children }) => {
  const token = localStorage.getItem('token');
  const coordinator = safeParse(localStorage.getItem('coordinator'));
  if (!token || !coordinator) {
    return <Navigate to={APP_ROUTES.auth.coordinatorLogin} replace />;
  }
  return children;
};

const RequireStudent = ({ children }) => {
  const token = localStorage.getItem('token');
  const student = safeParse(localStorage.getItem('student'));
  if (!token || !student) {
    return <Navigate to={APP_ROUTES.auth.studentLogin} replace />;
  }
  return children;
};

const root = document.getElementById('root');

if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <ToastProvider>
        <Router>
          <Routes>
            {/* Login */}
            <Route path="/" element={<RedirectWithSearch to={APP_ROUTES.auth.studentLogin} />} />
            <Route path={APP_ROUTES.auth.studentLogin} element={<StudentLogin />} />
            <Route path={APP_ROUTES.auth.coordinatorLogin} element={<CoordinatorLogin />} />
            <Route path={APP_ROUTES.auth.adminLogin} element={<AdminLogin />} />

            {/* Redirecciones de URLs anteriores */}
            <Route path="/login-coordinador" element={<RedirectWithSearch to={APP_ROUTES.auth.coordinatorLogin} />} />
            <Route path="/iniciar-sesion" element={<RedirectWithSearch to={APP_ROUTES.auth.studentLogin} />} />
            <Route path="/coordinador/iniciar-sesion" element={<RedirectWithSearch to={APP_ROUTES.auth.coordinatorLogin} />} />
            <Route path="/administrador/iniciar-sesion" element={<RedirectWithSearch to={APP_ROUTES.auth.adminLogin} />} />
            <Route path="/students-home" element={<RedirectWithSearch to={APP_ROUTES.student.home} />} />
            <Route
              path="/student-report"
              element={
                <RedirectWithSearch
                  to={APP_ROUTES.student.evidences}
                  searchParamMap={{ evidence: "evidencia" }}
                />
              }
            />
            <Route path="/coordinator-home" element={<RedirectWithSearch to={APP_ROUTES.coordinator.home} />} />
            <Route path="/coordinator-users" element={<RedirectWithSearch to={APP_ROUTES.coordinator.users} />} />
            <Route path="/coordinator-tracking" element={<RedirectWithSearch to={APP_ROUTES.coordinator.tracking} />} />
            <Route path="/coordinator-pending" element={<RedirectWithSearch to={APP_ROUTES.coordinator.pending} />} />
            <Route path="/student-details/:id" element={<RedirectStudentDetails to={APP_ROUTES.coordinator.studentDetails} />} />
            <Route path="/administrator-home" element={<RedirectWithSearch to={APP_ROUTES.admin.home} />} />
            <Route path="/administrator-periods" element={<RedirectWithSearch to={APP_ROUTES.admin.periods} />} />
            <Route path="/administrator-users" element={<RedirectWithSearch to={APP_ROUTES.admin.users} />} />
            <Route path="/administrator/students/:id" element={<RedirectStudentDetails to={APP_ROUTES.admin.studentDetails} />} />
            <Route path="/administrator-tracking" element={<RedirectWithSearch to={APP_ROUTES.admin.tracking} />} />
            <Route path="/administrator-evidence" element={<RedirectWithSearch to={APP_ROUTES.admin.evidences} />} />
            <Route path="/administrator-report" element={<RedirectWithSearch to={APP_ROUTES.admin.reports} />} />
            <Route path="/administrator-documents" element={<RedirectWithSearch to={APP_ROUTES.admin.documents} />} />
            <Route path="/administrator-advertisements" element={<RedirectWithSearch to={APP_ROUTES.admin.advertisements} />} />

            {/* Estudiantes */}
            <Route element={<RequireStudent><StudentLayout /></RequireStudent>}>
              <Route path={APP_ROUTES.student.home} element={<StudentsHome />} />
              <Route path={APP_ROUTES.student.evidences} element={<StudentReport />} />
            </Route>

            {/* Coordinadores */}
            <Route element={<RequireCoordinator><CoordinatorLayout/></RequireCoordinator>}>
              <Route path={APP_ROUTES.coordinator.home} element={<CoordinatorHome />} />
              <Route path={APP_ROUTES.coordinator.users} element={<CoordinatorUsers />} />
              <Route path={APP_ROUTES.coordinator.tracking} element={<CoordinatorTracking />} />
              <Route path={APP_ROUTES.coordinator.pending} element={<CoordinatorPending />} />
              <Route path={APP_ROUTES.coordinator.studentDetails()} element={<StudentDetails />} />
            </Route>
            {/* Administrador */}
            <Route element={<RequireAdmin><AdminLayout/></RequireAdmin>}>
              <Route path={APP_ROUTES.admin.home} element={<AdministratorHome />} />
              <Route path={APP_ROUTES.admin.periods} element={<AdministratorPeriods />} />
              <Route path={APP_ROUTES.admin.users} element={<AdministratorUsers />} />
              <Route path={APP_ROUTES.admin.studentDetails()} element={<StudentDetails />} />
              <Route path={APP_ROUTES.admin.tracking} element={<AdministratorTracking />} />
              <Route path={APP_ROUTES.admin.evidences} element={<AdministratorEvidences/>} />
              <Route path={APP_ROUTES.admin.reports} element={<AdministratorReports/>} />
              <Route path={APP_ROUTES.admin.documents} element={<AdministratorDocumentImports />} />
              <Route path={APP_ROUTES.admin.advertisements} element={<AdministratirAdvertisements />} />
            </Route>
          </Routes>
        </Router>
      </ToastProvider>
    </React.StrictMode>,
  );
}

