const express = require("express");
const adminController = require("../controllers/admin.controller");
const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();

router.use(authMiddleware.authAdminMiddleware);

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
  "/food-partners",
  /*
    #swagger.tags = ['Admin']
    #swagger.summary = 'Get All Food Partners'
  */
  adminController.listFoodPartners,
);

router.get(
  "/foods",
  /*
    #swagger.tags = ['Admin']
    #swagger.summary = 'Get All Foods'
  */
  adminController.listFoods,
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
