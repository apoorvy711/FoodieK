import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/api";
import EmptyState from "../components/common/EmptyState";
import LoadingScreen from "../components/common/LoadingScreen";

const RestaurantRequests = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [requests, setRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const loadRequests = useCallback(
    async ({ keepLoadingState = false } = {}) => {
      if (keepLoadingState) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        const response = await api.get("/admin/restaurant-requests");
        setRequests(response.data?.restaurantRequests || []);
      } catch (requestError) {
        setError(
          requestError?.response?.data?.message ||
            "Could not load restaurant requests.",
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
      loadRequests();
    }, 0);

    return () => clearTimeout(timer);
  }, [loadRequests]);

  const filteredRequests = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return [...requests]
      .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
      .filter((request) => {
        if (statusFilter !== "all" && request.status !== statusFilter) {
          return false;
        }

        if (!normalizedSearch) {
          return true;
        }

        const ownerName = request.owner?.name || request.owner?.email || "";
        return (
          request.restaurantName?.toLowerCase().includes(normalizedSearch) ||
          ownerName.toLowerCase().includes(normalizedSearch)
        );
      });
  }, [requests, searchTerm, statusFilter]);

  if (loading) {
    return <LoadingScreen message="Loading restaurant requests..." />;
  }

  if (error) {
    return (
      <EmptyState
        title="Unable to load restaurant requests"
        description={error}
      />
    );
  }

  return (
    <section className="admin-page">
      <header className="admin-page-header">
        <h2>Restaurant Requests</h2>
        <button
          type="button"
          className="admin-primary-btn"
          onClick={() => loadRequests({ keepLoadingState: true })}
          disabled={refreshing}
        >
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </header>

      <div className="admin-filter-row">
        <input
          className="admin-filter-input"
          type="search"
          value={searchTerm}
          placeholder="Search by restaurant or owner"
          onChange={(event) => setSearchTerm(event.target.value)}
        />

        <select
          className="admin-filter-select"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="admin-table-card">
        {filteredRequests.length === 0 ? (
          <EmptyState
            title="No restaurant requests found"
            description="Try changing search or status filters, or refresh the list."
          />
        ) : (
          <table>
            <thead>
              <tr>
                <th>Restaurant</th>
                <th>Owner</th>
                <th>Status</th>
                <th>Submitted</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((request) => (
                <tr key={request._id}>
                  <td>{request.restaurantName}</td>
                  <td>{request.owner?.name || request.owner?.email || "-"}</td>
                  <td>{request.status}</td>
                  <td>{new Date(request.submittedAt).toLocaleDateString()}</td>
                  <td>
                    <Link
                      to={`/restaurant-requests/${request._id}`}
                      className="admin-inline-link"
                    >
                      View
                    </Link>
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

export default RestaurantRequests;
