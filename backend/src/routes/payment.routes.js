const express = require("express");
const paymentController = require("../controllers/payment.controller");
const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();

router.post(
  "/intent",
  /*
    #swagger.tags = ['Payments']
    #swagger.summary = 'Create Payment Intent'
  */
  authMiddleware.authUserMiddleware,
  paymentController.createPaymentIntent,
);

router.post(
  "/verify",
  /*
    #swagger.tags = ['Payments']
    #swagger.summary = 'Verify Razorpay Payment'
  */
  authMiddleware.authUserMiddleware,
  paymentController.verifyPayment,
);

router.post(
  "/webhook",
  /*
    #swagger.tags = ['Payments']
    #swagger.summary = 'Handle Razorpay Webhook'
  */
  paymentController.handleWebhook,
);

module.exports = router;
