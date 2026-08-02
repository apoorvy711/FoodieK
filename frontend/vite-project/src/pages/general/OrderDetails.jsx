import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import BackButton from "../../components/navigation/BackButton";
import api from "../../api/api";
import { resolveMediaUrl } from "../../utils/media";

const statusLabel = (status) =>
  String(status || "pending")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const OrderDetails = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await api.get("/orders/history");
        const matched = (response.data.orders || []).find(
          (entry) => String(entry._id) === String(orderId),
        );
        setOrder(matched || null);
      } catch (error) {
        setOrder(null);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  const orderedItems = useMemo(() => order?.items || [], [order]);

  return (
    <div className="profile-page ordering-page order-details-page">
      <section className="profile-header">
        <div className="page-top-row">
          <BackButton />
          <div>
            <h1 className="profile-business">Order details</h1>
            <p className="profile-address">
              Track status, payment and items for this order.
            </p>
          </div>
        </div>
      </section>

      {loading ? (
        <div
          className="loading-screen ordering-loading-shell"
          aria-live="polite"
        >
          <div className="ordering-skeleton-list" aria-hidden="true">
            <div className="ordering-skeleton-item" />
            <div className="ordering-skeleton-item" />
          </div>
          <h2>Loading order details...</h2>
        </div>
      ) : !order ? (
        <div className="empty-state ordering-empty-state">
          <h2>Order not found</h2>
          <p>This order may have been removed or is no longer available.</p>
        </div>
      ) : (
        <>
          <section className="checkout-card ordering-order-details-card">
            <div className="ordering-order-card__header">
              <strong>Order #{String(order._id).slice(-6)}</strong>
              <span className={`ordering-order-status is-${order.status}`}>
                {statusLabel(order.status)}
              </span>
            </div>
            <p className="ordering-order-id">ID: {order._id}</p>

            <div className="ordering-order-details-grid">
              <div>
                <h3>Delivery</h3>
                <p>{order.deliveryAddress || "Address not provided"}</p>
              </div>
              <div>
                <h3>Payment</h3>
                <p>Method: {statusLabel(order.paymentMethod)}</p>
                <p>Status: {statusLabel(order.paymentStatus || "pending")}</p>
              </div>
              <div>
                <h3>Total</h3>
                <p className="ordering-order-total">
                  ₹{order.totalAmount || 0}
                </p>
              </div>
              <div>
                <h3>Placed on</h3>
                <p>
                  {order.createdAt
                    ? new Date(order.createdAt).toLocaleString()
                    : "--"}
                </p>
              </div>
            </div>
          </section>

          <section className="checkout-card ordering-order-items-card">
            <h2>Items</h2>
            <div className="ordering-checkout-summary__list">
              {orderedItems.length === 0 ? (
                <p>No items available for this order.</p>
              ) : (
                orderedItems.map((item) => (
                  <article
                    key={item._id || item.food?._id}
                    className="ordering-checkout-summary__item"
                  >
                    <img
                      src={resolveMediaUrl(
                        item.food?.thumbnail || item.food?.foodPartner?.avatar,
                        "/media/hero.png",
                      )}
                      alt=""
                      loading="lazy"
                      decoding="async"
                    />
                    <div>
                      <strong>{item.food?.name || "Food item"}</strong>
                      <span>Qty {item.quantity || 1}</span>
                    </div>
                    <p>₹{item.price || 0}</p>
                  </article>
                ))
              )}
            </div>
          </section>

          <section className="checkout-card ordering-status-timeline">
            <h2>Status timeline</h2>
            {order.statusHistory?.length ? (
              <ul>
                {order.statusHistory.map((entry, index) => (
                  <li key={`${entry.status}-${index}`}>
                    <div>
                      <strong>{statusLabel(entry.status)}</strong>
                      {entry.note && <p>{entry.note}</p>}
                    </div>
                    <span>
                      {entry.changedAt
                        ? new Date(entry.changedAt).toLocaleString()
                        : "--"}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No status updates available yet.</p>
            )}
          </section>
        </>
      )}
    </div>
  );
};

export default OrderDetails;
