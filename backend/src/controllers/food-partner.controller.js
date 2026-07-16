const mongoose = require("mongoose");
const foodPartnerModel = require("../models/foodpartner.model");
const foodModel = require("../models/food.model");

async function getFoodPartnerById(req, res) {
  try {
    const foodPartnerId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(foodPartnerId)) {
      return res.status(404).json({
        success: false,
        message: "Food partner not found",
      });
    }

    const foodPartner = await foodPartnerModel.findById(foodPartnerId);
    const foodItemsByFoodPartner = await foodModel
      .find({
        foodPartner: foodPartnerId,
      })
      .populate("category")
      .sort({ createdAt: -1 });

    if (!foodPartner) {
      return res.status(404).json({
        success: false,
        message: "Food partner not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Food partner retrieved successfully",
      foodPartner: {
        ...foodPartner.toObject(),
        foodItems: foodItemsByFoodPartner,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

module.exports = {
  getFoodPartnerById,
};
