import { useState } from "react";
import toast from "react-hot-toast";
import api from "../api/api";

const Announcements = () => {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [audience, setAudience] = useState("everyone");
  const [submitting, setSubmitting] = useState(false);
  const [deliveryStats, setDeliveryStats] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const normalizedTitle = title.trim();
    const normalizedMessage = message.trim();

    if (!normalizedTitle || !normalizedMessage) {
      toast.error("Title and message are required");
      return;
    }

    setSubmitting(true);

    try {
      const response = await api.post("/admin/announcements", {
        title: normalizedTitle,
        message: normalizedMessage,
        audience,
      });

      setDeliveryStats(response.data?.deliveryStats || null);
      setTitle("");
      setMessage("");
      setAudience("everyone");
      toast.success(
        response.data?.message || "Announcement queued successfully",
      );
    } catch (requestError) {
      toast.error(
        requestError?.response?.data?.message || "Could not send announcement.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="admin-page">
      <header className="admin-page-header">
        <h2>Announcements</h2>
      </header>

      <form
        className="admin-detail-card admin-form-grid"
        onSubmit={handleSubmit}
      >
        <label className="admin-form-field">
          <span>Title</span>
          <input
            type="text"
            value={title}
            maxLength={120}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Platform update title"
          />
        </label>

        <label className="admin-form-field">
          <span>Message</span>
          <textarea
            rows="6"
            value={message}
            maxLength={1500}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Write your announcement message"
          />
        </label>

        <label className="admin-form-field">
          <span>Audience</span>
          <select
            value={audience}
            onChange={(event) => setAudience(event.target.value)}
          >
            <option value="everyone">Everyone</option>
            <option value="customers">Customers</option>
            <option value="restaurant_owners">Restaurant Owners</option>
          </select>
        </label>

        <div className="admin-action-row">
          <button
            type="submit"
            className="admin-primary-btn"
            disabled={submitting}
          >
            {submitting ? "Queuing..." : "Send Announcement"}
          </button>
        </div>

        {deliveryStats && (
          <p className="admin-muted-text">
            Queued Emails: {deliveryStats.queuedEmails || 0} | In-App
            Notifications: {deliveryStats.inAppNotifications || 0}
          </p>
        )}
      </form>
    </section>
  );
};

export default Announcements;
