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
  /*
    #swagger.tags = ['Food']
    #swagger.summary = 'Create Food'
  */
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
  /*
    #swagger.tags = ['Food']
    #swagger.summary = 'Get All Foods'
  */
  foodValidator.getFoodValidation,
  validationMiddleware.validateRequest,
  foodController.getFoodItems,
);

// ==========================
// Like Food
// ==========================
router.post(
  "/like",
  /*
    #swagger.tags = ['Food']
    #swagger.summary = 'Like Food'
  */
  authMiddleware.authUserMiddleware,
  foodController.likeFood,
);

// ==========================
// Save Food
// ==========================
router.post(
  "/save",
  /*
    #swagger.tags = ['Food']
    #swagger.summary = 'Save Food'
  */
  authMiddleware.authUserMiddleware,
  foodController.saveFood,
);

// ==========================
// Share Food
// ==========================
router.post(
  "/share",
  /*
    #swagger.tags = ['Food']
    #swagger.summary = 'Share Food'
  */
  authMiddleware.authUserMiddleware,
  foodController.shareFood,
);

// ==========================
// Get Saved Foods
// ==========================
router.get(
  "/save",
  /*
    #swagger.tags = ['Food']
    #swagger.summary = 'Get Saved Foods'
  */
  foodController.getSaveFood,
);

// ==========================
// Get Food Details
// ==========================
router.get(
  "/:id",
  /*
    #swagger.tags = ['Food']
    #swagger.summary = 'Get Food Details'
  */
  foodController.getFoodById,
);

module.exports = router;
