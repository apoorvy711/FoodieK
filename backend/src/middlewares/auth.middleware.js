const jwt = require("jsonwebtoken");
const userModel = require("../models/user.model");
const foodPartnerModel = require("../models/foodpartner.model");

// ==========================================
// User Authentication Middleware
// ==========================================

async function authUserMiddleware(req, res, next) {
  console.error("🔥 AUTH MIDDLEWARE HIT:", req.method, req.originalUrl);

  try {
    let token = req.cookies?.token;

    if (!token && req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Please login first.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    if (decoded.role && decoded.role !== "user") {
      return res.status(403).json({
        success: false,
        message: "User session required",
      });
    }

    const user = await userModel.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Only users can access this resource.",
      });
    }

    req.user = user;

    next();

    console.error("Authenticated user:", user._id.toString());
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token.",
    });
  }
}

// ==========================================
// Food Partner Authentication Middleware
// ==========================================

async function authFoodPartnerMiddleware(req, res, next) {
  try {
    const token =
      req.headers.authorization?.replace("Bearer ", "") || req.cookies.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Please login first.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    if (decoded.role && decoded.role !== "food_partner") {
      return res.status(403).json({
        success: false,
        message: "Food partner session required",
      });
    }

    const foodPartner = await foodPartnerModel.findById(decoded.id);

    if (!foodPartner) {
      return res.status(401).json({
        success: false,
        message: "Only food partners can access this resource.",
      });
    }

    req.foodPartner = foodPartner;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token.",
    });
  }
}

async function authAdminMiddleware(req, res, next) {
  try {
    const token =
      req.headers.authorization?.replace("Bearer ", "") || req.cookies.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Please login first.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    const user = await userModel.findById(decoded.id);

    if (!user || user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

    req.admin = user;
    return next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token.",
    });
  }
}

module.exports = {
  authUserMiddleware,
  authFoodPartnerMiddleware,
  authAdminMiddleware,
};
