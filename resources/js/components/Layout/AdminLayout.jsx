import Navbar from "../AdminPage/Bars/AdminNavbar";
import Sidebar from "../AdminPage/Bars/AdminSidebar";
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