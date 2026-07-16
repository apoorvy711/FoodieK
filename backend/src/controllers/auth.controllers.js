const userModel = require("../models/user.model");
const foodPartnerModel = require("../models/foodpartner.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

function buildCookieOptions() {
  const isProduction = process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    sameSite: isProduction ? "none" : "lax",
    secure: isProduction,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
}

async function registerUser(req, res) {
  const { fullName, email, password } = req.body;

  const isUserAlreadyExists = await userModel.findOne({
    email,
  });

  if (isUserAlreadyExists) {
    return res.status(400).json({
      message: "User already exists",
    });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await userModel.create({
    fullName,
    email,
    password: hashedPassword,
  });

  const token = jwt.sign(
    {
      id: user._id,
      role: user.role || "user",
    },
    process.env.JWT_SECRET,
  );

  res.cookie("token", token, buildCookieOptions());

  res.status(201).json({
    message: "User registered successfully",
    user: {
      _id: user._id,
      email: user.email,
      fullName: user.fullName,
      role: user.role || "user",
    },
  });
}

async function getCurrentUser(req, res) {
  const user = await userModel.findById(req.user._id).select("-password");

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  res.status(200).json({
    success: true,
    user,
  });
}

async function loginUser(req, res) {
  const { email, password } = req.body;

  const user = await userModel.findOne({
    email,
  });

  if (!user) {
    return res.status(400).json({
      message: "Invalid email or password",
    });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    return res.status(400).json({
      message: "Invalid email or password",
    });
  }

  const token = jwt.sign(
    {
      id: user._id,
      role: "user",
    },
    process.env.JWT_SECRET,
  );

  res.cookie("token", token, buildCookieOptions());

  res.status(200).json({
    message: "User logged in successfully",
    user: {
      _id: user._id,
      email: user.email,
      fullName: user.fullName,
    },
  });
}

function logoutUser(req, res) {
  res.clearCookie("token");
  res.status(200).json({
    message: "User logged out successfully",
  });
}

async function getCurrentFoodPartner(req, res) {
  const foodPartner = await foodPartnerModel
    .findById(req.foodPartner._id)
    .select("-password");

  if (!foodPartner) {
    return res.status(404).json({
      success: false,
      message: "Food partner not found",
    });
  }

  res.status(200).json({
    success: true,
    foodPartner,
  });
}

async function registerFoodPartner(req, res) {
  const {
    name,
    email,
    password,
    phone,
    address,
    contactName,
    avatar,
    coverImage,
  } = req.body;

  const isAccountAlreadyExists = await foodPartnerModel.findOne({
    email,
  });

  if (isAccountAlreadyExists) {
    return res.status(400).json({
      message: "Food partner account already exists",
    });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const foodPartner = await foodPartnerModel.create({
    name,
    email,
    password: hashedPassword,
    phone,
    address,
    contactName,
    avatar: typeof avatar === "string" ? avatar.trim() : "",
    coverImage: typeof coverImage === "string" ? coverImage.trim() : "",
    rating: 0,
    followersCount: 0,
  });

  const token = jwt.sign(
    {
      id: foodPartner._id,
      role: "food_partner",
    },
    process.env.JWT_SECRET,
  );

  res.cookie("token", token, buildCookieOptions());

  res.status(201).json({
    message: "Food partner registered successfully",
    foodPartner: {
      _id: foodPartner._id,
      email: foodPartner.email,
      name: foodPartner.name,
      address: foodPartner.address,
      contactName: foodPartner.contactName,
      phone: foodPartner.phone,
    },
  });
}

async function loginFoodPartner(req, res) {
  const { email, password } = req.body;

  const foodPartner = await foodPartnerModel.findOne({
    email,
  });

  if (!foodPartner) {
    return res.status(400).json({
      message: "Invalid email or password",
    });
  }

  const isPasswordValid = await bcrypt.compare(password, foodPartner.password);

  if (!isPasswordValid) {
    return res.status(400).json({
      message: "Invalid email or password",
    });
  }

  const token = jwt.sign(
    {
      id: foodPartner._id,
      role: "food_partner",
    },
    process.env.JWT_SECRET,
  );

  res.cookie("token", token, buildCookieOptions());

  res.status(200).json({
    message: "Food partner logged in successfully",
    foodPartner: {
      _id: foodPartner._id,
      email: foodPartner.email,
      name: foodPartner.name,
    },
  });
}

function logoutFoodPartner(req, res) {
  res.clearCookie("token");
  res.status(200).json({
    message: "Food partner logged out successfully",
  });
}

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  registerFoodPartner,
  loginFoodPartner,
  logoutFoodPartner,
  getCurrentFoodPartner,
};
