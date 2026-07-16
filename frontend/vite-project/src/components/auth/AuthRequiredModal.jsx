import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const AuthRequiredModal = ({
  open,
  title,
  description,
  primaryLabel,
  secondaryLabel,
  primaryTo,
  secondaryTo,
  onClose,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  const navigationState = {
    from: `${location.pathname}${location.search}`,
  };

  const goTo = (path) => {
    if (!path) {
      return;
    }

    onClose?.();
    navigate(path, { state: navigationState });
  };

  return (
    <div
      className="auth-required-modal-backdrop"
      onClick={() => onClose?.()}
      role="presentation"
    >
      <section
        className="auth-required-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-required-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="auth-required-modal-title">{title}</h2>
        <p>{description}</p>

        <div className="auth-required-modal-actions">
          {primaryLabel && (
            <button
              type="button"
              className="auth-required-modal-btn auth-required-modal-btn--primary"
              onClick={() => goTo(primaryTo)}
            >
              {primaryLabel}
            </button>
          )}

          {secondaryLabel && (
            <button
              type="button"
              className="auth-required-modal-btn auth-required-modal-btn--secondary"
              onClick={() => goTo(secondaryTo)}
            >
              {secondaryLabel}
            </button>
          )}

          <button
            type="button"
            className="auth-required-modal-btn auth-required-modal-btn--ghost"
            onClick={() => onClose?.()}
          >
            Continue Browsing
          </button>
        </div>
      </section>
    </div>
  );
};

export default AuthRequiredModal;
