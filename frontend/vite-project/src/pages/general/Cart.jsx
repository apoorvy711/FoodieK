import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../api/api";

const Cart = () => {
  const [cart, setCart] = useState({ items: [], totalAmount: 0 });
  const [loading, setLoading] = useState(true);

  const fetchCart = async () => {
    try {
      const response = await api.get("/orders/cart");
      setCart(response.data.cart || { items: [], totalAmount: 0 });
    } catch (error) {
      setCart({ items: [], totalAmount: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const removeItem = async (foodId) => {
    try {
      await api.delete(`/orders/cart/${foodId}`);
      toast.success("Item removed from cart");
      await fetchCart();
    } catch (error) {
      toast.error("Could not remove item");
    }
  };

  return (
    <div className="profile-page">
      <section className="profile-header">
        <div>
          <h1 className="profile-business">Your cart</h1>
          <p className="profile-address">Review your orders before checkout.</p>
        </div>
      </section>

      {loading ? (
        <div className="loading-screen">
          <h2>Loading cart...</h2>
        </div>
      ) : cart.items.length === 0 ? (
        <div className="empty-state">
          <p>Your cart is empty.</p>
        </div>
      ) : (
        <div className="cart-grid">
          {cart.items.map((item) => (
            <div key={item.food?._id || item._id} className="checkout-card">
              <div>
                <strong>{item.food?.name}</strong>
                <p>
                  {item.food?.restaurantName || item.food?.foodPartner?.name}
                </p>
                <p>
                  Qty: {item.quantity} • ₹{item.price}
                </p>
              </div>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => removeItem(item.food?._id)}
              >
                Remove
              </button>
            </div>
          ))}

          <div className="checkout-card checkout-total">
            <span>Total</span>
            <strong>₹{cart.totalAmount || 0}</strong>
            <Link to="/checkout" className="btn-primary">
              Checkout
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
