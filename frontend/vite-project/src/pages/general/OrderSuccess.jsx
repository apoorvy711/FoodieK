import { Link, useLocation } from "react-router-dom";
import BackButton from "../../components/navigation/BackButton";

const OrderSuccess = () => {
  const location = useLocation();
  const orderId = location.state?.orderId;
  const totalAmount = location.state?.totalAmount;

  return (
    <div className="profile-page ordering-page order-status-page">
      <section className="profile-header">
        <div className="page-top-row">
          <BackButton />
        </div>

        <div
          className="ordering-status-hero ordering-status-hero--success"
          aria-hidden="true"
        >
          ✓
        </div>

        <div className="ordering-status-copy">
          <h1 className="profile-business">Order placed successfully</h1>
          <p className="profile-address">
            Your order has been confirmed and is now being prepared.
          </p>
          {orderId && <p className="ordering-status-id">Order ID: {orderId}</p>}
          {typeof totalAmount === "number" && (
            <p className="ordering-status-total">Total paid: ₹{totalAmount}</p>
          )}
        </div>

        <div className="ordering-status-actions">
          <Link to="/orders" className="btn-primary">
            View order history
          </Link>
          <Link to="/" className="btn-secondary">
            Continue browsing
          </Link>
        </div>
      </section>
    </div>
  );
};

export default OrderSuccess;
