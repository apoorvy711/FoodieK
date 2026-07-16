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
        <span className="home-logo__emoji">🍔</span>
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

      <Link
        to="/notifications"
        className="notification-btn"
        aria-label="Open notifications"
      >
        <span>🔔</span>
        {notificationsCount > 0 && (
          <span className="notification-badge">{notificationsCount}</span>
        )}
      </Link>
    </header>
  );
};

export default HomeHeader;
