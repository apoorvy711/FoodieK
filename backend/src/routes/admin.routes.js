const express = require("express");
const adminController = require("../controllers/admin.controller");
const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();

router.use(authMiddleware.authAdminMiddleware);

router.get("/dashboard", adminController.getDashboard);
router.get("/users", adminController.listUsers);
router.get("/food-partners", adminController.listFoodPartners);
router.get("/foods", adminController.listFoods);
router.patch("/foods/:id/toggle", adminController.toggleFoodAvailability);

module.exports = router;
