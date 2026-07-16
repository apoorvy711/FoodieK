import { useEffect, useMemo, useState } from "react";
import "../../styles/profile.css";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../api/api";
import { resolveMediaUrl } from "../../utils/media";

const Profile = () => {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [videos, setVideos] = useState([]);
  const [activeTab, setActiveTab] = useState("menu");
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get(`/food-partner/${id}`);
        setProfile(response.data.foodPartner);
        setVideos(response.data.foodPartner.foodItems || []);
      } catch (error) {
        toast.error("Could not load restaurant profile");
      }
    };

    fetchProfile();
  }, [id]);

  const ratingSummary = useMemo(() => {
    if (!videos.length) {
      return "0.0";
    }

    const total = videos.reduce((sum, item) => sum + (item.rating || 0), 0);
    return (total / videos.length).toFixed(1);
  }, [videos]);

  const coverImageUrl = resolveMediaUrl(
    profile?.coverImage || profile?.avatar,
    "",
  );
  const avatarImageUrl = resolveMediaUrl(profile?.avatar, "");

  const shareProfile = async () => {
    const shareUrl = `${window.location.origin}/food-partner/${id}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: profile?.name,
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Store link copied");
      }
    } catch (error) {
      toast.error("Sharing failed");
    }
  };

  return (
    <main className="profile-page">
      <section className="profile-header">
        <div
          className="cover-banner"
          style={
            coverImageUrl ? { backgroundImage: `url(${coverImageUrl})` } : {}
          }
        />
        <div className="profile-meta">
          {avatarImageUrl ? (
            <img
              className="profile-avatar"
              src={avatarImageUrl}
              alt="Restaurant avatar"
            />
          ) : (
            <div
              className="profile-avatar profile-avatar--placeholder"
              aria-hidden="true"
            >
              {profile?.name?.[0] || "R"}
            </div>
          )}
          <div className="profile-info">
            <h1 className="profile-pill profile-business">{profile?.name}</h1>
            <p className="profile-pill profile-address">{profile?.address}</p>
          </div>
        </div>

        <div className="profile-actions">
          <button type="button" className="btn-primary" onClick={shareProfile}>
            Share
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              setIsFollowing((prev) => !prev);
              toast.success(
                isFollowing ? "Unfollowed store" : "Following store",
              );
            }}
          >
            {isFollowing ? "Following" : "Follow"}
          </button>
        </div>

        <div className="profile-stats" role="list" aria-label="Stats">
          <div className="profile-stat" role="listitem">
            <span className="profile-stat-label">Rating</span>
            <span className="profile-stat-value">{ratingSummary}</span>
          </div>
          <div className="profile-stat" role="listitem">
            <span className="profile-stat-label">Followers</span>
            <span className="profile-stat-value">
              {profile?.followersCount ?? 0}
            </span>
          </div>
          <div className="profile-stat" role="listitem">
            <span className="profile-stat-label">Meals</span>
            <span className="profile-stat-value">{videos.length}</span>
          </div>
          <div className="profile-stat" role="listitem">
            <span className="profile-stat-label">Videos</span>
            <span className="profile-stat-value">{videos.length}</span>
          </div>
        </div>
      </section>

      <section className="profile-tabs">
        <button
          type="button"
          className={`tab-btn ${activeTab === "menu" ? "is-active" : ""}`}
          onClick={() => setActiveTab("menu")}
        >
          Menu
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === "reviews" ? "is-active" : ""}`}
          onClick={() => setActiveTab("reviews")}
        >
          Reviews
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === "about" ? "is-active" : ""}`}
          onClick={() => setActiveTab("about")}
        >
          About
        </button>
      </section>

      <section className="profile-content">
        {activeTab === "menu" && (
          <div className="profile-grid" aria-label="Videos">
            {videos.map((v) => (
              <Link
                key={v._id}
                className="profile-grid-item"
                to={`/food/${v._id}`}
              >
                <img
                  className="profile-grid-image"
                  src={v.thumbnail ? resolveMediaUrl(v.thumbnail, "") : ""}
                  alt={v.name}
                  loading="lazy"
                  decoding="async"
                />
              </Link>
            ))}
          </div>
        )}

        {activeTab === "reviews" && (
          <div className="glass-card review-card">
            <h3>Customer reviews</h3>
            <p>
              {ratingSummary}/5 average rating based on {videos.length} dishes.
            </p>
            <p>
              Healthy, fast, and restaurant-quality reels are now being surfaced
              directly from this store profile.
            </p>
          </div>
        )}

        {activeTab === "about" && (
          <div className="glass-card review-card">
            <h3>About this partner</h3>
            <p>
              {profile?.contactName || "Restaurant manager"} manages the kitchen
              and delivery experience.
            </p>
            <p>Location: {profile?.address}</p>
          </div>
        )}
      </section>
    </main>
  );
};

export default Profile;
