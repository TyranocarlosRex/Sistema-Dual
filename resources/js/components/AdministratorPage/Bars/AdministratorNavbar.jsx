import AuthNavbar from "../../Shared/AuthNavbar";
import { APP_ROUTES } from "../../../routes";

const NAVBAR_STYLE = {
  background: "linear-gradient(135deg, #1d4ed8 0%, #1e293b 100%)",
  boxShadow: "0 10px 24px -18px rgba(29, 78, 216, 0.9)",
};

const getAdminName = (admin) => admin?.name || "Administrador";

export default function Navbar() {
  return (
    <AuthNavbar
      brand="Educacion Dual"
      subtitle="Panel administrador"
      to={APP_ROUTES.admin.home}
      style={NAVBAR_STYLE}
      badgeClassName="bg-primary"
      badgeText="AD"
      storageKey="admin"
      defaultName="Administrador"
      resolveName={getAdminName}
      logoutKeys={["coordinator", "admin"]}
    />
  );
}
