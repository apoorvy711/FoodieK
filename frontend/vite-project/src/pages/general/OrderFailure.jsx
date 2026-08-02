import { Link, useLocation } from "react-router-dom";
import BackButton from "../../components/navigation/BackButton";

const OrderFailure = () => {
  const location = useLocation();
  const message =
    location.state?.message || "We could not complete your payment.";
  const orderId = location.state?.orderId;

  return (
    <div className="profile-page ordering-page order-status-page">
      <section className="profile-header">
        <div className="page-top-row">
          <BackButton />
        </div>

        <div
          className="ordering-status-hero ordering-status-hero--failure"
          aria-hidden="true"
        >
          !
        </div>

        <div className="ordering-status-copy">
          <h1 className="profile-business">Payment failed</h1>
          <p className="profile-address">{message}</p>
          {orderId && <p className="ordering-status-id">Order ID: {orderId}</p>}
        </div>

        <div className="ordering-status-actions">
          <Link to="/checkout" className="btn-primary">
            Retry payment
          </Link>
          <Link to="/cart" className="btn-secondary">
            Back to cart
          </Link>
        </div>
      </section>
    </div>
  );
};

export default OrderFailure;
