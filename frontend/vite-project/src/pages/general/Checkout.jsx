import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../api/api";
import BackButton from "../../components/navigation/BackButton";

function loadRazorpayCheckoutScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const existingScript = document.querySelector(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]',
    );

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(true), {
        once: true,
      });
      existingScript.addEventListener("error", () => resolve(false), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

const Checkout = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState({ items: [], totalAmount: 0 });
  const [address, setAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [submitting, setSubmitting] = useState(false);

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

    if (submitting) {
      return;
    }

    if (!address.trim()) {
      toast.error("Please provide a delivery address");
      return;
    }

    try {
      setSubmitting(true);

      const orderResponse = await api.post("/orders", {
        deliveryAddress: address,
        paymentMethod,
      });

      const createdOrder = orderResponse.data?.order;

      if (!createdOrder?._id) {
        throw new Error("Order creation failed");
      }

      if (paymentMethod === "cash") {
        toast.success("Order placed successfully");
        navigate("/orders");
        return;
      }

      const scriptLoaded = await loadRazorpayCheckoutScript();
      if (!scriptLoaded || !window.Razorpay) {
        throw new Error("Unable to load Razorpay checkout");
      }

      const intentResponse = await api.post("/payments/intent", {
        orderId: createdOrder._id,
      });

      const razorpayOrder = intentResponse.data?.razorpayOrder;
      const razorpayKeyId = intentResponse.data?.razorpayKeyId;

      if (!razorpayOrder?.id || !razorpayKeyId) {
        throw new Error("Payment initialization failed");
      }

      const openCheckout = () =>
        new Promise((resolve, reject) => {
          const razorpayInstance = new window.Razorpay({
            key: razorpayKeyId,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            name: "FoodieK",
            description: `Payment for order #${createdOrder._id.slice(-6)}`,
            order_id: razorpayOrder.id,
            handler: async (response) => {
              try {
                const verifyResponse = await api.post("/payments/verify", {
                  orderId: createdOrder._id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                });

                resolve(verifyResponse.data);
              } catch (error) {
                reject(error);
              }
            },
            modal: {
              ondismiss: () => {
                reject(new Error("Payment popup was closed"));
              },
            },
            theme: {
              color: "#0f172a",
            },
          });

          razorpayInstance.on("payment.failed", function (response) {
            reject(new Error("Payment failed"));
          });

          razorpayInstance.open();
        });

      const result = await openCheckout();

      if (result?.success) {
        toast.success("Payment successful. Order confirmed.");
        navigate("/orders");
      }
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Could not place order";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="profile-page">
      <section className="profile-header">
        <div className="page-top-row">
          <BackButton />
          <div>
            <h1 className="profile-business">Checkout</h1>
            <p className="profile-address">
              Complete your order with a delivery address and payment method.
            </p>
          </div>
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
            <option value="wallet">Wallet</option>
          </select>
        </div>

        <div className="checkout-card checkout-total">
          <span>Total</span>
          <strong>₹{cart.totalAmount || 0}</strong>
        </div>

        <button
          type="submit"
          className={`btn-primary ${submitting ? "is-loading" : ""}`}
          disabled={submitting}
          aria-busy={submitting}
        >
          {submitting
            ? "Processing..."
            : paymentMethod === "cash"
              ? "Place order"
              : "Pay & place order"}
        </button>
      </form>
    </div>
  );
};

export default Checkout;
