import { Link } from "react-router-dom";
import "./home.css";

const HomeHeader = ({
  location = "Your location",
  notificationsCount = 0,
  onEditLocation,
}) => {
  return (
    <header className="home-header">
      <div className="home-logo">
        <span className="home-logo__emoji" aria-hidden="true">
          🍔
        </span>
        <span>FoodieK</span>
      </div>

      {onEditLocation ? (
        <button
          type="button"
          className="home-location-button"
          onClick={onEditLocation}
        >
          📍 {location}
        </button>
      ) : (
        <div className="home-location">📍 {location}</div>
      )}

      <div className="home-header-actions">
        <Link
          to="/profile"
          className="notification-btn"
          aria-label="Open profile"
        >
          <span aria-hidden="true">👤</span>
        </Link>

        <Link
          to="/notifications"
          className="notification-btn"
          aria-label="Open notifications"
        >
          <span aria-hidden="true">🔔</span>
          {notificationsCount > 0 && (
            <span className="notification-badge">{notificationsCount}</span>
          )}
        </Link>
      </div>
    </header>
  );
};

export default HomeHeader;
