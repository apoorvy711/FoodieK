const express = require("express");
const authController = require("../controllers/auth.controllers");
const router = express.Router();

const authMiddleware = require("../middlewares/auth.middleware");
const validationMiddleware = require("../middlewares/validation.middleware");
const authValidator = require("../validators/auth.validator");
const rateLimiter = require("../middlewares/rateLimiter.middleware");

// ================= USER AUTH =================

router.post(
  "/user/register",
  /*
    #swagger.tags = ['Authentication']
    #swagger.summary = 'Register New User'
  */
  authValidator.registerUserValidation,
  validationMiddleware.validateRequest,
  authController.registerUser,
);

router.post(
  "/user/forgot-password",
  /*
    #swagger.tags = ['Authentication']
    #swagger.summary = 'Forgot Password'
  */
  authController.forgotPassword,
);

router.post(
  "/user/reset-password",
  /*
    #swagger.tags = ['Authentication']
    #swagger.summary = 'Reset Password'
  */
  authController.resetPassword,
);

router.post(
  "/user/login",
  /*
    #swagger.tags = ['Authentication']
    #swagger.summary = 'User Login'
  */
  rateLimiter,
  authValidator.loginUserValidation,
  validationMiddleware.validateRequest,
  authController.loginUser,
);

router.get(
  "/user/logout",
  /*
    #swagger.tags = ['Authentication']
    #swagger.summary = 'Logout User'
  */
  authController.logoutUser,
);

router.get(
  "/user/me",
  /*
    #swagger.tags = ['Authentication']
    #swagger.summary = 'Get Current User Profile'
  */
  authMiddleware.authUserMiddleware,
  authController.getCurrentUser,
);

// ================= FOOD PARTNER AUTH =================

router.post(
  "/food-partner/register",
  /*
    #swagger.tags = ['Food Partners']
    #swagger.summary = 'Register Food Partner'
  */
  authValidator.registerFoodPartnerValidation,
  validationMiddleware.validateRequest,
  authController.registerFoodPartner,
);

router.post(
  "/food-partner/login",
  /*
    #swagger.tags = ['Food Partners']
    #swagger.summary = 'Food Partner Login'
  */
  rateLimiter,
  authValidator.loginFoodPartnerValidation,
  validationMiddleware.validateRequest,
  authController.loginFoodPartner,
);

router.get(
  "/food-partner/logout",
  /*
    #swagger.tags = ['Food Partners']
    #swagger.summary = 'Logout Food Partner'
  */
  authController.logoutFoodPartner,
);

router.get(
  "/food-partner/me",
  /*
    #swagger.tags = ['Food Partners']
    #swagger.summary = 'Get Current Food Partner Profile'
  */
  authMiddleware.authFoodPartnerMiddleware,
  authController.getCurrentFoodPartner,
);

router.get(
  "/me",
  /*
    #swagger.tags = ['Authentication']
    #swagger.summary = 'Get Basic User Information'
  */
  authMiddleware.authUserMiddleware,
  (req, res) => {
    return res.json({
      id: req.user._id,
      email: req.user.email,
      name: req.user.fullName || req.user.name,
    });
  },
);

module.exports = router;
