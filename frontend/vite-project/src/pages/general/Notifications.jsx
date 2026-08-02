import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/api";
import toast from "react-hot-toast";
import BackButton from "../../components/navigation/BackButton";

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [streamConnected, setStreamConnected] = useState(false);

  const fetchNotifications = async () => {
    try {
      const response = await api.get("/notifications");
      setNotifications(response.data.notifications || []);
    } catch (error) {
      toast.error("Could not load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
    const eventSource = new EventSource(`${baseUrl}/notifications/stream`, {
      withCredentials: true,
    });

    eventSource.onopen = () => {
      setStreamConnected(true);
    };

    eventSource.onmessage = (event) => {
      try {
        const notification = JSON.parse(event.data);
        setNotifications((current) => [notification, ...current]);
      } catch (error) {
        // Ignore malformed events.
      }
    };

    eventSource.onerror = () => {
      setStreamConnected(false);
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const markAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((item) =>
          item._id === id ? { ...item, isRead: true } : item,
        ),
      );
    } catch (error) {
      toast.error("Could not update notification");
    }
  };

  return (
    <div className="profile-page ordering-page notifications-page">
      <section className="profile-header">
        <div className="page-top-row">
          <BackButton />
          <div>
            <h1 className="profile-business">Notifications</h1>
            <p className="profile-address">
              Stay up to date with orders, saves and reactions.
            </p>
            <p className="profile-address">
              Live updates: {streamConnected ? "Connected" : "Reconnecting"}
            </p>
          </div>
        </div>
        <button
          type="button"
          className="btn-secondary"
          onClick={fetchNotifications}
        >
          Retry
        </button>
      </section>

      <section className="notification-list">
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
            <h2>Loading notifications...</h2>
          </div>
        ) : notifications.length === 0 ? (
          <div className="empty-state ordering-empty-state">
            <h2>All caught up</h2>
            <p>No new notifications right now.</p>
            <Link to="/orders" className="btn-primary">
              View orders
            </Link>
          </div>
        ) : (
          notifications.map((notification) => (
            <button
              type="button"
              key={notification._id}
              className={`notification-card ${notification.isRead ? "is-read" : ""}`}
              onClick={() => markAsRead(notification._id)}
            >
              <div>
                <strong>{notification.title}</strong>
                <p>{notification.message}</p>
              </div>
              <span>{notification.isRead ? "Read" : "Unread"}</span>
            </button>
          ))
        )}
      </section>
    </div>
  );
};

export default Notifications;
