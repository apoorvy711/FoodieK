const express = require("express");
const orderController = require("../controllers/order.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const validationMiddleware = require("../middlewares/validation.middleware");
const orderValidator = require("../validators/order.validator");

const router = express.Router();

router.post(
  "/cart",
  authMiddleware.authUserMiddleware,
  orderValidator.addToCartValidation,
  validationMiddleware.validateRequest,
  orderController.addToCart,
);
router.get("/cart", authMiddleware.authUserMiddleware, orderController.getCart);
router.delete(
  "/cart/:foodId",
  authMiddleware.authUserMiddleware,
  orderValidator.removeFromCartValidation,
  validationMiddleware.validateRequest,
  orderController.removeFromCart,
);
router.post(
  "/",
  authMiddleware.authUserMiddleware,
  orderValidator.createOrderValidation,
  validationMiddleware.validateRequest,
  orderController.createOrder,
);
router.get(
  "/history",
  authMiddleware.authUserMiddleware,
  orderController.getOrders,
);
router.get(
  "/partner",
  authMiddleware.authFoodPartnerMiddleware,
  orderController.getFoodPartnerOrders,
);
router.patch(
  "/:orderId/status",
  authMiddleware.authFoodPartnerMiddleware,
  orderValidator.updateOrderStatusValidation,
  validationMiddleware.validateRequest,
  orderController.updateOrderStatus,
);

module.exports = router;
