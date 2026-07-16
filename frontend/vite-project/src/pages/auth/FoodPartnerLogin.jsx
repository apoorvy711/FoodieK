import "../../styles/auth-shared.css";
import { Link, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../api/api";
import { useAuth } from "../../auth/AuthContext";

const FoodPartnerLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshAuth } = useAuth();

  const redirectTo = location.state?.from;

  const goToPartnerProfile = async (foodPartner) => {
    if (foodPartner?._id) {
      navigate("/food-partner/account");
      return;
    }

    try {
      const meResponse = await api.get("/auth/food-partner/me");
      const mePartnerId = meResponse.data?.foodPartner?._id;
      if (mePartnerId) {
        navigate("/food-partner/account");
        return;
      }
    } catch (error) {
      // Ignore fallback failures and use create-food as a safe default.
    }

    navigate("/create-food");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const email = e.target.email.value;
    const password = e.target.password.value;

    try {
      const response = await api.post("/auth/food-partner/login", {
        email,
        password,
      });

      await refreshAuth();
      toast.success(response.data.message || "Partner signed in successfully");

      if (redirectTo) {
        navigate(redirectTo, { replace: true });
        return;
      }

      await goToPartnerProfile(response.data?.foodPartner);
    } catch (error) {
      const message = error?.response?.data?.message || "Partner login failed";
      toast.error(message);
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div
        className="auth-card"
        role="region"
        aria-labelledby="partner-login-title"
      >
        <header>
          <h1 id="partner-login-title" className="auth-title">
            Partner login
          </h1>
          <p className="auth-subtitle">
            Access your dashboard and manage orders.
          </p>
        </header>
        <form
          className="auth-form"
          onSubmit={handleSubmit}
          noValidate
          autoComplete="off"
        >
          <div className="field-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="business@example.com"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
            />
          </div>
          <div className="field-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Password"
              autoComplete="new-password"
            />
          </div>
          <button className="auth-submit" type="submit">
            Sign In
          </button>
        </form>
        <div className="auth-alt-action">
          New partner?{" "}
          <Link to="/food-partner/register">Create an account</Link>
        </div>
      </div>
    </div>
  );
};

export default FoodPartnerLogin;
