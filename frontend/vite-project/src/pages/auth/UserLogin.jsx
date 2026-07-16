import "../../styles/auth-shared.css";
import { Link, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../api/api";
import { useAuth } from "../../auth/AuthContext";

const UserLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshAuth } = useAuth();

  const redirectTo = location.state?.from || "/";

  const handleSubmit = async (e) => {
    e.preventDefault();

    const email = e.target.email.value;
    const password = e.target.password.value;

    try {
      const response = await api.post("/auth/user/login", {
        email,
        password,
      });

      await refreshAuth();
      toast.success(response.data.message || "Signed in successfully");
      navigate(redirectTo, { replace: true });
    } catch (error) {
      const message = error?.response?.data?.message || "Login failed";
      toast.error(message);
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div
        className="auth-card"
        role="region"
        aria-labelledby="user-login-title"
      >
        <header>
          <h1 id="user-login-title" className="auth-title">
            Welcome back
          </h1>
          <p className="auth-subtitle">
            Sign in to continue your food journey.
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
              placeholder="you@example.com"
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
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </div>
          <button className="auth-submit" type="submit">
            Sign In
          </button>
        </form>
        <div className="auth-alt-action">
          New here? <Link to="/user/register">Create account</Link>
        </div>
      </div>
    </div>
  );
};

export default UserLogin;
