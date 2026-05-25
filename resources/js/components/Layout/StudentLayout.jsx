import Navbar from "../StudentsPage/Bars/StudentsNavbar";
import StudentSidebar from "../StudentsPage/Bars/StudentSidebar";
import { Outlet, useNavigate } from "react-router-dom";
import { APP_ROUTES } from "../../routes";

const safeJSON = (raw) => {
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export default function AppLayout() {
  const navigate = useNavigate();
  const user = safeJSON(localStorage.getItem("user"));
  const student = safeJSON(localStorage.getItem("student"));
  const displayName =
    `${student?.Nombre ?? ""} ${student?.Apellidos ?? ""}`.trim() ||
    student?.name ||
    user?.name ||
    "Estudiante";
  const email = user?.email || student?.Correo || student?.correo;

  return (
    <>
      <Navbar />
      <div className="d-flex" style={{ minHeight: "100vh", background: "#f5f7fb" }}>
        <StudentSidebar
          displayName={displayName}
          email={email}
          onUploadEvidence={() => navigate(APP_ROUTES.student.evidences)}
          onOpenNextReport={() => navigate(APP_ROUTES.student.evidences)}
          hasEvidences
        />
        <div className="flex-grow-1 p-4 p-md-5">
          <Outlet />
        </div>
      </div>
    </>
  );
}
