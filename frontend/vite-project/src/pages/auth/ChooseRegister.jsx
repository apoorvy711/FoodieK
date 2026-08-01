import { Link } from "react-router-dom";
import "../../styles/auth-shared.css";
import BackButton from "../../components/navigation/BackButton";

const ChooseRegister = () => {
  return (
    <div className="auth-page-wrapper">
      <div
        className="auth-card"
        role="region"
        aria-labelledby="choose-register-title"
      >
        <BackButton />
        <header>
          <h1 id="choose-register-title" className="auth-title">
            Register
          </h1>
          <p className="auth-subtitle">
            Pick how you want to join the platform.
          </p>
        </header>
        <div className="auth-chooser-actions">
          <Link to="/user/register" className="auth-submit auth-link-button">
            Register as normal user
          </Link>
          <Link
            to="/food-partner/register"
            className="auth-submit auth-link-button auth-link-button--secondary"
          >
            Register as food partner
          </Link>
        </div>
        <div className="auth-alt-action">
          Already have an account? <Link to="/user/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
};

export default ChooseRegister;
