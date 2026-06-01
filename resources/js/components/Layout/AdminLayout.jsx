import Navbar from "../AdministratorPage/Bars/AdministratorNavbar";
import Sidebar from "../AdministratorPage/Bars/AdministratorSidebar";
import { Outlet } from "react-router-dom";
import "./layout.css";

export default function AdminLayout() {
  return (
    <>
      <Navbar />
      <div className="app-shell">
        <Sidebar />
        <div className="app-content flex-grow-1 p-3">
          <Outlet />
        </div>
      </div>
    </>
  );
}
