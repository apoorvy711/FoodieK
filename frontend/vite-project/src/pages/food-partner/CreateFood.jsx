import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";
import "../../styles/create-food.css";

const CreateFood = () => {
  const navigate = useNavigate();

  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(false);

  const [categories, setCategories] = useState([]);

  const [videoFile, setVideoFile] = useState(null);
  const [videoURL, setVideoURL] = useState("");

  const [fileError, setFileError] = useState("");

  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "",

    price: "",

    preparationTime: 20,

    foodType: "Veg",

    cuisine: "",

    spiceLevel: "Medium",

    ingredients: "",

    tags: "",

    isAvailable: true,
  });

  // ==========================================
  // Load Categories
  // ==========================================

  useEffect(() => {
    async function loadCategories() {
      try {
        const response = await api.get("/categories");

        setCategories(response.data.categories || []);
      } catch (err) {
        console.log(err);
      }
    }

    loadCategories();
  }, []);

  // ==========================================
  // Video Preview
  // ==========================================

  useEffect(() => {
    if (!videoFile) {
      setVideoURL("");
      return;
    }

    const url = URL.createObjectURL(videoFile);

    setVideoURL(url);

    return () => URL.revokeObjectURL(url);
  }, [videoFile]);

  // ==========================================
  // Input Handler
  // ==========================================

  function handleChange(e) {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  // ==========================================
  // Video Change
  // ==========================================

  function handleVideo(e) {
    const file = e.target.files[0];

    if (!file) return;

    if (!file.type.startsWith("video/")) {
      setFileError("Please upload a valid video.");
      return;
    }

    setFileError("");

    setVideoFile(file);
  }

  // ==========================================
  // Open File Picker
  // ==========================================

  function openFile() {
    fileInputRef.current.click();
  }

  // ==========================================
  // Submit
  // ==========================================

  async function handleSubmit(e) {
    e.preventDefault();

    if (!videoFile) {
      return alert("Please upload a video.");
    }

    setLoading(true);

    try {
      const data = new FormData();

      data.append("video", videoFile);

      Object.keys(form).forEach((key) => {
        data.append(key, form[key]);
      });

      await api.post("/food", data, {
        withCredentials: true,
      });

      alert("Food Uploaded Successfully");

      navigate("/");
    } catch (err) {
      console.log(err);

      alert(err.response?.data?.message || "Upload failed.");
    }

    setLoading(false);
  }

  const isDisabled = useMemo(() => {
    return !videoFile || !form.name || !form.category || !form.price;
  }, [videoFile, form]);

  return (
    <div className="create-food-page">
      <div className="create-food-card">
        <div className="create-food-header">
          <h1 className="create-food-title">Upload New Food</h1>

          <p className="create-food-subtitle">
            Share your delicious food with thousands of food lovers.
          </p>
        </div>

        <form className="create-food-form" onSubmit={handleSubmit}>
          {/* ================= Upload ================= */}

          <div className="field-group">
            <label>Food Video</label>

            <input
              ref={fileInputRef}
              className="file-input-hidden"
              type="file"
              accept="video/*"
              onChange={handleVideo}
            />

            <div className="file-dropzone" onClick={openFile}>
              <div className="file-dropzone-inner">
                <h3>Click to Upload Video</h3>

                <p>MP4 • MOV • WEBM</p>
              </div>
            </div>

            {fileError && <p className="error-text">{fileError}</p>}
          </div>

          {videoURL && (
            <div className="video-preview">
              <video className="video-preview-el" src={videoURL} controls />
            </div>
          )}

          {/* ================= Category ================= */}

          <div className="field-group">
            <label>Category</label>

            <select
              name="category"
              value={form.category}
              onChange={handleChange}
            >
              <option value="">Select Category</option>

              {categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* ================= Name ================= */}

          <div className="field-group">
            <label>Food Name</label>

            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Paneer Pizza"
            />
          </div>

          {/* ================= Description ================= */}

          <div className="field-group">
            <label>Description</label>

            <textarea
              rows="4"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Describe your food..."
            />
          </div>

          {/* ================= Price ================= */}

          <div className="field-group">
            <label>Price (₹)</label>

            <input
              type="number"
              name="price"
              value={form.price}
              onChange={handleChange}
            />
          </div>

          {/* ================= Preparation ================= */}

          <div className="field-group">
            <label>Preparation Time (minutes)</label>

            <input
              type="number"
              name="preparationTime"
              value={form.preparationTime}
              onChange={handleChange}
            />
          </div>

          {/* ================= Food Type ================= */}

          <div className="field-group">
            <label>Food Type</label>

            <select
              name="foodType"
              value={form.foodType}
              onChange={handleChange}
            >
              <option>Veg</option>

              <option>Non Veg</option>

              <option>Vegan</option>
            </select>
          </div>

          {/* ================= Cuisine ================= */}

          <div className="field-group">
            <label>Cuisine</label>

            <input
              type="text"
              name="cuisine"
              value={form.cuisine}
              onChange={handleChange}
              placeholder="Indian"
            />
          </div>
          {/* ================= Spice Level ================= */}

          <div className="field-group">
            <label>Spice Level</label>

            <select
              name="spiceLevel"
              value={form.spiceLevel}
              onChange={handleChange}
            >
              <option>Mild</option>
              <option>Medium</option>
              <option>Hot</option>
              <option>Extra Hot</option>
            </select>
          </div>

          {/* ================= Ingredients ================= */}

          <div className="field-group">
            <label>Ingredients</label>

            <input
              type="text"
              name="ingredients"
              value={form.ingredients}
              onChange={handleChange}
              placeholder="Paneer, Cheese, Onion, Capsicum"
            />

            <small className="small-note">
              Separate ingredients using commas.
            </small>
          </div>

          {/* ================= Tags ================= */}

          <div className="field-group">
            <label>Tags</label>

            <input
              type="text"
              name="tags"
              value={form.tags}
              onChange={handleChange}
              placeholder="Pizza, Italian, Cheese"
            />

            <small className="small-note">Separate tags using commas.</small>
          </div>

          {/* ================= Availability ================= */}

          <div className="field-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="isAvailable"
                checked={form.isAvailable}
                onChange={handleChange}
              />

              <span>Available for Orders</span>
            </label>
          </div>

          {/* ================= Submit ================= */}

          <div className="form-actions">
            <button
              type="submit"
              className="btn-primary"
              disabled={loading || isDisabled}
            >
              {loading ? "Uploading..." : "Upload Food"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateFood;
