import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../api/api";
import { useAuth } from "../../auth/AuthContext";
import AuthRequiredModal from "../../components/auth/AuthRequiredModal";
import { useAuthRequiredModal } from "../../hooks/useAuthRequiredModal";
import "../../styles/reels.css";

import ReelFeed from "../../components/ReelFeed";
import HomeHeader from "../../components/home/HomeHeader";
import SearchBar from "../../components/home/SearchBar";
import CategoryBar from "../../components/home/CategoryBar";

const Home = () => {
  const [videos, setVideos] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [notificationsCount, setNotificationsCount] = useState(0);
  const [location, setLocation] = useState("Your location");
  const [locationInput, setLocationInput] = useState("Your location");
  const [showLocationEditor, setShowLocationEditor] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const auth = useAuth();
  const { requireCustomerAuth, modalConfig, closeAuthModal } =
    useAuthRequiredModal();

  const fetchCategories = async () => {
    try {
      const response = await api.get("/categories");
      setCategories(response.data.categories || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchNotifications = async () => {
    if (!auth.isUser) {
      setNotificationsCount(0);
      return;
    }

    try {
      const response = await api.get("/notifications");
      setNotificationsCount(response.data.unreadCount || 0);
    } catch (error) {
      setNotificationsCount(0);
    }
  };

  const fetchFoods = async (category = "", search = "") => {
    try {
      setLoading(true);

      const params = {};

      if (category) params.category = category;
      if (search.trim()) params.search = search.trim();

      const { data } = await api.get("/food", {
        params,
      });

      if (data.success) {
        setVideos(data.foodItems || []);
      } else {
        setVideos([]);
      }
    } catch (error) {
      console.error(error);

      setVideos([]);

      toast.error(error.response?.data?.message || "Could not fetch food feed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchNotifications();

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
            );

            if (!response.ok) {
              return;
            }

            const data = await response.json();
            const city =
              data.address?.city ||
              data.address?.town ||
              data.address?.village ||
              data.address?.county ||
              data.address?.state;

            if (city) {
              setLocation(city);
              setLocationInput(city);
            }
          } catch (error) {
            console.error("Unable to resolve location", error);
          }
        },
        (error) => {
          console.warn("Geolocation error:", error);
        },
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 600000 },
      );
    }
  }, [auth.isUser]);

  useEffect(() => {
    fetchFoods(selectedCategory, searchTerm);
  }, [selectedCategory, searchTerm]);

  const openLocationEditor = () => {
    setLocationInput(location);
    setShowLocationEditor(true);
  };

  const closeLocationEditor = () => {
    setShowLocationEditor(false);
  };

  const saveLocation = () => {
    const trimmedLocation = locationInput.trim();

    if (!trimmedLocation) {
      return;
    }

    setLocation(trimmedLocation);
    setShowLocationEditor(false);
  };

  const likeVideo = async (item) => {
    if (
      !requireCustomerAuth({
        title: "Login to like this dish",
        description: "Please login as a user to like and track your favorites.",
      })
    ) {
      return;
    }

    try {
      const { data } = await api.post("/food/like", {
        foodId: item._id,
      });

      setVideos((prev) =>
        prev.map((video) =>
          video._id === item._id
            ? {
                ...video,
                likeCount: data.likeCount,
              }
            : video,
        ),
      );
    } catch (error) {
      if (error?.response?.status === 401) {
        return;
      }

      toast.error(error.response?.data?.message || "Could not like food");
    }
  };

  const saveVideo = async (item) => {
    if (
      !requireCustomerAuth({
        title: "Login to save dishes",
        description:
          "Create a user account to save dishes and revisit them anytime.",
      })
    ) {
      return;
    }

    try {
      const { data } = await api.post("/food/save", {
        foodId: item._id,
      });

      setVideos((prev) =>
        prev.map((video) =>
          video._id === item._id
            ? {
                ...video,
                savesCount: data.savesCount,
              }
            : video,
        ),
      );
    } catch (error) {
      if (error?.response?.status === 401) {
        return;
      }

      toast.error(error.response?.data?.message || "Could not save food");
    }
  };
  /*
  const shareVideo = async (item) => {
    try {
      const shareUrl = `${window.location.origin}/food/${item._id}`;

      // Always copy link (works on Windows Chrome)
      await navigator.clipboard.writeText(shareUrl);

      const { data } = await api.post("/food/share", {
        foodId: item._id,
      });

      setVideos((prev) =>
        prev.map((video) =>
          video._id === item._id
            ? {
                ...video,
                shareCount: data.shareCount,
              }
            : video,
        ),
      );

      toast.success("Food link copied to clipboard");
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Could not share food");
    }
  };
*/
  const shareVideo = async (item) => {
    try {
      const shareUrl = `${window.location.origin}/food/${item._id}`;
      let shared = false;

      if (navigator.share) {
        await navigator.share({
          title: item.name || "FoodieK item",
          text: item.description || "Check out this food item",
          url: shareUrl,
        });
        shared = true;
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

      const { data } = await api.post("/food/share", {
        foodId: item._id,
      });

      setVideos((prev) =>
        prev.map((video) =>
          video._id === item._id
            ? {
                ...video,
                shareCount: data.shareCount,
              }
            : video,
        ),
      );

      toast.success(shared ? "Food shared" : "Food link copied to clipboard");
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Could not share food");
    }
  };

  const orderVideo = async (item) => {
    if (
      !requireCustomerAuth({
        title: "Login to place an order",
        description: "Please login with your customer account before ordering.",
      })
    ) {
      return;
    }

    try {
      const { data } = await api.post("/orders/cart", {
        foodId: item._id,
        quantity: 1,
      });

      toast.success(data.message || "Item added to cart");
    } catch (error) {
      if (error?.response?.status === 401) {
        return;
      }

      toast.error(
        error.response?.data?.message || "Could not add food to cart",
      );
    }
  };
  /*
  const commentVideo = (item) => {
    navigate(`/food/${item._id}`);
  };
*/
  const commentVideo = (item) => {
    if (
      !requireCustomerAuth({
        title: "Login to comment",
        description:
          "Please login with your customer account to join the conversation.",
      })
    ) {
      return;
    }

    navigate(`/food/${item._id}?openComments=1`);
  };
  return (
    <div className="home-page">
      <HomeHeader
        location={location}
        notificationsCount={notificationsCount}
        onEditLocation={openLocationEditor}
      />

      <SearchBar onSearch={setSearchTerm} />

      <CategoryBar
        categories={categories}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
      />

      {loading ? (
        <div className="loading-screen">
          <div className="skeleton-card" />
          <div className="skeleton-card" />
          <div className="skeleton-card" />
        </div>
      ) : (
        <ReelFeed
          items={videos}
          onLike={likeVideo}
          onSave={saveVideo}
          onShare={shareVideo}
          onOrder={orderVideo}
          onComment={commentVideo}
          emptyMessage="No food videos found for your current search."
          emptyTitle="Nothing matches your search yet"
          emptyDescription="Try another keyword or browse a different category to discover more dishes."
        />
      )}

      {showLocationEditor && (
        <div className="location-editor-backdrop" onClick={closeLocationEditor}>
          <section
            className="location-editor-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Change location"
            onClick={(event) => event.stopPropagation()}
          >
            <h2>Change location</h2>
            <p>
              Enter a city name to display instead of your current location.
            </p>
            <input
              type="text"
              value={locationInput}
              onChange={(event) => setLocationInput(event.target.value)}
              placeholder="Enter city name"
            />
            <div className="location-editor-actions">
              <button
                type="button"
                className="location-editor-btn"
                onClick={closeLocationEditor}
              >
                Cancel
              </button>
              <button
                type="button"
                className="location-editor-btn location-editor-btn--primary"
                onClick={saveLocation}
              >
                Save
              </button>
            </div>
          </section>
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

export default Home;
