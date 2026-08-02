import { Link, NavLink } from "react-router-dom";

const navItems = [
  { to: "/", label: "Dashboard" },
  { to: "/restaurant-requests", label: "Restaurant Requests" },
  { to: "/restaurants", label: "Restaurants" },
  { to: "/users", label: "Users" },
  { to: "/orders", label: "Orders" },
  { to: "/announcements", label: "Announcements" },
  { to: "/profile", label: "Profile" },
];

const AdminSidebar = ({ isCollapsed, onLogout }) => {
  return (
    <aside className={`admin-sidebar ${isCollapsed ? "is-collapsed" : ""}`}>
      <div className="admin-sidebar-brand">
        <Link to="/" className="admin-brand-link">
          <span className="admin-brand-mark">FK</span>
          {!isCollapsed && <span>FoodieK Admin</span>}
        </Link>
      </div>

      <nav className="admin-sidebar-nav" aria-label="Admin navigation">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              `admin-sidebar-link ${isActive ? "is-active" : ""}`
            }
          >
            <span>{item.label}</span>
          </NavLink>
        ))}

        <button
          type="button"
          className="admin-sidebar-link admin-sidebar-link--button"
          onClick={onLogout}
        >
          <span>Logout</span>
        </button>
      </nav>
    </aside>
  );
};

export default AdminSidebar;
