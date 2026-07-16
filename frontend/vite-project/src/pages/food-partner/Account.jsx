import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../api/api";
import "../../styles/profile.css";

const Account = () => {
  const [partner, setPartner] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [meResponse, ordersResponse] = await Promise.all([
          api.get("/auth/food-partner/me"),
          api.get("/orders/partner"),
        ]);

        setPartner(meResponse.data.foodPartner || null);
        setOrders(ordersResponse.data.orders || []);
      } catch (error) {
        toast.error("Please login as food partner");
        navigate("/food-partner/login");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [navigate]);

  const activeOrders = orders.filter(
    (order) => !["delivered", "canceled", "refunded"].includes(order.status),
  ).length;

  if (loading) {
    return (
      <div className="loading-screen">
        <h2>Loading partner account...</h2>
      </div>
    );
  }

  return (
    <main className="profile-page">
      <section className="profile-header">
        <div className="profile-meta">
          <div className="profile-info">
            <h1 className="profile-business">
              {partner?.name || "Food Partner"}
            </h1>
            <p className="profile-address">{partner?.email}</p>
            <p className="profile-address">{partner?.address}</p>
          </div>
        </div>

        <div className="profile-stats">
          <div className="profile-stat">
            <span className="profile-stat-label">Active Orders</span>
            <span className="profile-stat-value">{activeOrders}</span>
          </div>
          <div className="profile-stat">
            <span className="profile-stat-label">Total Orders</span>
            <span className="profile-stat-value">{orders.length}</span>
          </div>
        </div>

        <div className="profile-grid profile-grid--compact">
          <Link to="/create-food" className="glass-card profile-tile">
            Add New Dish
          </Link>
          {partner?._id ? (
            <Link
              to={`/food-partner/${partner._id}`}
              className="glass-card profile-tile"
            >
              View My Public Store
            </Link>
          ) : (
            <div className="glass-card profile-tile">View My Public Store</div>
          )}
        </div>
      </section>

      <section className="profile-content">
        <div className="review-card">
          <h3>Recent Orders</h3>
          {orders.length === 0 && <p>No orders yet.</p>}
          {orders.slice(0, 8).map((order) => (
            <p key={order._id}>
              {order._id.slice(-6)} - {order.status} - Rs {order.totalAmount}
            </p>
          ))}
        </div>
      </section>
    </main>
  );
};

export default Account;
