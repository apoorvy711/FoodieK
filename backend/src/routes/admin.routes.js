const express = require("express");
const adminController = require("../controllers/admin.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const validationMiddleware = require("../middlewares/validation.middleware");
const adminValidator = require("../validators/admin.validator");

const router = express.Router();

router.use(authMiddleware.authAdminMiddleware);

router.get(
  "/me",
  /*
    #swagger.tags = ['Admin']
    #swagger.summary = 'Get Current Admin Profile'
  */
  adminController.getCurrentAdmin,
);

router.get(
  "/dashboard",
  /*
    #swagger.tags = ['Admin']
    #swagger.summary = 'Admin Dashboard'
  */
  adminController.getDashboard,
);

router.get(
  "/users",
  /*
    #swagger.tags = ['Admin']
    #swagger.summary = 'Get All Users'
  */
  adminController.listUsers,
);

router.get(
  "/orders",
  /*
    #swagger.tags = ['Admin']
    #swagger.summary = 'Get All Orders'
  */
  adminController.listOrders,
);

router.get(
  "/food-partners",
  /*
    #swagger.tags = ['Admin']
    #swagger.summary = 'Get All Food Partners'
  */
  adminController.listFoodPartners,
);

router.patch(
  "/food-partners/:id/toggle-active",
  /*
    #swagger.tags = ['Admin']
    #swagger.summary = 'Activate or Deactivate Restaurant Account'
  */
  adminController.toggleFoodPartnerActiveStatus,
);

router.get(
  "/foods",
  /*
    #swagger.tags = ['Admin']
    #swagger.summary = 'Get All Foods'
  */
  adminController.listFoods,
);

router.get(
  "/restaurant-requests",
  /*
    #swagger.tags = ['Admin']
    #swagger.summary = 'Get Restaurant Verification Requests'
  */
  adminController.listRestaurantRequests,
);

router.get(
  "/restaurant-requests/:id",
  /*
    #swagger.tags = ['Admin']
    #swagger.summary = 'Get Restaurant Verification Request Details'
  */
  adminController.getRestaurantRequestDetails,
);

router.patch(
  "/restaurant-requests/:id/approve",
  /*
    #swagger.tags = ['Admin']
    #swagger.summary = 'Approve Restaurant Verification Request'
  */
  adminController.approveRestaurantRequest,
);

router.patch(
  "/restaurant-requests/:id/reject",
  /*
    #swagger.tags = ['Admin']
    #swagger.summary = 'Reject Restaurant Verification Request'
  */
  adminValidator.rejectRestaurantRequestValidation,
  validationMiddleware.validateRequest,
  adminController.rejectRestaurantRequest,
);

router.post(
  "/announcements",
  /*
    #swagger.tags = ['Admin']
    #swagger.summary = 'Create Announcement'
  */
  adminValidator.createAnnouncementValidation,
  validationMiddleware.validateRequest,
  adminController.createAnnouncement,
);

router.patch(
  "/foods/:id/toggle",
  /*
    #swagger.tags = ['Admin']
    #swagger.summary = 'Toggle Food Availability'
  */
  adminController.toggleFoodAvailability,
);

module.exports = router;
