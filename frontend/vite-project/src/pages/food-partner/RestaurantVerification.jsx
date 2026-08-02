import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../api/api";
import { useAuth } from "../../auth/AuthContext";
import BackButton from "../../components/navigation/BackButton";
import RestaurantVerificationStatusCard from "../../components/food-partner/RestaurantVerificationStatusCard";
import RestaurantRequestForm from "../../components/food-partner/RestaurantRequestForm";
import "../../styles/create-food.css";
import "../../styles/restaurant-verification.css";

const RestaurantVerification = () => {
  const auth = useAuth();
  const {
    isFoodPartner,
    refreshRestaurantVerification,
    authResolved,
    verificationLoading,
    restaurantVerification,
  } = auth;

  const [categories, setCategories] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const verification = restaurantVerification;

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await api.get("/categories");
        setCategories(response.data.categories || []);
      } catch {
        toast.error("Failed to load categories");
      } finally {
        setLoadingCategories(false);
      }
    };

    loadCategories();
  }, []);

  useEffect(() => {
    if (isFoodPartner) {
      refreshRestaurantVerification();
    }
  }, [isFoodPartner, refreshRestaurantVerification]);

  const shouldShowForm = useMemo(() => {
    if (!verification) {
      return true;
    }

    return (
      verification.status === "not_submitted" ||
      verification.status === "rejected"
    );
  }, [verification]);

  const submitLabel =
    verification?.status === "rejected" ? "Resubmit Request" : "Submit Request";

  async function handleSubmit(payload) {
    setSubmitting(true);

    try {
      const response = await api.post("/restaurant-request", payload, {
        withCredentials: true,
      });

      toast.success(
        response.data?.message || "Restaurant request submitted successfully",
      );

      await refreshRestaurantVerification();
    } catch (error) {
      const message =
        error?.response?.data?.message || "Failed to submit restaurant request";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (!authResolved || verificationLoading) {
    return (
      <div className="loading-screen">
        <h2>Checking restaurant verification...</h2>
      </div>
    );
  }

  if (!isFoodPartner) {
    return (
      <main className="profile-page">
        <section className="profile-header">
          <h1 className="profile-business">Food partner access required</h1>
          <p className="profile-address">
            Please login with a food partner account.
          </p>
          <div>
            <Link className="btn-primary" to="/food-partner/login">
              Food Partner Login
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="profile-page restaurant-verification-page">
      <section className="profile-header">
        <div className="page-top-row">
          <BackButton />
        </div>

        <RestaurantVerificationStatusCard verification={verification} />

        {verification?.status === "approved" && (
          <div className="verification-approved-actions">
            <Link to="/food-partner/account" className="btn-primary">
              Open Partner Dashboard
            </Link>
            <Link to="/create-food" className="btn-secondary">
              Create Food
            </Link>
          </div>
        )}
      </section>

      {shouldShowForm && (
        <section className="create-food-card verification-form-card">
          <div className="create-food-header">
            <h2 className="create-food-title">Restaurant Verification Form</h2>
            <p className="create-food-subtitle">
              Submit valid details and media so our team can verify and activate
              your restaurant.
            </p>
          </div>

          {loadingCategories ? (
            <div className="loading-screen verification-inline-loader">
              <h2>Loading categories...</h2>
            </div>
          ) : (
            <RestaurantRequestForm
              key={verification?.request?._id || verification?.status || "new"}
              categories={categories}
              initialRequest={verification?.request}
              loading={submitting}
              onSubmit={handleSubmit}
              submitLabel={submitLabel}
            />
          )}
        </section>
      )}
    </main>
  );
};

export default RestaurantVerification;
