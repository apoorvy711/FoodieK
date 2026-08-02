const mongoose = require("mongoose");

const restaurantRequestSchema = new mongoose.Schema(
  {
    restaurantName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 140,
    },
    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: 2000,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
      maxlength: 240,
    },
    coordinates: {
      lat: {
        type: Number,
      },
      lng: {
        type: Number,
      },
    },
    gst: {
      type: String,
      default: "",
      trim: true,
      uppercase: true,
    },
    fssai: {
      type: String,
      default: "",
      trim: true,
    },
    pan: {
      type: String,
      default: "",
      trim: true,
      uppercase: true,
    },
    bankDetails: {
      accountHolderName: {
        type: String,
        default: "",
        trim: true,
      },
      accountNumber: {
        type: String,
        default: "",
        trim: true,
      },
      ifsc: {
        type: String,
        default: "",
        trim: true,
        uppercase: true,
      },
      bankName: {
        type: String,
        default: "",
        trim: true,
      },
      branchName: {
        type: String,
        default: "",
        trim: true,
      },
    },
    restaurantImages: {
      type: [String],
      default: [],
    },
    restaurantVideo: {
      type: String,
      default: "",
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "foodpartner",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    rejectionReason: {
      type: String,
      default: "",
      trim: true,
      maxlength: 1000,
    },
  },
  {
    timestamps: true,
  },
);

restaurantRequestSchema.index({ owner: 1, submittedAt: -1 });
restaurantRequestSchema.index(
  { owner: 1, status: 1 },
  {
    partialFilterExpression: { status: "pending" },
  },
);

module.exports = mongoose.model("RestaurantRequest", restaurantRequestSchema);
