const LoadingScreen = ({ message = "Loading..." }) => {
  return (
    <div className="admin-loading-screen" role="status" aria-live="polite">
      <p>{message}</p>
    </div>
  );
};

export default LoadingScreen;
