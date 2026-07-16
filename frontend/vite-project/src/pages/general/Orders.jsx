import { useEffect, useState } from "react";
import api from "../../api/api";

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const response = await api.get("/orders/history");
      setOrders(response.data.orders || []);
    } catch (error) {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <div className="profile-page">
      <section className="profile-header">
        <div>
          <h1 className="profile-business">Order history</h1>
          <p className="profile-address">
            Track your recent food orders and delivery status.
          </p>
        </div>
        <button type="button" className="btn-secondary" onClick={fetchOrders}>
          Retry
        </button>
      </section>

      {loading ? (
        <div className="loading-screen">
          <h2>Loading orders...</h2>
        </div>
      ) : orders.length === 0 ? (
        <div className="empty-state">
          <p>No orders placed yet.</p>
        </div>
      ) : (
        <div className="cart-grid">
          {orders.map((order) => (
            <div key={order._id} className="checkout-card">
              <div>
                <strong>Order #{order._id.slice(-6)}</strong>
                <p>{order.deliveryAddress}</p>
                <p>Status: {order.status}</p>
                <p>Payment: {order.paymentStatus || "pending"}</p>
                <p>Total: ₹{order.totalAmount}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;
