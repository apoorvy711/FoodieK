const express = require("express");
const authController = require("../controllers/auth.controllers");
const router = express.Router();

const authMiddleware = require("../middlewares/auth.middleware");
const validationMiddleware = require("../middlewares/validation.middleware");
const authValidator = require("../validators/auth.validator");
const rateLimiter = require("../middlewares/rateLimiter.middleware");

//USER AUTH APIs
router.post(
  "/user/register",
  authValidator.registerUserValidation,
  validationMiddleware.validateRequest,
  authController.registerUser,
);

router.post("/user/forgot-password", authController.forgotPassword);

router.post("/user/reset-password", authController.resetPassword);

router.post(
  "/user/login",
  rateLimiter,
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
  rateLimiter,
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

router.get("/me", authMiddleware.authUserMiddleware, (req, res) => {
  return res.json({
    id: req.user._id,
    email: req.user.email,
    name: req.user.fullName || req.user.name,
  });
});

module.exports = router;
