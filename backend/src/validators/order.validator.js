const { body, param } = require("express-validator");

const addToCartValidation = [
  body("foodId").isMongoId().withMessage("Valid food id is required"),
  body("quantity").optional().isInt({ min: 1, max: 20 }),
];

const removeFromCartValidation = [
  param("foodId").isMongoId().withMessage("Valid food id is required"),
];

const createOrderValidation = [
  body("deliveryAddress").isString().trim().isLength({ min: 4, max: 240 }),
  body("paymentMethod").optional().isIn(["cash", "card", "upi", "wallet"]),
];

const updateOrderStatusValidation = [
  param("orderId").isMongoId().withMessage("Valid order id is required"),
  body("status")
    .isIn([
      "pending",
      "confirmed",
      "preparing",
      "out_for_delivery",
      "delivered",
      "canceled",
      "refunded",
    ])
    .withMessage("Unsupported order status"),
  body("note").optional().isString().trim().isLength({ max: 240 }),
];

module.exports = {
  addToCartValidation,
  removeFromCartValidation,
  createOrderValidation,
  updateOrderStatusValidation,
};
