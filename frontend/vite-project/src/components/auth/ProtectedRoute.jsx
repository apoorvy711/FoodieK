import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";

function AuthRoutePrompt({
  title,
  description,
  primaryLabel,
  primaryTo,
  secondaryLabel,
  secondaryTo,
  from,
}) {
  return (
    <main className="profile-page">
      <section className="profile-header auth-route-prompt">
        <h1 className="profile-business">{title}</h1>
        <p className="profile-address">{description}</p>

        <div className="auth-route-prompt-actions">
          <Link
            to={primaryTo}
            state={from ? { from } : undefined}
            className="auth-route-prompt-btn auth-route-prompt-btn--primary"
          >
            {primaryLabel}
          </Link>
          <Link
            to={secondaryTo}
            state={from ? { from } : undefined}
            className="auth-route-prompt-btn auth-route-prompt-btn--secondary"
          >
            {secondaryLabel}
          </Link>
        </div>
      </section>
    </main>
  );
}

export function CustomerProtectedRoute({ children }) {
  const auth = useAuth();
  const location = useLocation();

  if (!auth.authResolved) {
    return (
      <div className="loading-screen">
        <h2>Checking your account...</h2>
      </div>
    );
  }

  if (auth.isUser) {
    return children;
  }

  if (auth.isFoodPartner) {
    return (
      <AuthRoutePrompt
        title="Customer account required"
        description="This section is for customer accounts. Please login with a user account to continue."
        primaryLabel="Login as User"
        primaryTo="/user/login"
        secondaryLabel="Create User Account"
        secondaryTo="/user/register"
        from={location.pathname + location.search}
      />
    );
  }

  return (
    <AuthRoutePrompt
      title="Login to continue"
      description="Please login with your customer account to access this section."
      primaryLabel="Login as User"
      primaryTo="/user/login"
      secondaryLabel="Create User Account"
      secondaryTo="/user/register"
      from={location.pathname + location.search}
    />
  );
}

export function FoodPartnerProtectedRoute({ children }) {
  const auth = useAuth();
  const location = useLocation();

  if (!auth.authResolved) {
    return (
      <div className="loading-screen">
        <h2>Checking your account...</h2>
      </div>
    );
  }

  if (auth.isFoodPartner) {
    return children;
  }

  if (auth.isUser) {
    return (
      <AuthRoutePrompt
        title="Food partner access required"
        description="This section is for restaurant partners. Please login with a food partner account."
        primaryLabel="Food Partner Login"
        primaryTo="/food-partner/login"
        secondaryLabel="Register Restaurant"
        secondaryTo="/food-partner/register"
        from={location.pathname + location.search}
      />
    );
  }

  return (
    <AuthRoutePrompt
      title="Restaurant partner access required"
      description="Login to your Food Partner account to manage dishes, orders and your restaurant profile."
      primaryLabel="Food Partner Login"
      primaryTo="/food-partner/login"
      secondaryLabel="Register Restaurant"
      secondaryTo="/food-partner/register"
      from={location.pathname + location.search}
    />
  );
}

export function AdminProtectedRoute({ children }) {
  const auth = useAuth();
  const location = useLocation();

  if (!auth.authResolved) {
    return (
      <div className="loading-screen">
        <h2>Checking your account...</h2>
      </div>
    );
  }

  if (auth.isAdmin) {
    return children;
  }

  return (
    <AuthRoutePrompt
      title="Admin access required"
      description="This page is only available to admin accounts."
      primaryLabel="User Login"
      primaryTo="/user/login"
      secondaryLabel="Back to Home"
      secondaryTo="/"
      from={location.pathname + location.search}
    />
  );
}
