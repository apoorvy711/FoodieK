const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    items: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "orderitem",
        required: true,
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "preparing",
        "out_for_delivery",
        "delivered",
        "canceled",
        "refunded",
      ],
      default: "pending",
    },
    statusHistory: [
      {
        status: {
          type: String,
          required: true,
        },
        note: {
          type: String,
          default: "",
          trim: true,
        },
        changedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    deliveryAddress: {
      type: String,
      required: true,
      trim: true,
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "card", "upi", "wallet"],
      default: "cash",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  },
);

orderSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("order", orderSchema);
