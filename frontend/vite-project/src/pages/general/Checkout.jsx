import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../api/api";

const Checkout = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState({ items: [], totalAmount: 0 });
  const [address, setAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");

  const fetchCart = async () => {
    try {
      const response = await api.get("/orders/cart");
      setCart(response.data.cart || { items: [], totalAmount: 0 });
    } catch (error) {
      setCart({ items: [], totalAmount: 0 });
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();

    if (!address.trim()) {
      toast.error("Please provide a delivery address");
      return;
    }

    try {
      await api.post("/orders", { deliveryAddress: address, paymentMethod });
      toast.success("Order placed successfully");
      navigate("/orders");
    } catch (error) {
      toast.error("Could not place order");
    }
  };

  return (
    <div className="profile-page">
      <section className="profile-header">
        <div>
          <h1 className="profile-business">Checkout</h1>
          <p className="profile-address">
            Complete your order with a delivery address and payment method.
          </p>
        </div>
      </section>

      <form className="checkout-form" onSubmit={onSubmit}>
        <div className="field-group">
          <label htmlFor="address">Delivery address</label>
          <textarea
            id="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            rows={4}
          />
        </div>

        <div className="field-group">
          <label htmlFor="paymentMethod">Payment method</label>
          <select
            id="paymentMethod"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
          >
            <option value="cash">Cash</option>
            <option value="upi">UPI</option>
            <option value="card">Card</option>
          </select>
        </div>

        <div className="checkout-card checkout-total">
          <span>Total</span>
          <strong>₹{cart.totalAmount || 0}</strong>
        </div>

        <button type="submit" className="btn-primary">
          Place order
        </button>
      </form>
    </div>
  );
};

export default Checkout;
