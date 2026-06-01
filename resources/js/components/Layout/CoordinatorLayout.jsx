import Navbar from "../CoordinatorPage/Bars/CoordinatorNavbar";
import Sidebar from "../CoordinatorPage/Bars/CoordinatorSidebar";
import { Outlet } from "react-router-dom";
import "./layout.css";

export default function CoordinatorLayout() {
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
