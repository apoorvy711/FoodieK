const userModel = require("../models/user.model");
const foodPartnerModel = require("../models/foodpartner.model");
const foodModel = require("../models/food.model");
const orderModel = require("../models/order.model");

async function getDashboard(req, res) {
  try {
    const [users, partners, foods, orders] = await Promise.all([
      userModel.countDocuments({}),
      foodPartnerModel.countDocuments({}),
      foodModel.countDocuments({}),
      orderModel.countDocuments({}),
    ]);

    return res.status(200).json({
      success: true,
      stats: { users, partners, foods, orders },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

async function listUsers(req, res) {
  try {
    const users = await userModel
      .find({})
      .select("-password")
      .sort({ createdAt: -1 });
    return res.status(200).json({ success: true, users });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

async function listFoodPartners(req, res) {
  try {
    const foodPartners = await foodPartnerModel
      .find({})
      .select("-password")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, foodPartners });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

async function listFoods(req, res) {
  try {
    const foods = await foodModel
      .find({})
      .populate("category", "name")
      .populate("foodPartner", "name")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, foods });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

async function toggleFoodAvailability(req, res) {
  try {
    const food = await foodModel.findById(req.params.id);

    if (!food) {
      return res
        .status(404)
        .json({ success: false, message: "Food not found" });
    }

    food.isAvailable = !food.isAvailable;
    await food.save();

    return res.status(200).json({
      success: true,
      message: "Food availability updated",
      food,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = {
  getDashboard,
  listUsers,
  listFoodPartners,
  listFoods,
  toggleFoodAvailability,
};
