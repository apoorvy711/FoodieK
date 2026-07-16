const express = require("express");
const authController = require("../controllers/auth.controllers");

const router = express.Router();

const authMiddleware = require("../middlewares/auth.middleware");
const validationMiddleware = require("../middlewares/validation.middleware");
const authValidator = require("../validators/auth.validator");

//USER AUTH APIs
router.post(
  "/user/register",
  authValidator.registerUserValidation,
  validationMiddleware.validateRequest,
  authController.registerUser,
);
router.post(
  "/user/login",
  authValidator.loginUserValidation,
  validationMiddleware.validateRequest,
  authController.loginUser,
);
router.get("/user/logout", authController.logoutUser);
router.get(
  "/user/me",
  authMiddleware.authUserMiddleware,
  authController.getCurrentUser,
);

//FOOD-PARTNER AUTH APIs
router.post(
  "/food-partner/register",
  authValidator.registerFoodPartnerValidation,
  validationMiddleware.validateRequest,
  authController.registerFoodPartner,
);
router.post(
  "/food-partner/login",
  authValidator.loginFoodPartnerValidation,
  validationMiddleware.validateRequest,
  authController.loginFoodPartner,
);
router.get("/food-partner/logout", authController.logoutFoodPartner);
router.get(
  "/food-partner/me",
  authMiddleware.authFoodPartnerMiddleware,
  authController.getCurrentFoodPartner,
);

module.exports = router;
