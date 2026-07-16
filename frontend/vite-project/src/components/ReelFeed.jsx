import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/api";
import { resolveMediaUrl } from "../utils/media";

const ReelFeed = ({
  items = [],
  onLike,
  onSave,
  onShare,
  onOrder,
  onComment,
  emptyMessage = "No videos yet.",
  emptyTitle = "Nothing to see here yet",
  emptyDescription = "New food stories will appear here shortly.",
}) => {
  const videoRefs = useRef(new Map());
  const [feedItems, setFeedItems] = useState(items);
  const [commentFood, setCommentFood] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [isCommentSubmitting, setIsCommentSubmitting] = useState(false);

  useEffect(() => {
    setFeedItems(items);
  }, [items]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target;

          if (!(video instanceof HTMLVideoElement)) return;

          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            video.play().catch(() => {});
          } else {
            video.pause();
          }
        });
      },
      {
        threshold: [0, 0.25, 0.6, 0.9, 1],
      },
    );

    videoRefs.current.forEach((video) => observer.observe(video));

    return () => observer.disconnect();
  }, [items]);

  const setVideoRef = (id) => (el) => {
    if (!el) {
      videoRefs.current.delete(id);
      return;
    }

    videoRefs.current.set(id, el);
  };

  const openComments = async (item) => {
    setCommentFood(item);
    setCommentText("");
    setComments([]);

    try {
      const { data } = await api.get(`/comments/${item._id}`);
      setComments(data.comments || []);
    } catch (error) {
      if (error?.response?.status === 401) {
        return;
      }

      toast.error(error.response?.data?.message || "Could not load comments");
    }
  };

  const submitComment = async (event) => {
    event.preventDefault();
    const text = commentText.trim();

    if (!text || !commentFood) {
      toast.error("Comment cannot be empty");
      return;
    }

    try {
      setIsCommentSubmitting(true);
      const { data } = await api.post("/comments", {
        foodId: commentFood._id,
        text,
      });

      setComments((current) => [data.comment, ...current]);
      setCommentText("");
      setFeedItems((current) =>
        current.map((entry) =>
          entry._id === commentFood._id
            ? { ...entry, commentsCount: (entry.commentsCount || 0) + 1 }
            : entry,
        ),
      );
      toast.success("Comment posted");
    } catch (error) {
      if (error?.response?.status === 401) {
        return;
      }

      toast.error(error.response?.data?.message || "Could not post comment");
    } finally {
      setIsCommentSubmitting(false);
    }
  };

  return (
    <div className="reels-page">
      <div className="reels-feed" role="list">
        {feedItems.length === 0 && (
          <div className="empty-state empty-state--hero">
            <div className="empty-state__icon">🍜</div>
            <h3>{emptyTitle}</h3>
            <p>{emptyMessage}</p>
            {emptyDescription && <p>{emptyDescription}</p>}
          </div>
        )}

        {feedItems.map((item) => {
          const partnerId =
            typeof item.foodPartner === "string"
              ? item.foodPartner
              : item.foodPartner?._id;

          return (
            <section key={item._id} className="reel" role="listitem">
              <video
                ref={setVideoRef(item._id)}
                className="reel-video"
                src={resolveMediaUrl(item.video)}
                poster={resolveMediaUrl(
                  item.thumbnail || item.foodPartner?.avatar,
                )}
                muted
                playsInline
                loop
                preload="metadata"
              />

              <div className="reel-overlay">
                <div className="reel-overlay-gradient" aria-hidden="true" />

                {/* Right Side Actions */}

                <div className="reel-actions">
                  <div className="reel-action-group">
                    <button
                      className="reel-action"
                      onClick={onLike ? () => onLike(item) : undefined}
                      aria-label="Like"
                    >
                      ❤️
                    </button>

                    <div className="reel-action__count">
                      {item.likeCount || 0}
                    </div>
                  </div>

                  <div className="reel-action-group">
                    <button
                      className="reel-action"
                      onClick={onSave ? () => onSave(item) : undefined}
                      aria-label="Save"
                    >
                      🔖
                    </button>

                    <div className="reel-action__count">
                      {item.savesCount || 0}
                    </div>
                  </div>

                  <div className="reel-action-group">
                    <button
                      className="reel-action"
                      onClick={
                        onComment
                          ? () => onComment(item)
                          : () => openComments(item)
                      }
                      aria-label="Comments"
                    >
                      💬
                    </button>

                    <div className="reel-action__count">
                      {item.commentsCount || 0}
                    </div>
                  </div>

                  <div className="reel-action-group">
                    <button
                      type="button"
                      className="reel-action"
                      onClick={onShare ? () => onShare(item) : undefined}
                      aria-label="Share"
                    >
                      📤
                    </button>

                    <div className="reel-action__count">
                      {item.shareCount || 0}
                    </div>
                  </div>
                </div>

                {/* Bottom Content */}

                <div className="reel-content">
                  <div className="reel-info-card">
                    <div className="reel-info-card__top">
                      <div>
                        <div className="reel-restaurant">
                          {item.foodPartner?.name || "FoodieK"}
                        </div>

                        <div className="reel-category">
                          {item.category?.name || "Food"}
                        </div>
                      </div>

                      <div className="reel-price">₹{item.price ?? 0}</div>
                    </div>

                    <div className="reel-stats">
                      <span>⭐ {item.rating ?? 4.5}</span>

                      <span>⏱ {item.preparationTime ?? 20} min</span>

                      {item.foodType && <span>🥗 {item.foodType}</span>}
                    </div>
                  </div>

                  <p className="reel-description" title={item.description}>
                    {item.description}
                  </p>

                  <div className="reel-cta-row">
                    <button
                      type="button"
                      className="reel-btn reel-btn--order"
                      onClick={onOrder ? () => onOrder(item) : undefined}
                    >
                      Order Now
                    </button>

                    <Link
                      className="reel-btn"
                      to={`/food/${item._id}`}
                      state={{ food: item }}
                    >
                      View Details
                    </Link>

                    {partnerId && (
                      <Link
                        className="reel-btn reel-btn--ghost"
                        to={`/food-partner/${partnerId}`}
                      >
                        Visit Store
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </section>
          );
        })}
      </div>

      {commentFood && (
        <div
          className="feed-comment-backdrop"
          onClick={() => setCommentFood(null)}
        >
          <section
            className="feed-comment-modal"
            role="dialog"
            aria-modal="true"
            aria-label={`Comments for ${commentFood.name}`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="feed-comment-header">
              <h2>Comments</h2>
              <button type="button" onClick={() => setCommentFood(null)}>
                Close
              </button>
            </div>

            <div className="feed-comment-list">
              {comments.length ? (
                comments.map((comment) => (
                  <article key={comment._id} className="feed-comment-item">
                    <strong>{comment.user?.fullName || "FoodieK user"}</strong>
                    <p>{comment.text}</p>
                  </article>
                ))
              ) : (
                <p>No comments yet. Start the conversation.</p>
              )}
            </div>

            <form className="feed-comment-form" onSubmit={submitComment}>
              <textarea
                value={commentText}
                onChange={(event) => setCommentText(event.target.value)}
                placeholder="Write a comment"
                rows={3}
                maxLength={400}
              />
              <button type="submit" disabled={isCommentSubmitting}>
                {isCommentSubmitting ? "Posting..." : "Post comment"}
              </button>
            </form>
          </section>
        </div>
      )}
    </div>
  );
};

export default ReelFeed;
