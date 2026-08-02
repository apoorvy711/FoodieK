const express = require("express");
const foodPartnerController = require("../controllers/food-partner.controller");

const router = express.Router();

/* /api/food-partner/:id */

router.get(
  "/:id",
  /*
    #swagger.tags = ['Food Partners']
    #swagger.summary = 'Get Food Partner Details'
  */
  foodPartnerController.getFoodPartnerById,
);

module.exports = router;
