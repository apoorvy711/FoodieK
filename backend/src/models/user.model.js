const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    password: {
      type: String,
    },
    avatar: {
      type: String,
      default: "",
    },
    addresses: {
      type: [String],
      default: [],
    },
    coupons: {
      type: [String],
      default: [],
    },
    paymentMethods: {
      type: [String],
      default: [],
    },
    settings: {
      darkMode: {
        type: Boolean,
        default: true,
      },
      privacy: {
        type: Boolean,
        default: true,
      },
    },
  },
  {
    timestamps: true,
  },
);

const userModel = mongoose.model("user", userSchema);

module.exports = userModel;
