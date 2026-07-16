import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../api/api";

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = async () => {
    try {
      const [statsResponse, foodsResponse] = await Promise.all([
        api.get("/admin/dashboard"),
        api.get("/admin/foods"),
      ]);

      setStats(statsResponse.data.stats || null);
      setFoods(foodsResponse.data.foods || []);
    } catch (error) {
      toast.error("Admin access required");
      navigate("/user/login");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggleFood = async (id) => {
    try {
      await api.patch(`/admin/foods/${id}/toggle`);
      await load();
    } catch (error) {
      toast.error("Could not update food status");
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <h2>Loading admin dashboard...</h2>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <section className="profile-header">
        <div>
          <h1 className="profile-business">Admin Dashboard</h1>
          <p className="profile-address">Moderation and platform overview</p>
        </div>
      </section>

      <section className="profile-stats">
        <div className="profile-stat">
          <span className="profile-stat-label">Users</span>
          <span className="profile-stat-value">{stats?.users ?? 0}</span>
        </div>
        <div className="profile-stat">
          <span className="profile-stat-label">Partners</span>
          <span className="profile-stat-value">{stats?.partners ?? 0}</span>
        </div>
        <div className="profile-stat">
          <span className="profile-stat-label">Foods</span>
          <span className="profile-stat-value">{stats?.foods ?? 0}</span>
        </div>
        <div className="profile-stat">
          <span className="profile-stat-label">Orders</span>
          <span className="profile-stat-value">{stats?.orders ?? 0}</span>
        </div>
      </section>

      <section className="cart-grid">
        {foods.slice(0, 20).map((food) => (
          <div key={food._id} className="checkout-card">
            <div>
              <strong>{food.name}</strong>
              <p>{food.foodPartner?.name || "Unknown partner"}</p>
              <p>{food.isAvailable ? "Available" : "Disabled"}</p>
            </div>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => toggleFood(food._id)}
            >
              Toggle
            </button>
          </div>
        ))}
      </section>
    </div>
  );
};

export default Dashboard;
