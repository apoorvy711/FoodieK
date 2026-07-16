const mongoose = require("mongoose");

const paymentTransactionSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "order",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "INR",
    },
    provider: {
      type: String,
      default: "mock",
    },
    providerPaymentId: {
      type: String,
      default: "",
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    metadata: {
      type: Object,
      default: {},
    },
  },
  {
    timestamps: true,
  },
);

paymentTransactionSchema.index({ order: 1, createdAt: -1 });
paymentTransactionSchema.index({ providerPaymentId: 1 });

module.exports = mongoose.model("paymenttransaction", paymentTransactionSchema);
