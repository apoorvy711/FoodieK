import { Link } from "react-router-dom";
import BackButton from "../../components/navigation/BackButton";

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
          <BackButton className="btn-secondary" label="Go back" />
        </div>
      </section>
    </div>
  );
};

export default NotFound;
