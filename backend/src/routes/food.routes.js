const express = require("express");
const multer = require("multer");

const router = express.Router();

const authMiddleware = require("../middlewares/auth.middleware");
const foodController = require("../controllers/food.controller");
const validationMiddleware = require("../middlewares/validation.middleware");
const foodValidator = require("../validators/food.validator");

const upload = multer({
  storage: multer.memoryStorage(),
});

// ==========================
// Create Food
// ==========================
router.post(
  "/",
  authMiddleware.authFoodPartnerMiddleware,
  upload.single("video"),
  foodValidator.createFoodValidation,
  validationMiddleware.validateRequest,
  foodController.createFood,
);

// ==========================
// Get All Foods
// ==========================
router.get(
  "/",
  foodValidator.getFoodValidation,
  validationMiddleware.validateRequest,
  foodController.getFoodItems,
);

// ==========================
// Like Food
// ==========================
router.post(
  "/like",
  authMiddleware.authUserMiddleware,
  foodController.likeFood,
);

// ==========================
// Save Food
// ==========================
router.post(
  "/save",
  authMiddleware.authUserMiddleware,
  foodController.saveFood,
);

// ==========================
// Share Food
// ==========================
router.post(
  "/share",
  authMiddleware.authUserMiddleware,
  foodController.shareFood,
);

// ==========================
// Get Saved Foods
// ==========================
router.get("/save", foodController.getSaveFood);

// Get one food item (used by shared links and the comments screen)
router.get("/:id", foodController.getFoodById);

module.exports = router;
