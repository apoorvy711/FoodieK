const mongoose = require("mongoose");

const foodPartnerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    contactName: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
      default: "",
    },
    coverImage: {
      type: String,
      default: "",
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    followersCount: {
      type: Number,
      default: 0,
    },
    totalMeals: {
      type: Number,
      default: 0,
    },
    customersServed: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

const foodPartnerModel = mongoose.model("foodpartner", foodPartnerSchema);

module.exports = foodPartnerModel;
