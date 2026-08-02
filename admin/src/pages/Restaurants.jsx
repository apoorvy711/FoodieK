import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../api/api";
import EmptyState from "../components/common/EmptyState";
import TableSkeleton from "../components/common/TableSkeleton";
import { emitDashboardRefresh } from "../utils/adminEvents";

const Restaurants = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [restaurants, setRestaurants] = useState([]);
  const [targetRestaurant, setTargetRestaurant] = useState(null);
  const [statusUpdating, setStatusUpdating] = useState(false);

  const loadRestaurants = useCallback(
    async ({ preserveLoading = false } = {}) => {
      if (preserveLoading) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        const response = await api.get("/admin/food-partners");
        setRestaurants(response.data?.foodPartners || []);
      } catch (requestError) {
        setError(
          requestError?.response?.data?.message ||
            "Could not load restaurants.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      loadRestaurants();
    }, 0);

    return () => clearTimeout(timer);
  }, [loadRestaurants]);

  const closeConfirmModal = () => {
    if (statusUpdating) {
      return;
    }

    setTargetRestaurant(null);
  };

  const handleToggleStatus = async () => {
    if (!targetRestaurant) {
      return;
    }

    setStatusUpdating(true);

    try {
      const response = await api.patch(
        `/admin/food-partners/${targetRestaurant._id}/toggle-active`,
      );

      const updated = response.data?.foodPartner;

      setRestaurants((current) =>
        current.map((restaurant) =>
          restaurant._id === updated?._id
            ? { ...restaurant, ...updated }
            : restaurant,
        ),
      );

      toast.success(response.data?.message || "Restaurant status updated");
      emitDashboardRefresh();
      setTargetRestaurant(null);
    } catch (requestError) {
      toast.error(
        requestError?.response?.data?.message ||
          "Could not update restaurant status.",
      );
    } finally {
      setStatusUpdating(false);
    }
  };

  if (loading) {
    return (
      <section className="admin-page">
        <header className="admin-page-header">
          <h2>Restaurants</h2>
        </header>
        <div className="admin-table-card">
          <TableSkeleton rows={6} columns={7} />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <EmptyState title="Unable to load restaurants" description={error} />
    );
  }

  return (
    <section className="admin-page">
      <header className="admin-page-header">
        <h2>Restaurants</h2>
        <button
          type="button"
          className="admin-primary-btn"
          onClick={() => loadRestaurants({ preserveLoading: true })}
          disabled={refreshing}
        >
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </header>

      <div className="admin-table-card">
        {restaurants.length === 0 ? (
          <EmptyState
            title="No restaurants"
            description="No restaurant partner accounts found."
          />
        ) : (
          <table>
            <thead>
              <tr>
                <th>Restaurant</th>
                <th>Owner</th>
                <th>Verification Status</th>
                <th>Active</th>
                <th>Created Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {restaurants.map((restaurant) => (
                <tr key={restaurant._id}>
                  <td>{restaurant.name || "-"}</td>
                  <td>{restaurant.contactName || "-"}</td>
                  <td>{restaurant.status || "pending"}</td>
                  <td>
                    {restaurant.isActive === false ? "Inactive" : "Active"}
                  </td>
                  <td>
                    {restaurant.createdAt
                      ? new Date(restaurant.createdAt).toLocaleDateString()
                      : "-"}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="admin-secondary-btn"
                      onClick={() => setTargetRestaurant(restaurant)}
                    >
                      {restaurant.isActive === false
                        ? "Activate"
                        : "Deactivate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {targetRestaurant && (
        <div className="admin-modal-backdrop" role="presentation">
          <div className="admin-modal" role="dialog" aria-modal="true">
            <h3>
              {targetRestaurant.isActive === false
                ? "Activate restaurant?"
                : "Deactivate restaurant?"}
            </h3>
            <p>
              {targetRestaurant.isActive === false
                ? `This will allow ${targetRestaurant.name || "this restaurant"} to access partner features again.`
                : `This will block ${targetRestaurant.name || "this restaurant"} from partner access until reactivated.`}
            </p>

            <div className="admin-modal-actions">
              <button
                type="button"
                className="admin-secondary-btn"
                onClick={closeConfirmModal}
                disabled={statusUpdating}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-primary-btn"
                onClick={handleToggleStatus}
                disabled={statusUpdating}
              >
                {statusUpdating
                  ? "Saving..."
                  : targetRestaurant.isActive === false
                    ? "Confirm Activate"
                    : "Confirm Deactivate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Restaurants;
