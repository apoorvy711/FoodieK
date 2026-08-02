import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/api";
import BackButton from "../../components/navigation/BackButton";

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

  useEffect(() => {
    const handleOrderStatusUpdate = () => {
      console.log("🔄 Order status changed. Refreshing orders...");
      fetchOrders();
    };

    window.addEventListener("order-status-updated", handleOrderStatusUpdate);

    return () => {
      window.removeEventListener(
        "order-status-updated",
        handleOrderStatusUpdate,
      );
    };
  }, []);

  return (
    <div className="profile-page ordering-page orders-page">
      <section className="profile-header">
        <div className="page-top-row">
          <BackButton />
          <div>
            <h1 className="profile-business">Order history</h1>
            <p className="profile-address">
              Track your recent food orders and delivery status.
            </p>
          </div>
        </div>
        <button type="button" className="btn-secondary" onClick={fetchOrders}>
          Retry
        </button>
      </section>

      {loading ? (
        <div
          className="loading-screen ordering-loading-shell"
          aria-live="polite"
        >
          <div className="ordering-skeleton-list" aria-hidden="true">
            <div className="ordering-skeleton-item" />
            <div className="ordering-skeleton-item" />
            <div className="ordering-skeleton-item" />
          </div>
          <h2>Loading orders...</h2>
        </div>
      ) : orders.length === 0 ? (
        <div className="empty-state ordering-empty-state">
          <h2>No orders yet</h2>
          <p>Your order history will appear here after checkout.</p>
          <Link to="/" className="btn-primary">
            Start ordering
          </Link>
        </div>
      ) : (
        <div className="cart-grid ordering-orders-grid">
          {orders.map((order) => (
            <article
              key={order._id}
              className="checkout-card ordering-order-card"
            >
              <div className="ordering-order-card__header">
                <strong>Order #{order._id.slice(-6)}</strong>
                <span className={`ordering-order-status is-${order.status}`}>
                  {order.status}
                </span>
              </div>

              <p className="ordering-order-id">ID: {order._id}</p>

              <div className="ordering-order-meta">
                <p>{order.deliveryAddress}</p>
                <p>Payment: {order.paymentStatus || "pending"}</p>
                <p>
                  Date:{" "}
                  {order.createdAt
                    ? new Date(order.createdAt).toLocaleString()
                    : "--"}
                </p>
                <p className="ordering-order-total">
                  Total: ₹{order.totalAmount}
                </p>
              </div>

              <div className="ordering-order-actions">
                <Link to={`/orders/${order._id}`} className="btn-primary">
                  View details
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;
