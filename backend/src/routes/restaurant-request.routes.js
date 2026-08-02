const express = require("express");
const multer = require("multer");

const authMiddleware = require("../middlewares/auth.middleware");
const validationMiddleware = require("../middlewares/validation.middleware");
const restaurantRequestValidator = require("../validators/restaurant-request.validator");
const restaurantRequestController = require("../controllers/restaurant-request.controller");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
});

router.post(
  "/",
  /*
    #swagger.tags = ['Restaurant Request']
    #swagger.summary = 'Submit restaurant verification request'
  */
  authMiddleware.authFoodPartnerMiddleware,
  upload.fields([
    { name: "restaurantImages", maxCount: 8 },
    { name: "restaurantVideo", maxCount: 1 },
  ]),
  restaurantRequestValidator.createRestaurantRequestValidation,
  validationMiddleware.validateRequest,
  restaurantRequestController.createRestaurantRequest,
);

router.get(
  "/status",
  /*
    #swagger.tags = ['Restaurant Request']
    #swagger.summary = 'Get latest restaurant verification request status'
  */
  authMiddleware.authFoodPartnerMiddleware,
  restaurantRequestController.getRestaurantRequestStatus,
);

module.exports = router;
