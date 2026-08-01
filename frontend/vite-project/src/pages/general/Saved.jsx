import React, { useEffect, useState } from "react";
import "../../styles/reels.css";
import api from "../../api/api";
import ReelFeed from "../../components/ReelFeed";

const Saved = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSavedFoods = async () => {
    try {
      setLoading(true);
      const response = await api.get("/food/save");

      const savedFoods = (response.data.savedFoods || [])
        .filter((item) => item.food?._id)
        .map((item) => ({
          ...item.food,
          _id: item.food._id,
        }));

      if (savedFoods.length > 0) {
        setVideos(savedFoods);
        return;
      }

      const fallbackResponse = await api.get("/food");
      setVideos((fallbackResponse.data.foodItems || []).slice(0, 6));
    } catch (error) {
      setVideos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSavedFoods();
  }, []);

  const removeSaved = async (item) => {
    try {
      await api.post("/food/save", { foodId: item._id });
      setVideos((prev) => prev.filter((video) => video._id !== item._id));
    } catch {
      // noop
    }
  };

  return (
    <ReelFeed
      items={videos}
      onSave={removeSaved}
      isLoading={loading}
      emptyTitle={loading ? "Loading saved dishes" : "No saved dishes yet"}
      emptyMessage={
        loading
          ? "Your saved list is being prepared."
          : "Save dishes to build your personal collection."
      }
    />
  );
};

export default Saved;
