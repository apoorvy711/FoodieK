import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import UserRegister from "../pages/auth/UserRegister";
import ChooseRegister from "../pages/auth/ChooseRegister";
import UserLogin from "../pages/auth/UserLogin";
import FoodPartnerRegister from "../pages/auth/FoodPartnerRegister";
import FoodPartnerLogin from "../pages/auth/FoodPartnerLogin";
import Home from "../pages/general/Home";
import Saved from "../pages/general/Saved";
import FoodDetail from "../pages/general/FoodDetail";
import Notifications from "../pages/general/Notifications";
import Cart from "../pages/general/Cart";
import Checkout from "../pages/general/Checkout";
import Orders from "../pages/general/Orders";
import ProfileHub from "../pages/general/ProfileHub";
import BottomNav from "../components/BottomNav";
import CreateFood from "../pages/food-partner/CreateFood";
import Profile from "../pages/food-partner/Profile";
import Account from "../pages/food-partner/Account";
import AdminDashboard from "../pages/admin/Dashboard";
import NotFound from "../pages/general/NotFound";
import { AuthProvider } from "../auth/AuthContext";
import {
  AdminProtectedRoute,
  CustomerProtectedRoute,
  FoodPartnerProtectedRoute,
} from "../components/auth/ProtectedRoute";

const AppRoutes = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/register" element={<ChooseRegister />} />
          <Route path="/user/register" element={<UserRegister />} />
          <Route path="/user/login" element={<UserLogin />} />
          <Route
            path="/food-partner/register"
            element={<FoodPartnerRegister />}
          />
          <Route path="/food-partner/login" element={<FoodPartnerLogin />} />
          <Route
            path="/"
            element={
              <>
                <Home />
                <BottomNav />
              </>
            }
          />
          <Route
            path="/saved"
            element={
              <CustomerProtectedRoute>
                <>
                  <Saved />
                  <BottomNav />
                </>
              </CustomerProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <CustomerProtectedRoute>
                <>
                  <Notifications />
                  <BottomNav />
                </>
              </CustomerProtectedRoute>
            }
          />
          <Route
            path="/cart"
            element={
              <CustomerProtectedRoute>
                <>
                  <Cart />
                  <BottomNav />
                </>
              </CustomerProtectedRoute>
            }
          />
          <Route
            path="/checkout"
            element={
              <CustomerProtectedRoute>
                <>
                  <Checkout />
                  <BottomNav />
                </>
              </CustomerProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <CustomerProtectedRoute>
                <>
                  <Orders />
                  <BottomNav />
                </>
              </CustomerProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <>
                <ProfileHub />
                <BottomNav />
              </>
            }
          />
          <Route
            path="/create-food"
            element={
              <FoodPartnerProtectedRoute>
                <CreateFood />
              </FoodPartnerProtectedRoute>
            }
          />
          <Route
            path="/food-partner/account"
            element={
              <FoodPartnerProtectedRoute>
                <Account />
              </FoodPartnerProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminProtectedRoute>
                <AdminDashboard />
              </AdminProtectedRoute>
            }
          />
          <Route path="/food/:id" element={<FoodDetail />} />
          <Route path="/food-partner/:id" element={<Profile />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default AppRoutes;
