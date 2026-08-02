import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/api";
import EmptyState from "../components/common/EmptyState";
import LoadingScreen from "../components/common/LoadingScreen";

const RestaurantRequestDetails = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [requestData, setRequestData] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const loadRequest = useCallback(async () => {
    try {
      const response = await api.get(`/admin/restaurant-requests/${id}`);
      setRequestData(response.data?.restaurantRequest || null);
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          "Could not load restaurant request details.",
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadRequest();
    }, 0);

    return () => clearTimeout(timer);
  }, [loadRequest]);

  const canTakeAction = requestData?.status === "pending";

  const handleApprove = async () => {
    if (!canTakeAction) {
      return;
    }

    setActionLoading(true);

    try {
      const response = await api.patch(
        `/admin/restaurant-requests/${id}/approve`,
        {},
      );
      setRequestData(response.data?.restaurantRequest || requestData);
      toast.success(response.data?.message || "Request approved successfully");
    } catch (requestError) {
      toast.error(
        requestError?.response?.data?.message || "Could not approve request.",
      );
      await loadRequest();
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    const normalizedReason = rejectionReason.trim();

    if (!normalizedReason) {
      toast.error("Rejection reason is required");
      return;
    }

    setActionLoading(true);

    try {
      const response = await api.patch(
        `/admin/restaurant-requests/${id}/reject`,
        {
          rejectionReason: normalizedReason,
        },
      );
      setRequestData(response.data?.restaurantRequest || requestData);
      setShowRejectModal(false);
      setRejectionReason("");
      toast.success(response.data?.message || "Request rejected successfully");
    } catch (requestError) {
      toast.error(
        requestError?.response?.data?.message || "Could not reject request.",
      );
      await loadRequest();
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <LoadingScreen message="Loading request details..." />;
  }

  if (error) {
    return <EmptyState title="Unable to load request" description={error} />;
  }

  if (!requestData) {
    return (
      <EmptyState
        title="Request not found"
        description="This restaurant request does not exist."
      />
    );
  }

  return (
    <section className="admin-page">
      <header className="admin-page-header">
        <h2>Restaurant Request Details</h2>
        <div className="admin-page-actions">
          <Link to="/restaurant-requests" className="admin-inline-link">
            Back to requests
          </Link>
          <button
            type="button"
            className="admin-primary-btn"
            onClick={loadRequest}
            disabled={actionLoading}
          >
            Refresh
          </button>
        </div>
      </header>

      <div className="admin-action-row">
        <button
          type="button"
          className="admin-primary-btn"
          disabled={!canTakeAction || actionLoading}
          onClick={handleApprove}
        >
          {actionLoading ? "Processing..." : "Approve Request"}
        </button>
        <button
          type="button"
          className="admin-secondary-btn"
          disabled={!canTakeAction || actionLoading}
          onClick={() => setShowRejectModal(true)}
        >
          Reject Request
        </button>
      </div>

      <div className="admin-detail-grid">
        <article className="admin-detail-card">
          <h3>Restaurant</h3>
          <p>
            <strong>Name:</strong> {requestData.restaurantName}
          </p>
          <p>
            <strong>Status:</strong> {requestData.status}
          </p>
          <p>
            <strong>Category:</strong> {requestData.category?.name || "-"}
          </p>
          <p>
            <strong>Address:</strong> {requestData.address}
          </p>
          <p>
            <strong>Coordinates:</strong>{" "}
            {requestData.coordinates?.lat !== undefined &&
            requestData.coordinates?.lng !== undefined
              ? `${requestData.coordinates.lat}, ${requestData.coordinates.lng}`
              : "-"}
          </p>
          <p>
            <strong>Description:</strong> {requestData.description || "-"}
          </p>
          <p>
            <strong>Submitted:</strong>{" "}
            {new Date(requestData.submittedAt).toLocaleString()}
          </p>
          <p>
            <strong>Reviewed:</strong>{" "}
            {requestData.reviewedAt
              ? new Date(requestData.reviewedAt).toLocaleString()
              : "-"}
          </p>
        </article>

        <article className="admin-detail-card">
          <h3>Owner</h3>
          <p>
            <strong>Name:</strong> {requestData.owner?.name || "-"}
          </p>
          <p>
            <strong>Contact:</strong> {requestData.owner?.contactName || "-"}
          </p>
          <p>
            <strong>Email:</strong> {requestData.owner?.email || "-"}
          </p>
          <p>
            <strong>Phone:</strong> {requestData.owner?.phone || "-"}
          </p>
          <p>
            <strong>GST:</strong> {requestData.gst || "-"}
          </p>
          <p>
            <strong>FSSAI:</strong> {requestData.fssai || "-"}
          </p>
          <p>
            <strong>PAN:</strong> {requestData.pan || "-"}
          </p>
          <p>
            <strong>Bank Holder:</strong>{" "}
            {requestData.bankDetails?.accountHolderName || "-"}
          </p>
          <p>
            <strong>Bank Account:</strong>{" "}
            {requestData.bankDetails?.accountNumber || "-"}
          </p>
          <p>
            <strong>IFSC:</strong> {requestData.bankDetails?.ifsc || "-"}
          </p>
          <p>
            <strong>Bank Name:</strong>{" "}
            {requestData.bankDetails?.bankName || "-"}
          </p>
          <p>
            <strong>Branch:</strong>{" "}
            {requestData.bankDetails?.branchName || "-"}
          </p>
          <p>
            <strong>Rejection Reason:</strong>{" "}
            {requestData.rejectionReason || "-"}
          </p>
        </article>

        <article className="admin-detail-card admin-detail-card--media">
          <h3>Media</h3>
          <div className="admin-media-grid">
            {(requestData.restaurantImages || []).length === 0 ? (
              <p>No restaurant images uploaded.</p>
            ) : (
              requestData.restaurantImages.map((imageUrl) => (
                <a
                  key={imageUrl}
                  href={imageUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  <img src={imageUrl} alt="Restaurant evidence" />
                </a>
              ))
            )}
          </div>

          <div className="admin-video-wrap">
            {requestData.restaurantVideo ? (
              <video src={requestData.restaurantVideo} controls />
            ) : (
              <p>No verification video uploaded.</p>
            )}
          </div>
        </article>
      </div>

      {showRejectModal && (
        <div className="admin-modal-backdrop" role="presentation">
          <div className="admin-modal" role="dialog" aria-modal="true">
            <h3>Reject Restaurant Request</h3>
            <p>Reason is required to reject this request.</p>
            <textarea
              rows="4"
              value={rejectionReason}
              onChange={(event) => setRejectionReason(event.target.value)}
              placeholder="Enter rejection reason"
            />
            <div className="admin-modal-actions">
              <button
                type="button"
                className="admin-secondary-btn"
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason("");
                }}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-primary-btn"
                onClick={handleReject}
                disabled={actionLoading}
              >
                {actionLoading ? "Rejecting..." : "Confirm Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default RestaurantRequestDetails;
