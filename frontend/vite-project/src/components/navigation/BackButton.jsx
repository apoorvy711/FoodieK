import { useNavigate } from "react-router-dom";

const BackButton = ({
  className = "app-back-button",
  fallbackTo = "/",
  label = "Back",
}) => {
  const navigate = useNavigate();

  const onGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate(fallbackTo, { replace: true });
  };

  return (
    <button
      type="button"
      className={className}
      onClick={onGoBack}
      aria-label={`${label} to previous page`}
    >
      <span aria-hidden="true">←</span>
      <span>{label}</span>
    </button>
  );
};

export default BackButton;
