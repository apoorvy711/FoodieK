import { useEffect, useMemo, useRef, useState } from "react";
import {
  Link,
  useLocation,
  useParams,
  useSearchParams,
} from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../api/api";
import "../../styles/food-detail.css";
import { resolveMediaUrl } from "../../utils/media";
import AuthRequiredModal from "../../components/auth/AuthRequiredModal";
import { useAuthRequiredModal } from "../../hooks/useAuthRequiredModal";

const FoodDetail = () => {
  const { id } = useParams();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [food, setFood] = useState(() => location.state?.food || null);
  const [relatedFoods, setRelatedFoods] = useState([]);
  const videoRef = useRef(null);
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const clickTimeoutRef = useRef(null);
  const lastClickRef = useRef(0);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { requireCustomerAuth, modalConfig, closeAuthModal } =
    useAuthRequiredModal();

  const fetchFoodDetail = async () => {
    try {
      const response = await api.get(`/food/${id}`);
      setFood(response.data.food);
      setRelatedFoods(response.data.relatedFoods || []);
    } catch (error) {
      if (!location.state?.food) {
        toast.error("Could not load food details");
      }
    }
  };

  const fetchComments = async () => {
    try {
      const response = await api.get(`/comments/${id}`);
      setComments(response.data.comments || []);
    } catch (error) {
      setComments([]);
    }
  };

  useEffect(() => {
    if (!id) return;

    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchFoodDetail(), fetchComments()]);
      setLoading(false);
    };

    loadData();
  }, [id, location.state]);

  useEffect(() => {
    if (searchParams.get("openComments") === "1") {
      if (
        !requireCustomerAuth({
          title: "Login to view comments",
          description:
            "Please login with your customer account to view comments.",
        })
      ) {
        const nextParams = new URLSearchParams(searchParams);
        nextParams.delete("openComments");
        setSearchParams(nextParams, { replace: true });
        return;
      }

      setCommentModalOpen(true);
    }
  }, [id, requireCustomerAuth, searchParams, setSearchParams]);

  const ingredients = useMemo(() => food?.ingredients || [], [food]);

  const handleLike = async () => {
    if (
      !requireCustomerAuth({
        title: "Login to like this food",
        description: "Please login with your user account to like this item.",
      })
    ) {
      return;
    }

    try {
      await api.post("/food/like", { foodId: id });
      toast.success("Reaction updated");
    } catch (error) {
      if (error?.response?.status === 401) {
        return;
      }

      toast.error("Could not update like");
    }
  };

  const handleSave = async () => {
    if (
      !requireCustomerAuth({
        title: "Login to save this food",
        description:
          "Please login with your customer account to save this item.",
      })
    ) {
      return;
    }

    try {
      await api.post("/food/save", { foodId: id });
      toast.success("Saved state updated");
    } catch (error) {
      if (error?.response?.status === 401) {
        return;
      }

      toast.error("Could not update save state");
    }
  };

  const handleShare = async () => {
    try {
      const shareUrl = `${window.location.origin}/food/${id}`;

      if (navigator.share) {
        await navigator.share({
          title: food?.name,
          text: food?.description,
          url: shareUrl,
        });
      } else {
        const temporaryInput = document.createElement("textarea");
        temporaryInput.value = shareUrl;
        temporaryInput.setAttribute("readonly", "");
        temporaryInput.style.position = "fixed";
        temporaryInput.style.opacity = "0";
        document.body.appendChild(temporaryInput);
        temporaryInput.select();
        const copied = document.execCommand("copy");
        document.body.removeChild(temporaryInput);

        if (!copied) {
          throw new Error("Sharing is not supported in this browser");
        }
      }

      const { data } = await api.post("/food/share", { foodId: id });
      setFood((current) =>
        current ? { ...current, shareCount: data.shareCount } : current,
      );
      toast.success(
        navigator.share ? "Food shared" : "Food link copied to clipboard",
      );
    } catch (error) {
      if (error?.name === "AbortError") return;
      toast.error("Could not share the food item");
    }
  };

  const handleAddToCart = async () => {
    if (
      !requireCustomerAuth({
        title: "Login to add to cart",
        description: "Please login with your customer account before ordering.",
      })
    ) {
      return;
    }

    try {
      await api.post("/orders/cart", { foodId: id, quantity: 1 });
      toast.success("Added to cart");
    } catch (error) {
      if (error?.response?.status === 401) {
        return;
      }

      toast.error("Could not add item to cart");
    }
  };

  const toggleVideoPlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().catch(() => {});
      setIsVideoPlaying(true);
    } else {
      video.pause();
      setIsVideoPlaying(false);
    }
  };

  const toggleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;

    if (document.fullscreenElement === video) {
      document.exitFullscreen().catch(() => {});
    } else if (video.requestFullscreen) {
      video.requestFullscreen().catch(() => {});
    }
  };

  const handleVideoClick = () => {
    const now = Date.now();

    if (now - lastClickRef.current < 300) {
      clearTimeout(clickTimeoutRef.current);
      lastClickRef.current = 0;
      toggleFullscreen();
      return;
    }

    lastClickRef.current = now;
    clickTimeoutRef.current = window.setTimeout(() => {
      toggleVideoPlay();
      lastClickRef.current = 0;
    }, 280);
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || !video.duration) return;

    setVideoProgress((video.currentTime / video.duration) * 100);
  };

  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (!video) return;

    setVideoDuration(video.duration || 0);
  };

  useEffect(() => {
    return () => {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
    };
  }, []);

  const handleCommentSubmit = async (e) => {
    e.preventDefault();

    if (
      !requireCustomerAuth({
        title: "Login to comment",
        description:
          "Please login with your customer account to post comments.",
      })
    ) {
      return;
    }

    if (!commentText.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }

    try {
      const { data } = await api.post("/comments", {
        foodId: id,
        text: commentText,
      });
      setCommentText("");
      setComments((current) => [data.comment, ...current]);
      setFood((current) =>
        current
          ? { ...current, commentsCount: (current.commentsCount || 0) + 1 }
          : current,
      );
      toast.success("Comment posted");
    } catch (error) {
      if (error?.response?.status === 401) {
        return;
      }

      toast.error("Could not post comment");
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <h2>Loading food details...</h2>
      </div>
    );
  }

  if (!food) {
    return (
      <div className="empty-state">
        <p>Food not found.</p>
      </div>
    );
  }

  return (
    <div className="food-detail-page">
      <Link className="food-detail-back" to="/">
        ← Back to feed
      </Link>

      <div className="food-detail-card">
        <div className="food-detail-media">
          <div
            className="food-detail-video-container"
            onClick={handleVideoClick}
          >
            <video
              ref={videoRef}
              src={resolveMediaUrl(food.video)}
              autoPlay
              loop
              muted
              playsInline
              controls={false}
              disablePictureInPicture
              controlsList="nodownload"
              className="food-detail-video"
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onPlay={() => setIsVideoPlaying(true)}
              onPause={() => setIsVideoPlaying(false)}
              onContextMenu={(event) => event.preventDefault()}
            />
            <div className="food-detail-video-progress">
              <div
                className="food-detail-video-progress__bar"
                style={{ width: `${videoProgress}%` }}
              />
            </div>
          </div>
        </div>

        <div className="food-detail-body">
          <div className="food-detail-header-row">
            <div>
              <div className="food-detail-kicker">{food.category?.name}</div>
              <h1>{food.name}</h1>
            </div>
            <div className="food-detail-rating">⭐ {food.rating ?? 4.8}</div>
          </div>

          <p className="food-detail-description">{food.description}</p>

          <div className="food-detail-meta-grid">
            <div className="glass-card">
              <span>Price</span>
              <strong>₹{food.price ?? 0}</strong>
            </div>
            <div className="glass-card">
              <span>Prep time</span>
              <strong>{food.preparationTime ?? food.prepTime ?? 20} min</strong>
            </div>
            <div className="glass-card">
              <span>Distance</span>
              <strong>{food.distanceKm ?? 2.5} km</strong>
            </div>
            <div className="glass-card">
              <span>Availability</span>
              <strong>
                {food.isAvailable === false ? "Unavailable" : "Available"}
              </strong>
            </div>
          </div>

          <div className="food-detail-section">
            <h2>Ingredients</h2>
            <div className="pill-group">
              {ingredients.length > 0 ? (
                ingredients.map((ingredient) => (
                  <span key={ingredient} className="pill-chip">
                    {ingredient}
                  </span>
                ))
              ) : (
                <span className="pill-chip">Chef special ingredients</span>
              )}
            </div>
          </div>

          <div className="food-detail-section">
            <h2>Restaurant</h2>
            <div className="profile-pill-row">
              <span className="profile-pill">
                {food.restaurantName || food.foodPartner?.name}
              </span>
              <Link
                className="reel-btn reel-btn--ghost"
                to={`/food-partner/${food.foodPartner?._id}`}
              >
                Visit store
              </Link>
            </div>
          </div>

          <div className="food-detail-actions">
            <button
              type="button"
              className="btn-primary"
              onClick={handleAddToCart}
            >
              Add to cart
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={handleLike}
            >
              Like
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={handleSave}
            >
              Save
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={handleShare}
            >
              Share
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                if (
                  !requireCustomerAuth({
                    title: "Login to read and post comments",
                    description:
                      "Please login with your customer account to open comments.",
                  })
                ) {
                  return;
                }

                setCommentModalOpen(true);
              }}
            >
              Comments
            </button>
          </div>
        </div>
      </div>

      <section className="food-detail-section">
        <h2>Related foods</h2>
        <div className="related-food-grid">
          {relatedFoods.map((item) => (
            <Link
              key={item._id}
              className="related-food-card"
              to={`/food/${item._id}`}
            >
              <video
                src={item.video}
                className="related-food-video"
                muted
                playsInline
              />
              <div className="related-food-copy">
                <strong>{item.name}</strong>
                <span>{item.restaurantName || item.foodPartner?.name}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {commentModalOpen && (
        <div
          className="comment-modal-backdrop"
          onClick={() => setCommentModalOpen(false)}
        >
          <div className="comment-modal" onClick={(e) => e.stopPropagation()}>
            <div className="comment-modal-header">
              <h3>Comments</h3>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => {
                  setCommentModalOpen(false);
                  const nextParams = new URLSearchParams(searchParams);
                  nextParams.delete("openComments");
                  setSearchParams(nextParams, { replace: true });
                }}
              >
                Close
              </button>
            </div>

            <div className="comment-list">
              {comments.length === 0 ? (
                <p className="empty-state-inline">
                  No comments yet. Start the conversation.
                </p>
              ) : (
                comments.map((comment) => (
                  <div key={comment._id} className="comment-item">
                    <strong>{comment.user?.fullName || "FoodieK user"}</strong>
                    <p>{comment.text}</p>
                  </div>
                ))
              )}
            </div>

            <form className="comment-form" onSubmit={handleCommentSubmit}>
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                rows={3}
                placeholder="Write your comment"
              />
              <button type="submit" className="btn-primary">
                Post comment
              </button>
            </form>
          </div>
        </div>
      )}

      <AuthRequiredModal
        open={Boolean(modalConfig)}
        title={modalConfig?.title}
        description={modalConfig?.description}
        primaryLabel={modalConfig?.primaryLabel}
        primaryTo={modalConfig?.primaryTo}
        secondaryLabel={modalConfig?.secondaryLabel}
        secondaryTo={modalConfig?.secondaryTo}
        onClose={closeAuthModal}
      />
    </div>
  );
};

export default FoodDetail;
