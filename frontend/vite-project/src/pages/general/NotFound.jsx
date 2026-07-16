import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="profile-page">
      <section className="empty-state empty-state--hero">
        <div className="empty-state__icon">🍽️</div>
        <h3>Page not found</h3>
        <p>The page you are looking for is unavailable or may have moved.</p>
        <div className="empty-state__actions">
          <Link to="/" className="btn-primary">
            Back home
          </Link>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => window.history.back()}
          >
            Go back
          </button>
        </div>
      </section>
    </div>
  );
};

export default NotFound;
