import { useCallback, useEffect, useState } from "react";
import api from "../api/api";
import EmptyState from "../components/common/EmptyState";
import TableSkeleton from "../components/common/TableSkeleton";

const Orders = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [orders, setOrders] = useState([]);

  const loadOrders = useCallback(async ({ preserveLoading = false } = {}) => {
    if (preserveLoading) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const response = await api.get("/admin/orders");
      setOrders(response.data?.orders || []);
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message || "Could not load orders.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadOrders();
    }, 0);

    return () => clearTimeout(timer);
  }, [loadOrders]);

  if (loading) {
    return (
      <section className="admin-page">
        <header className="admin-page-header">
          <h2>Orders</h2>
        </header>
        <div className="admin-table-card">
          <TableSkeleton rows={8} columns={7} />
        </div>
      </section>
    );
  }

  if (error) {
    return <EmptyState title="Unable to load orders" description={error} />;
  }

  return (
    <section className="admin-page">
      <header className="admin-page-header">
        <h2>Orders</h2>
        <button
          type="button"
          className="admin-primary-btn"
          onClick={() => loadOrders({ preserveLoading: true })}
          disabled={refreshing}
        >
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </header>

      <div className="admin-table-card">
        {orders.length === 0 ? (
          <EmptyState title="No orders" description="No orders found." />
        ) : (
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Restaurant</th>
                <th>Amount</th>
                <th>Payment Status</th>
                <th>Order Status</th>
                <th>Created Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order._id}>
                  <td>{order._id}</td>
                  <td>{order.user?.fullName || order.user?.email || "-"}</td>
                  <td>
                    {order.restaurants?.length
                      ? order.restaurants.join(", ")
                      : "-"}
                  </td>
                  <td>Rs {Number(order.totalAmount || 0).toLocaleString()}</td>
                  <td>{order.paymentStatus || "-"}</td>
                  <td>{order.status || "-"}</td>
                  <td>
                    {order.createdAt
                      ? new Date(order.createdAt).toLocaleDateString()
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
};

export default Orders;
