const orderModel = require("../models/order.model");
const paymentTransactionModel = require("../models/payment-transaction.model");
const notificationService = require("../services/notification.service");
const razorpay = require("../config/razorpay");
const crypto = require("crypto");

function normalizePaymentStatus(status) {
  if (["paid", "captured"].includes(status)) return "paid";
  if (["failed"].includes(status)) return "failed";
  if (["refunded"].includes(status)) return "refunded";
  return "pending";
}

function applyOrderStateForPayment(order, paymentStatus, note) {
  // Don't update if payment status is already the same
  if (order.paymentStatus !== paymentStatus) {
    order.paymentStatus = paymentStatus;
  }

  switch (paymentStatus) {
    case "paid": {
      if (order.status !== "confirmed") {
        order.status = "confirmed";

        order.statusHistory.push({
          status: "confirmed",
          note,
          changedAt: new Date(),
        });
      }
      break;
    }

    case "refunded": {
      if (order.status !== "refunded") {
        order.status = "refunded";

        order.statusHistory.push({
          status: "refunded",
          note,
          changedAt: new Date(),
        });
      }
      break;
    }

    case "failed": {
      // Payment failed. We only update the payment status.
      // The order remains pending unless your business logic requires cancellation.
      break;
    }

    case "pending":
    default:
      break;
  }
}

async function createPaymentIntent(req, res) {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "orderId is required",
      });
    }

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

    if (order.paymentStatus === "paid") {
      return res.status(400).json({
        success: false,
        message: "Order is already paid",
      });
    }

    if (order.paymentMethod === "cash") {
      return res.status(400).json({
        success: false,
        message: "Cash orders do not require online payment",
      });
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({
        success: false,
        message: "Razorpay is not configured on server",
      });
    }

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(order.totalAmount * 100),
      currency: "INR",
      receipt: `order_${order._id}`,
      notes: {
        orderId: order._id.toString(),
        userId: req.user._id.toString(),
      },
    });

    const transaction = await paymentTransactionModel.create({
      order: order._id,
      user: req.user._id,
      amount: order.totalAmount,
      currency: "INR",

      provider: "razorpay",

      providerOrderId: razorpayOrder.id,

      status: "pending",

      metadata: {
        paymentMethod: order.paymentMethod,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Payment order created",
      razorpayKeyId: process.env.RAZORPAY_KEY_ID,
      razorpayOrder,
      transaction,
    });
  } catch (error) {
    console.error("========== PAYMENT INTENT ERROR ==========");
    console.error(error);
    console.error("==========================================");

    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "production"
          ? "Internal Server Error"
          : error.message,
    });
  }
}

async function verifyPayment(req, res) {
  try {
    const {
      orderId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (
      !orderId ||
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        success: false,
        message:
          "orderId, razorpay_order_id, razorpay_payment_id and razorpay_signature are required",
      });
    }

    if (!process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({
        success: false,
        message: "Razorpay is not configured on server",
      });
    }

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

    const transaction = await paymentTransactionModel.findOne({
      order: order._id,
      user: req.user._id,
      providerOrderId: razorpay_order_id,
      provider: "razorpay",
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Payment transaction not found",
      });
    }

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      transaction.status = "failed";
      transaction.providerPaymentId = razorpay_payment_id;
      transaction.providerSignature = razorpay_signature;
      transaction.metadata = {
        ...transaction.metadata,
        verifyError: "invalid_signature",
      };

      await transaction.save();

      applyOrderStateForPayment(
        order,
        "failed",
        "Payment signature verification failed",
      );

      await order.save();

      return res.status(400).json({
        success: false,
        message: "Invalid payment signature",
      });
    }

    if (transaction.status !== "paid") {
      transaction.status = "paid";
      transaction.providerPaymentId = razorpay_payment_id;
      transaction.providerSignature = razorpay_signature;
      await transaction.save();
    }

    if (order.paymentStatus !== "paid") {
      applyOrderStateForPayment(
        order,
        "paid",
        "Payment verified by Razorpay signature",
      );
      await order.save();
    }

    // Delete cart after successful payment
    const cartModel = require("../models/cart.model");

    try {
      const deletedCart = await cartModel.findOneAndDelete({
        user: order.user,
      });
    } catch (cartError) {
      console.error("❌ Failed to delete cart");
      console.error(cartError);
      // Don't fail the payment because cart deletion failed.
    }

    await notificationService.createUserNotification({
      userId: order.user,
      title: "Payment successful",
      message: `Payment received for order ${order._id.toString().slice(-6)}.`,
      type: "system",
      link: "/orders",
    });

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      order,
      transaction,
    });
  } catch (error) {
    console.error("❌ VERIFY PAYMENT ERROR");
    console.error(error);

    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "production"
          ? "Internal Server Error"
          : error.message,
    });
  }
}

async function handleWebhook(req, res) {
  try {
    const signature = req.headers["x-razorpay-signature"];

    const webhookSecret =
      process.env.RAZORPAY_WEBHOOK_SECRET ||
      process.env.PAYMENT_WEBHOOK_SECRET ||
      "foodiek_webhook_secret";

    if (!req.rawBody) {
      return res.status(400).json({
        success: false,
        message: "Webhook raw body is missing",
      });
    }

    const expected = crypto
      .createHmac("sha256", webhookSecret)
      .update(req.rawBody)
      .digest("hex");

    if (signature !== expected) {
      return res.status(401).json({
        success: false,
        message: "Invalid webhook signature",
      });
    }

    const event = req.body.event;

    let paymentEntity = null;
    let refundEntity = null;

    // Payment Events
    if (event?.startsWith("payment.")) {
      paymentEntity = req.body?.payload?.payment?.entity;
    }

    // Refund Events
    if (event?.startsWith("refund.")) {
      refundEntity = req.body?.payload?.refund?.entity;
      paymentEntity = req.body?.payload?.payment?.entity;
    }

    const providerOrderId =
      paymentEntity?.order_id ||
      refundEntity?.order_id ||
      req.body?.providerOrderId;

    const providerPaymentId =
      paymentEntity?.id ||
      refundEntity?.payment_id ||
      req.body?.providerPaymentId;

    let paymentStatus;

    switch (event) {
      case "payment.authorized":
        paymentStatus = "pending";
        break;

      case "payment.captured":
        paymentStatus = "paid";
        break;

      case "payment.failed":
        paymentStatus = "failed";
        break;

      case "refund.created":
      case "refund.processed":
        paymentStatus = "refunded";
        break;

      case "refund.failed":
        paymentStatus = "paid";
        break;

      default:
        paymentStatus = normalizePaymentStatus(
          paymentEntity?.status || refundEntity?.status || req.body?.status,
        );
    }

    let transaction = null;

    // First try by payment id (recommended for refund events)
    if (providerPaymentId) {
      transaction = await paymentTransactionModel.findOne({
        providerPaymentId,
        provider: "razorpay",
      });
    }

    // Fallback to order id
    if (!transaction && providerOrderId) {
      transaction = await paymentTransactionModel.findOne({
        providerOrderId,
        provider: "razorpay",
      });
    }

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Payment transaction not found",
      });
    }

    const order = await orderModel.findById(transaction.order);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Update transaction only if needed
    if (transaction.status !== paymentStatus) {
      transaction.status = paymentStatus;
    }

    if (providerPaymentId) {
      transaction.providerPaymentId = providerPaymentId;
    }

    transaction.metadata = {
      ...transaction.metadata,
      webhookEvent: event,
      webhookReceivedAt: new Date(),
      refundId: refundEntity?.id || transaction.metadata?.refundId,
      refundStatus: refundEntity?.status || transaction.metadata?.refundStatus,
      razorpayPayload: req.body,
    };

    await transaction.save();

    applyOrderStateForPayment(
      order,
      paymentStatus,
      `Payment updated by Razorpay webhook (${event})`,
    );

    await order.save();

    await notificationService.createUserNotification({
      userId: order.user,
      title: "Payment Update",
      message: `Payment status is now ${paymentStatus}.`,
      type: "system",
      link: "/orders",
    });

    console.log(
      `✅ Razorpay Webhook Processed | Event: ${event} | Status: ${paymentStatus}`,
    );

    return res.status(200).json({
      success: true,
      message: "Webhook processed successfully",
    });
  } catch (error) {
    console.error("❌ Razorpay Webhook Error:", error);

    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "production"
          ? "Internal Server Error"
          : error.message,
    });
  }
}

module.exports = {
  createPaymentIntent,
  verifyPayment,
  handleWebhook,
};
