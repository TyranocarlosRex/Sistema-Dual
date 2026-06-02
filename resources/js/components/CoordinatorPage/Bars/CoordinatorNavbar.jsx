import AuthNavbar from "../../Shared/AuthNavbar";
import { APP_ROUTES } from "../../../routes";

const NAVBAR_STYLE = {
  background: "linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%)",
  boxShadow: "0 10px 24px -18px rgba(6, 182, 212, 0.6)",
};

const getCoordinatorName = (coordinator, user) =>
  coordinator?.Nombre || coordinator?.name || user?.name || "Coordinador";

export default function Navbar() {
  return (
    <AuthNavbar
      brand="Educacion Dual"
      subtitle="Panel coordinador"
      to={APP_ROUTES.coordinator.home}
      style={NAVBAR_STYLE}
      badgeClassName="bg-info"
      badgeText="CO"
      storageKey="coordinator"
      defaultName="Coordinador"
      resolveName={getCoordinatorName}
      logoutKeys={["coordinator"]}
    />
  );
}
