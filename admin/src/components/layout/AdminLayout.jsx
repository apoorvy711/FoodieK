import { Outlet, useNavigate } from "react-router-dom";
import { useState } from "react";
import toast from "react-hot-toast";
import { useAdminAuth } from "../../auth/AdminAuthContext";
import AdminSidebar from "../sidebar/AdminSidebar";
import AdminNavbar from "../navbar/AdminNavbar";

const AdminLayout = () => {
  const auth = useAdminAuth();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = async () => {
    await auth.logout();
    toast.success("Logged out successfully");
    navigate("/login");
  };

  return (
    <div className="admin-shell">
      <AdminSidebar isCollapsed={isCollapsed} onLogout={handleLogout} />

      <div className="admin-main-shell">
        <AdminNavbar
          isCollapsed={isCollapsed}
          onToggleSidebar={() => setIsCollapsed((previous) => !previous)}
        />

        <main className="admin-main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
