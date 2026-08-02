const statusLabelMap = {
  not_submitted: "Not Submitted",
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  unknown: "Unknown",
};

function toStatusClass(status) {
  if (status === "approved") {
    return "is-approved";
  }

  if (status === "rejected") {
    return "is-rejected";
  }

  if (status === "pending") {
    return "is-pending";
  }

  return "is-neutral";
}

const RestaurantVerificationStatusCard = ({ verification }) => {
  const status = verification?.status || "not_submitted";
  const rejectionReason = verification?.request?.rejectionReason || "";

  return (
    <article className="verification-status-card glass-card">
      <p className="verification-section-label">Restaurant Verification</p>
      <div className="verification-status-row">
        <h1 className="verification-title">Restaurant Verification</h1>
        <span className={`verification-pill ${toStatusClass(status)}`}>
          {statusLabelMap[status] || "Unknown"}
        </span>
      </div>

      {status === "pending" && (
        <div className="verification-copy-group">
          <p>Your restaurant request has been submitted successfully.</p>
          <p>Our verification team will review your request.</p>
          <p>You'll receive an email once verification is complete.</p>
          <p>
            Estimated Review Time: <strong>24-48 Hours</strong>
          </p>
        </div>
      )}

      {status === "approved" && (
        <div className="verification-copy-group">
          <p>
            Your restaurant verification is complete and your account is active.
          </p>
          <p>You can now add food, manage orders, and access partner tools.</p>
        </div>
      )}

      {status === "rejected" && (
        <div className="verification-copy-group">
          <p>Your previous verification request was rejected.</p>
          {rejectionReason ? (
            <p>
              Rejection Reason: <strong>{rejectionReason}</strong>
            </p>
          ) : (
            <p>Rejection reason was not provided by admin.</p>
          )}
          <p>Please update your details below and resubmit.</p>
        </div>
      )}

      {status === "not_submitted" && (
        <div className="verification-copy-group">
          <p>
            Submit your restaurant details for verification to unlock partner
            features.
          </p>
        </div>
      )}
    </article>
  );
};

export default RestaurantVerificationStatusCard;
