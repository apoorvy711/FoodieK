const express = require("express");
const foodPartnerController = require("../controllers/food-partner.controller");
const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();

/* /api/food-partner/:id */
router.get("/:id", foodPartnerController.getFoodPartnerById);

module.exports = router;
