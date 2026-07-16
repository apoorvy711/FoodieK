import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../../auth/AuthContext";
import { resolveMediaUrl } from "../../utils/media";
import "../../styles/profile.css";
import "../../styles/profile-hub.css";

function GuestProfileView() {
  return (
    <main className="profile-page">
      <section className="profile-header guest-profile-card">
        <div className="guest-profile-hero">
          <div className="guest-profile-avatar" aria-hidden="true">
            FK
          </div>
          <div className="guest-profile-copy">
            <h1 className="profile-business">Welcome to FoodieK</h1>
            <p className="profile-address">
              Sign in to order your favourites, save dishes and manage your
              account.
            </p>
          </div>
        </div>

        <div className="guest-auth-sections">
          <article className="guest-auth-panel">
            <h2>For customers</h2>
            <p>Access your orders, saved dishes and checkout faster.</p>
            <div className="guest-auth-actions">
              <Link
                to="/user/login"
                className="guest-auth-btn guest-auth-btn--primary"
              >
                Login as User
              </Link>
              <Link
                to="/user/register"
                className="guest-auth-btn guest-auth-btn--secondary"
              >
                Create User Account
              </Link>
            </div>
          </article>

          <article className="guest-auth-panel guest-auth-panel--partner">
            <h2>Own a restaurant?</h2>
            <p>Join FoodieK and showcase your dishes to food lovers.</p>
            <div className="guest-auth-actions">
              <Link
                to="/food-partner/login"
                className="guest-auth-btn guest-auth-btn--primary"
              >
                Food Partner Login
              </Link>
              <Link
                to="/food-partner/register"
                className="guest-auth-btn guest-auth-btn--secondary"
              >
                Register Your Restaurant
              </Link>
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}

function UserProfileView({ user, onLogout }) {
  const avatarUrl = resolveMediaUrl(user?.avatar, "");

  return (
    <main className="profile-page">
      <section className="profile-header">
        <div className="profile-meta">
          {avatarUrl ? (
            <img className="profile-avatar" src={avatarUrl} alt="User avatar" />
          ) : (
            <div
              className="profile-avatar profile-avatar--placeholder"
              aria-hidden="true"
            >
              {user?.fullName?.[0] || "U"}
            </div>
          )}

          <div className="profile-info">
            <h1 className="profile-business">
              {user?.fullName || "FoodieK User"}
            </h1>
            <p className="profile-address">
              {user?.email || "No email available"}
            </p>
            {user?.phone && <p className="profile-address">{user.phone}</p>}
          </div>
        </div>

        <div className="profile-grid profile-grid--compact">
          <Link to="/orders" className="glass-card profile-tile">
            My Orders
          </Link>
          <Link to="/saved" className="glass-card profile-tile">
            Saved Foods
          </Link>
          <Link to="/notifications" className="glass-card profile-tile">
            My Activity
          </Link>
          <Link to="/cart" className="glass-card profile-tile">
            Cart
          </Link>
        </div>

        <button type="button" className="profile-logout-btn" onClick={onLogout}>
          Logout
        </button>
      </section>
    </main>
  );
}

function FoodPartnerProfileView({ foodPartner, onLogout }) {
  return (
    <main className="profile-page">
      <section className="profile-header">
        <div className="profile-meta">
          <div
            className="profile-avatar profile-avatar--placeholder"
            aria-hidden="true"
          >
            {foodPartner?.name?.[0] || "R"}
          </div>

          <div className="profile-info">
            <h1 className="profile-business">
              {foodPartner?.name || "Food Partner"}
            </h1>
            <p className="profile-address">{foodPartner?.email}</p>
            <p className="profile-address">{foodPartner?.address}</p>
            <p className="profile-address">{foodPartner?.contactName}</p>
          </div>
        </div>

        <div className="profile-grid profile-grid--compact">
          <Link to="/food-partner/account" className="glass-card profile-tile">
            Partner Dashboard
          </Link>
          <Link to="/create-food" className="glass-card profile-tile">
            Add New Dish
          </Link>
          {foodPartner?._id && (
            <Link
              to={`/food-partner/${foodPartner._id}`}
              className="glass-card profile-tile"
            >
              View Public Store
            </Link>
          )}
        </div>

        <button type="button" className="profile-logout-btn" onClick={onLogout}>
          Logout
        </button>
      </section>
    </main>
  );
}

const ProfileHub = () => {
  const auth = useAuth();
  const navigate = useNavigate();

  const onLogout = async () => {
    await auth.logoutCurrent();
    toast.success("Logged out successfully");
    navigate("/");
  };

  if (!auth.authResolved) {
    return (
      <div className="loading-screen">
        <h2>Loading account...</h2>
      </div>
    );
  }

  if (auth.isGuest) {
    return <GuestProfileView />;
  }

  if (auth.isFoodPartner) {
    return (
      <FoodPartnerProfileView
        foodPartner={auth.foodPartner}
        onLogout={onLogout}
      />
    );
  }

  return <UserProfileView user={auth.user} onLogout={onLogout} />;
};

export default ProfileHub;
