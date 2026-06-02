import AuthNavbar from "../../Shared/AuthNavbar";
import { APP_ROUTES } from "../../../routes";

const NAVBAR_STYLE = {
  background: "linear-gradient(135deg, #22c55e 0%, #15803d 100%)",
  boxShadow: "0 10px 24px -18px rgba(34, 197, 94, 0.55)",
  position: "sticky",
  top: 0,
  zIndex: 1030,
};

const getStudentName = (student, user) => {
  const fullName = `${student?.Nombre ?? ""} ${student?.Apellidos ?? ""}`.trim();
  return fullName || student?.name || user?.name || "Estudiante";
};

export default function Navbar() {
  return (
    <AuthNavbar
      brand="Sistema Dual"
      subtitle="Panel estudiante"
      to={APP_ROUTES.student.home}
      style={NAVBAR_STYLE}
      badgeClassName="bg-success"
      badgeText="ES"
      storageKey="student"
      defaultName="Estudiante"
      resolveName={getStudentName}
      logoutKeys={["student"]}
    />
  );
}
