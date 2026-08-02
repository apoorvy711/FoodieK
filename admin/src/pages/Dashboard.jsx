import { Link } from "react-router-dom";
import { useMemo } from "react";
import DataCard from "../components/common/DataCard";
import EmptyState from "../components/common/EmptyState";
import LoadingScreen from "../components/common/LoadingScreen";
import { useAdminDashboard } from "../hooks/useAdminDashboard";

const Dashboard = () => {
  const { loading, error, stats, recentRequests, refreshDashboard } =
    useAdminDashboard();

  const cardData = useMemo(() => {
    return [
      {
        title: "Pending Restaurant Requests",
        value: stats?.pendingRestaurantRequests ?? 0,
      },
      {
        title: "Total Restaurants",
        value: stats?.partners ?? 0,
      },
      {
        title: "Total Users",
        value: stats?.users ?? 0,
      },
      {
        title: "Total Orders",
        value: stats?.orders ?? 0,
      },
      {
        title: "Revenue",
        value: `Rs ${Number(stats?.totalRevenue || 0).toLocaleString()}`,
      },
    ];
  }, [stats]);

  if (loading) {
    return <LoadingScreen message="Loading dashboard..." />;
  }

  if (error) {
    return <EmptyState title="Unable to load dashboard" description={error} />;
  }

  return (
    <section className="admin-page">
      <header className="admin-page-header">
        <h2>Dashboard</h2>
        <div className="admin-page-actions">
          <Link to="/restaurant-requests" className="admin-inline-link">
            View all requests
          </Link>
          <button
            type="button"
            className="admin-primary-btn"
            onClick={refreshDashboard}
          >
            Refresh
          </button>
        </div>
      </header>

      <div className="admin-card-grid">
        {cardData.map((item) => (
          <DataCard key={item.title} title={item.title} value={item.value} />
        ))}
      </div>

      <div className="admin-table-card">
        <h3>Quick Actions</h3>
        <div className="admin-action-row">
          <Link to="/restaurant-requests" className="admin-primary-btn">
            Review Restaurant Requests
          </Link>
          <Link to="/restaurants" className="admin-secondary-btn">
            View Restaurants
          </Link>
          <Link to="/announcements" className="admin-secondary-btn">
            Send Announcement
          </Link>
        </div>
      </div>

      <div className="admin-table-card">
        <h3>Recent Requests</h3>
        {recentRequests.length === 0 ? (
          <EmptyState
            title="No requests yet"
            description="New restaurant verification requests will appear here."
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
              {recentRequests.map((request) => (
                <tr key={request._id}>
                  <td>{request.restaurantName}</td>
                  <td>{request.owner?.name || "-"}</td>
                  <td>{request.status}</td>
                  <td>{new Date(request.submittedAt).toLocaleString()}</td>
                  <td>
                    <Link
                      to={`/restaurant-requests/${request._id}`}
                      className="admin-inline-link"
                    >
                      Review
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

export default Dashboard;
