import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../api/api";
import BackButton from "../../components/navigation/BackButton";
import { resolveMediaUrl } from "../../utils/media";

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
    <div className="profile-page ordering-page cart-page">
      <section className="profile-header">
        <div className="page-top-row">
          <BackButton />
          <div>
            <h1 className="profile-business">Your cart</h1>
            <p className="profile-address">
              Review your orders before checkout.
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
            <div className="ordering-skeleton-item" />
          </div>
          <h2>Loading cart...</h2>
        </div>
      ) : cart.items.length === 0 ? (
        <div className="empty-state ordering-empty-state">
          <h2>Your cart is empty</h2>
          <p>Add delicious dishes to place your next order.</p>
          <Link to="/" className="btn-primary">
            Browse dishes
          </Link>
        </div>
      ) : (
        <div className="cart-grid ordering-cart-grid">
          <section className="ordering-cart-items" aria-label="Cart items">
            {cart.items.map((item) => (
              <article
                key={item.food?._id || item._id}
                className="checkout-card ordering-cart-item"
              >
                <div className="ordering-cart-item__media" aria-hidden="true">
                  <img
                    src={resolveMediaUrl(
                      item.food?.thumbnail || item.food?.foodPartner?.avatar,
                      "/media/hero.png",
                    )}
                    alt=""
                    loading="lazy"
                    decoding="async"
                  />
                </div>

                <div className="ordering-cart-item__content">
                  <strong>{item.food?.name}</strong>
                  <p>
                    {item.food?.restaurantName || item.food?.foodPartner?.name}
                  </p>
                  <div className="ordering-cart-item__meta">
                    <span className="ordering-qty-chip">
                      Qty {item.quantity}
                    </span>
                    <span>₹{item.price}</span>
                  </div>
                </div>

                <div className="ordering-cart-item__actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => removeItem(item.food?._id)}
                  >
                    Remove
                  </button>
                </div>
              </article>
            ))}
          </section>

          <aside className="checkout-card checkout-total ordering-cart-total">
            <span>Total</span>
            <strong>₹{cart.totalAmount || 0}</strong>
            <p>{cart.items.length} item(s) in cart</p>
            <Link to="/checkout" className="btn-primary">
              Proceed to checkout
            </Link>
          </aside>
        </div>
      )}
    </div>
  );
};

export default Cart;
