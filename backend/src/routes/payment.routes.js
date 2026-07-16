const express = require("express");
const paymentController = require("../controllers/payment.controller");
const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();

router.post(
  "/intent",
  authMiddleware.authUserMiddleware,
  paymentController.createPaymentIntent,
);

router.post("/webhook", paymentController.handleWebhook);

module.exports = router;
