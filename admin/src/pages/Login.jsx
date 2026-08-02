import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAdminAuth } from "../auth/AdminAuthContext";

const Login = () => {
  const auth = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectTo = location.state?.from || "/";

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const email = event.target.email.value.trim();
    const password = event.target.password.value;

    if (!email || !password) {
      toast.error("Email and password are required");
      return;
    }

    setLoading(true);

    try {
      await auth.login({ email, password });
      toast.success("Admin login successful");
      navigate(redirectTo, { replace: true });
    } catch (error) {
      toast.error(error?.message || "Admin login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="admin-login-page">
      <section className="admin-login-card">
        <h1>Admin Login</h1>
        <p>Sign in with your admin account to access operations dashboard.</p>

        <form className="admin-login-form" onSubmit={handleSubmit}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="admin@example.com"
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="Password"
          />

          <button type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </section>
    </main>
  );
};

export default Login;
