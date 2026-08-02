import { useAdminAuth } from "../../auth/AdminAuthContext";

const AdminNavbar = ({ onToggleSidebar, isCollapsed }) => {
  const auth = useAdminAuth();

  return (
    <header className="admin-navbar">
      <div className="admin-navbar-left">
        <button
          type="button"
          className="admin-sidebar-toggle"
          onClick={onToggleSidebar}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? "☰" : "✕"}
        </button>
        <div>
          <p className="admin-navbar-label">Admin Portal</p>
          <h1 className="admin-navbar-title">FoodieK Operations</h1>
        </div>
      </div>

      <div className="admin-navbar-right">
        <span className="admin-navbar-user">
          {auth.admin?.fullName || auth.admin?.email || "Admin"}
        </span>
      </div>
    </header>
  );
};

export default AdminNavbar;
