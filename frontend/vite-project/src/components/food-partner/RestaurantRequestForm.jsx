import { useEffect, useMemo, useState } from "react";

function toInitialFormValues(initialRequest) {
  return {
    restaurantName: initialRequest?.restaurantName || "",
    description: initialRequest?.description || "",
    category:
      typeof initialRequest?.category === "object"
        ? initialRequest?.category?._id || ""
        : initialRequest?.category || "",
    address: initialRequest?.address || "",
    lat: initialRequest?.coordinates?.lat || "",
    lng: initialRequest?.coordinates?.lng || "",
    gst: initialRequest?.gst || "",
    fssai: initialRequest?.fssai || "",
    pan: initialRequest?.pan || "",
    accountHolderName: initialRequest?.bankDetails?.accountHolderName || "",
    accountNumber: initialRequest?.bankDetails?.accountNumber || "",
    ifsc: initialRequest?.bankDetails?.ifsc || "",
    bankName: initialRequest?.bankDetails?.bankName || "",
    branchName: initialRequest?.bankDetails?.branchName || "",
  };
}

const RestaurantRequestForm = ({
  categories,
  initialRequest,
  loading,
  onSubmit,
  submitLabel,
}) => {
  const [form, setForm] = useState(toInitialFormValues(initialRequest));
  const [restaurantImages, setRestaurantImages] = useState([]);
  const [restaurantVideo, setRestaurantVideo] = useState(null);
  const [formError, setFormError] = useState("");

  const videoPreviewUrl = useMemo(() => {
    if (!restaurantVideo) {
      return "";
    }

    return URL.createObjectURL(restaurantVideo);
  }, [restaurantVideo]);

  useEffect(() => {
    if (!videoPreviewUrl) {
      return;
    }

    return () => URL.revokeObjectURL(videoPreviewUrl);
  }, [videoPreviewUrl]);

  const canSubmit = useMemo(() => {
    return Boolean(
      form.restaurantName &&
      form.category &&
      form.address &&
      restaurantImages.length > 0 &&
      restaurantVideo,
    );
  }, [form, restaurantImages, restaurantVideo]);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function handleImages(event) {
    const files = Array.from(event.target.files || []);

    if (!files.length) {
      return;
    }

    const hasInvalidFile = files.some(
      (file) => !file.type.startsWith("image/"),
    );

    if (hasInvalidFile) {
      setFormError("All restaurant media images must be valid image files.");
      return;
    }

    setFormError("");
    setRestaurantImages(files.slice(0, 8));
  }

  function handleVideo(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("video/")) {
      setFormError("Restaurant verification video must be a valid video file.");
      return;
    }

    setFormError("");
    setRestaurantVideo(file);
  }

  async function submitForm(event) {
    event.preventDefault();

    if (!canSubmit) {
      setFormError(
        "Restaurant name, category, address, images and verification video are required.",
      );
      return;
    }

    setFormError("");

    const payload = new FormData();

    payload.append("restaurantName", form.restaurantName.trim());
    payload.append("description", form.description.trim());
    payload.append("category", form.category);
    payload.append("address", form.address.trim());

    if (form.lat || form.lng) {
      payload.append(
        "coordinates",
        JSON.stringify({
          lat: form.lat,
          lng: form.lng,
        }),
      );
    }

    if (form.gst) {
      payload.append("gst", form.gst.trim());
    }

    if (form.fssai) {
      payload.append("fssai", form.fssai.trim());
    }

    if (form.pan) {
      payload.append("pan", form.pan.trim());
    }

    const bankDetails = {
      accountHolderName: form.accountHolderName.trim(),
      accountNumber: form.accountNumber.trim(),
      ifsc: form.ifsc.trim(),
      bankName: form.bankName.trim(),
      branchName: form.branchName.trim(),
    };

    if (Object.values(bankDetails).some(Boolean)) {
      payload.append("bankDetails", JSON.stringify(bankDetails));
    }

    restaurantImages.forEach((file) => {
      payload.append("restaurantImages", file);
    });

    payload.append("restaurantVideo", restaurantVideo);

    await onSubmit(payload);
  }

  return (
    <form className="create-food-form" onSubmit={submitForm}>
      <div className="verification-form-grid">
        <div className="field-group">
          <label htmlFor="restaurantName">Restaurant Name</label>
          <input
            id="restaurantName"
            name="restaurantName"
            value={form.restaurantName}
            onChange={handleChange}
            placeholder="Tasty Bites Kitchen"
          />
        </div>

        <div className="field-group">
          <label htmlFor="category">Category</label>
          <select
            id="category"
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
      </div>

      <div className="field-group">
        <label htmlFor="address">Address</label>
        <input
          id="address"
          name="address"
          value={form.address}
          onChange={handleChange}
          placeholder="123 Main Road, City"
        />
      </div>

      <div className="field-group">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          rows="4"
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Tell us about your restaurant, cuisines, and service style"
        />
      </div>

      <div className="verification-form-grid">
        <div className="field-group">
          <label htmlFor="lat">Latitude</label>
          <input
            id="lat"
            name="lat"
            value={form.lat}
            onChange={handleChange}
            placeholder="26.8467"
          />
        </div>
        <div className="field-group">
          <label htmlFor="lng">Longitude</label>
          <input
            id="lng"
            name="lng"
            value={form.lng}
            onChange={handleChange}
            placeholder="80.9462"
          />
        </div>
      </div>

      <div className="verification-form-grid">
        <div className="field-group">
          <label htmlFor="gst">GST</label>
          <input
            id="gst"
            name="gst"
            value={form.gst}
            onChange={handleChange}
            placeholder="22AAAAA0000A1Z5"
          />
        </div>
        <div className="field-group">
          <label htmlFor="fssai">FSSAI</label>
          <input
            id="fssai"
            name="fssai"
            value={form.fssai}
            onChange={handleChange}
            placeholder="12345678901234"
          />
        </div>
      </div>

      <div className="field-group">
        <label htmlFor="pan">PAN</label>
        <input
          id="pan"
          name="pan"
          value={form.pan}
          onChange={handleChange}
          placeholder="ABCDE1234F"
        />
      </div>

      <div className="verification-subsection">
        <h3>Bank Details</h3>
      </div>

      <div className="verification-form-grid">
        <div className="field-group">
          <label htmlFor="accountHolderName">Account Holder Name</label>
          <input
            id="accountHolderName"
            name="accountHolderName"
            value={form.accountHolderName}
            onChange={handleChange}
            placeholder="Restaurant Owner"
          />
        </div>
        <div className="field-group">
          <label htmlFor="accountNumber">Account Number</label>
          <input
            id="accountNumber"
            name="accountNumber"
            value={form.accountNumber}
            onChange={handleChange}
            placeholder="1234567890"
          />
        </div>
      </div>

      <div className="verification-form-grid">
        <div className="field-group">
          <label htmlFor="ifsc">IFSC</label>
          <input
            id="ifsc"
            name="ifsc"
            value={form.ifsc}
            onChange={handleChange}
            placeholder="HDFC0001234"
          />
        </div>
        <div className="field-group">
          <label htmlFor="bankName">Bank Name</label>
          <input
            id="bankName"
            name="bankName"
            value={form.bankName}
            onChange={handleChange}
            placeholder="HDFC Bank"
          />
        </div>
      </div>

      <div className="field-group">
        <label htmlFor="branchName">Branch Name</label>
        <input
          id="branchName"
          name="branchName"
          value={form.branchName}
          onChange={handleChange}
          placeholder="Hazratganj"
        />
      </div>

      <div className="field-group">
        <label>Restaurant Images</label>
        <input type="file" accept="image/*" multiple onChange={handleImages} />
        <small className="small-note">Upload up to 8 images.</small>
        {restaurantImages.length > 0 && (
          <p className="small-note">
            Selected: {restaurantImages.map((file) => file.name).join(", ")}
          </p>
        )}
      </div>

      <div className="field-group">
        <label>Restaurant Verification Video</label>
        <input type="file" accept="video/*" onChange={handleVideo} />
        {videoPreviewUrl && (
          <div className="video-preview">
            <video
              className="video-preview-el"
              src={videoPreviewUrl}
              controls
            />
          </div>
        )}
      </div>

      {formError && <p className="error-text">{formError}</p>}

      <div className="form-actions">
        <button
          type="submit"
          className={`btn-primary create-food-submit ${loading ? "is-loading" : ""}`}
          disabled={loading || !canSubmit}
          aria-busy={loading}
        >
          {loading ? "Submitting..." : submitLabel}
        </button>
      </div>
    </form>
  );
};

export default RestaurantRequestForm;
