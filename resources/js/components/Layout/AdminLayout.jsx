import Navbar from "../AdministratorPage/Bars/AdministratorNavbar";
import Sidebar from "../AdministratorPage/Bars/AdministratorSidebar";
import { Outlet } from "react-router-dom";

export default function AdminLayout() {
  return (
    <>
      <Navbar />
      <div className="d-flex">
        <Sidebar />
        <div className="flex-grow-1 p-3">
          <Outlet />
        </div>
      </div>
    </>
  );
}