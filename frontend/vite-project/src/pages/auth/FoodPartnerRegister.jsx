import { Link, useLocation, useNavigate } from "react-router-dom";
import "../../styles/auth-shared.css";
import toast from "react-hot-toast";
import api from "../../api/api";
import { useAuth } from "../../auth/AuthContext";

const FoodPartnerRegister = () => {
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

    const name = e.target.name.value;
    const contactName = e.target.contactName.value;
    const phone = e.target.phone.value;
    const address = e.target.address.value;
    const email = e.target.email.value;
    const password = e.target.password.value;
    const avatar = e.target.avatar.value;
    const coverImage = e.target.coverImage.value;

    try {
      const response = await api.post("/auth/food-partner/register", {
        name,
        contactName,
        phone,
        address,
        email,
        password,
        avatar,
        coverImage,
      });

      await refreshAuth();
      toast.success(response.data.message || "Food partner account created");

      if (redirectTo) {
        navigate(redirectTo, { replace: true });
        return;
      }

      await goToPartnerProfile(response.data?.foodPartner);
    } catch (error) {
      const message =
        error?.response?.data?.message || "Food partner registration failed";
      toast.error(message);
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div
        className="auth-card"
        role="region"
        aria-labelledby="partner-register-title"
      >
        <header>
          <h1 id="partner-register-title" className="auth-title">
            Register your kitchen
          </h1>
          <p className="auth-subtitle">
            Create a food partner account to start listing meals and serving
            customers.
          </p>
        </header>
        <nav className="auth-alt-action" style={{ marginTop: "-4px" }}>
          <strong style={{ fontWeight: 600 }}>Switch:</strong>{" "}
          <Link to="/user/register">User</Link> •{" "}
          <Link to="/food-partner/register">Food partner</Link>
        </nav>
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="two-col">
            <div className="field-group">
              <label htmlFor="name">Restaurant Name</label>
              <input
                id="name"
                name="name"
                placeholder="Tasty Bites"
                autoComplete="organization"
              />
            </div>
            <div className="field-group">
              <label htmlFor="contactName">Contact Name</label>
              <input
                id="contactName"
                name="contactName"
                placeholder="Ava Johnson"
                autoComplete="name"
              />
            </div>
          </div>
          <div className="field-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="business@example.com"
              autoComplete="email"
            />
          </div>
          <div className="field-group">
            <label htmlFor="phone">Phone</label>
            <input
              id="phone"
              name="phone"
              type="tel"
              placeholder="+1 234 567 890"
              autoComplete="tel"
            />
          </div>
          <div className="field-group">
            <label htmlFor="address">Address</label>
            <input
              id="address"
              name="address"
              placeholder="123 Main St, City"
              autoComplete="street-address"
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
          <div className="field-group">
            <label htmlFor="avatar">Restaurant Avatar URL (Optional)</label>
            <input
              id="avatar"
              name="avatar"
              type="url"
              placeholder="https://..."
              autoComplete="url"
            />
          </div>
          <div className="field-group">
            <label htmlFor="coverImage">Cover Image URL (Optional)</label>
            <input
              id="coverImage"
              name="coverImage"
              type="url"
              placeholder="https://..."
              autoComplete="url"
            />
          </div>
          <button className="auth-submit" type="submit">
            Create Account
          </button>
        </form>
        <div className="auth-alt-action">
          Already have an account? <Link to="/food-partner/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
};

export default FoodPartnerRegister;
