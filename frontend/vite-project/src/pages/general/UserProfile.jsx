import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/api";
import { resolveMediaUrl } from "../../utils/media";

const UserProfile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const response = await api.get("/auth/user/me");
      setUser(response.data.user);
    } catch (error) {
      setUser({
        fullName: "Aarav Sharma",
        email: "aarav@foodiek.com",
        avatar: "/media/hero.png",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="loading-screen">
        <h2>Loading profile...</h2>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <section className="profile-header">
        <div className="profile-meta">
          <img
            className="profile-avatar"
            src={resolveMediaUrl(user?.avatar, "/media/hero.png")}
            alt="User avatar"
          />
          <div className="profile-info">
            <h1 className="profile-business">
              {user?.fullName || "FoodieK User"}
            </h1>
            <p className="profile-address">{user?.email}</p>
          </div>
        </div>

        <div className="profile-stats">
          <div className="profile-stat">
            <span className="profile-stat-label">Saved</span>
            <span className="profile-stat-value">6</span>
          </div>
          <div className="profile-stat">
            <span className="profile-stat-label">Orders</span>
            <span className="profile-stat-value">08</span>
          </div>
        </div>
      </section>

      <section className="profile-grid profile-grid--compact">
        <Link to="/saved" className="glass-card profile-tile">
          Saved Videos
        </Link>
        <Link to="/orders" className="glass-card profile-tile">
          Orders
        </Link>
        <Link to="/cart" className="glass-card profile-tile">
          Cart
        </Link>
        <Link to="/checkout" className="glass-card profile-tile">
          Addresses
        </Link>
        <Link to="/checkout" className="glass-card profile-tile">
          Coupons
        </Link>
        <Link to="/notifications" className="glass-card profile-tile">
          Settings
        </Link>
        <Link to="/admin" className="glass-card profile-tile">
          Admin
        </Link>
      </section>
    </div>
  );
};

export default UserProfile;
