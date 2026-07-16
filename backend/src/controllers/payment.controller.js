const orderModel = require("../models/order.model");
const paymentTransactionModel = require("../models/payment-transaction.model");
const notificationService = require("../services/notification.service");

async function createPaymentIntent(req, res) {
  try {
    const { orderId } = req.body;

    const order = await orderModel.findOne({
      _id: orderId,
      user: req.user._id,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const transaction = await paymentTransactionModel.create({
      order: order._id,
      user: req.user._id,
      amount: order.totalAmount,
      status: "pending",
      provider: "mock",
      providerPaymentId: `mock_${order._id}_${Date.now()}`,
      metadata: {
        paymentMethod: order.paymentMethod,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Payment intent created",
      transaction,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

async function handleWebhook(req, res) {
  try {
    const signature = req.headers["x-foodiek-webhook-secret"];
    const expected =
      process.env.PAYMENT_WEBHOOK_SECRET || "foodiek_webhook_secret";

    if (signature !== expected) {
      return res.status(401).json({
        success: false,
        message: "Invalid webhook signature",
      });
    }

    const { orderId, providerPaymentId, status } = req.body;

    const order = await orderModel.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const normalizedStatus = ["paid", "failed", "refunded"].includes(status)
      ? status
      : "failed";

    order.paymentStatus = normalizedStatus;
    if (normalizedStatus === "paid" && order.status === "pending") {
      order.status = "confirmed";
      order.statusHistory.push({
        status: "confirmed",
        note: "Payment confirmed by webhook",
        changedAt: new Date(),
      });
    }

    if (normalizedStatus === "refunded") {
      order.status = "refunded";
      order.statusHistory.push({
        status: "refunded",
        note: "Payment refunded",
        changedAt: new Date(),
      });
    }

    await order.save();

    await paymentTransactionModel.create({
      order: order._id,
      user: order.user,
      amount: order.totalAmount,
      status: normalizedStatus,
      provider: "mock",
      providerPaymentId: providerPaymentId || `mock_${order._id}_${Date.now()}`,
      metadata: req.body,
    });

    await notificationService.createUserNotification({
      userId: order.user,
      title: "Payment update",
      message: `Payment status is now ${normalizedStatus}.`,
      type: "system",
      link: `/orders`,
    });

    return res.status(200).json({
      success: true,
      message: "Webhook processed",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

module.exports = {
  createPaymentIntent,
  handleWebhook,
};
