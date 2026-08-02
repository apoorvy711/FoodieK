import {
  BrowserRouter as Router,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { useEffect } from "react";
import { Toaster } from "react-hot-toast";
import { AdminAuthProvider, useAdminAuth } from "../auth/AdminAuthContext";
import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import RestaurantRequests from "../pages/RestaurantRequests";
import RestaurantRequestDetails from "../pages/RestaurantRequestDetails";
import Restaurants from "../pages/Restaurants";
import Users from "../pages/Users";
import Orders from "../pages/Orders";
import Announcements from "../pages/Announcements";
import Profile from "../pages/Profile";
import AdminLayout from "../components/layout/AdminLayout";
import LoadingScreen from "../components/common/LoadingScreen";

const titleMap = [
  {
    matcher: (pathname) => pathname === "/login",
    title: "Admin Login | FoodieK",
  },
  {
    matcher: (pathname) => pathname === "/",
    title: "Dashboard | FoodieK Admin",
  },
  {
    matcher: (pathname) => pathname.startsWith("/restaurant-requests"),
    title: "Restaurant Requests | FoodieK Admin",
  },
  {
    matcher: (pathname) => pathname === "/restaurants",
    title: "Restaurants | FoodieK Admin",
  },
  {
    matcher: (pathname) => pathname === "/users",
    title: "Users | FoodieK Admin",
  },
  {
    matcher: (pathname) => pathname === "/orders",
    title: "Orders | FoodieK Admin",
  },
  {
    matcher: (pathname) => pathname === "/announcements",
    title: "Announcements | FoodieK Admin",
  },
  {
    matcher: (pathname) => pathname === "/profile",
    title: "Profile | FoodieK Admin",
  },
];

const RouteMeta = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const match = titleMap.find((entry) => entry.matcher(pathname));
    document.title = match?.title || "FoodieK Admin";
  }, [pathname]);

  return null;
};

const AdminProtectedOutlet = () => {
  const auth = useAdminAuth();
  const location = useLocation();

  if (!auth.authResolved) {
    return <LoadingScreen message="Checking admin session..." />;
  }

  if (!auth.isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }

  return <Outlet />;
};

const LoginRoute = () => {
  const auth = useAdminAuth();

  if (!auth.authResolved) {
    return <LoadingScreen message="Checking admin session..." />;
  }

  if (auth.isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Login />;
};

const AppRoutes = () => {
  return (
    <Router>
      <AdminAuthProvider>
        <RouteMeta />
        <Toaster position="top-right" />
        <Routes>
          <Route path="/login" element={<LoginRoute />} />

          <Route element={<AdminProtectedOutlet />}>
            <Route element={<AdminLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route
                path="/restaurant-requests"
                element={<RestaurantRequests />}
              />
              <Route
                path="/restaurant-requests/:id"
                element={<RestaurantRequestDetails />}
              />
              <Route path="/restaurants" element={<Restaurants />} />
              <Route path="/users" element={<Users />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/announcements" element={<Announcements />} />
              <Route path="/profile" element={<Profile />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AdminAuthProvider>
    </Router>
  );
};

export default AppRoutes;
