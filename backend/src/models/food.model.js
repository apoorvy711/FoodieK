const mongoose = require("mongoose");

const foodSchema = new mongoose.Schema(
  {
    // ===========================
    // Basic Information
    // ===========================
    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    video: {
      type: String,
      required: true,
    },

    thumbnail: {
      type: String,
      default: "",
    },

    // ===========================
    // Relations
    // ===========================
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    foodPartner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "foodpartner",
      required: true,
    },

    // ===========================
    // Pricing
    // ===========================
    price: {
      type: Number,
      required: true,
      min: 0,
    },

    preparationTime: {
      type: Number,
      default: 20,
      min: 1,
    },

    // ===========================
    // Food Details
    // ===========================
    foodType: {
      type: String,
      enum: ["Veg", "Non Veg", "Vegan"],
      default: "Veg",
    },

    cuisine: {
      type: String,
      default: "",
      trim: true,
    },

    spiceLevel: {
      type: String,
      enum: ["Mild", "Medium", "Hot", "Extra Hot"],
      default: "Medium",
    },

    ingredients: [
      {
        type: String,
        trim: true,
      },
    ],

    tags: [
      {
        type: String,
        trim: true,
      },
    ],

    isAvailable: {
      type: Boolean,
      default: true,
    },

    // ===========================
    // Ratings
    // ===========================
    rating: {
      type: Number,
      default: 4.5,
      min: 0,
      max: 5,
    },

    totalRatings: {
      type: Number,
      default: 1,
      min: 0,
    },

    // ===========================
    // Analytics
    // ===========================
    likeCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    savesCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    commentsCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    shareCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    viewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  },
);

foodSchema.index({ isAvailable: 1, createdAt: -1 });
foodSchema.index({ category: 1, isAvailable: 1, createdAt: -1 });
foodSchema.index({ foodPartner: 1, createdAt: -1 });
foodSchema.index({ name: "text", description: "text" });

module.exports = mongoose.model("food", foodSchema);
