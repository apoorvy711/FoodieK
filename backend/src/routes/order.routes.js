const express = require("express");
const orderController = require("../controllers/order.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const validationMiddleware = require("../middlewares/validation.middleware");
const orderValidator = require("../validators/order.validator");

const router = express.Router();

router.post(
  "/cart",
  /*
    #swagger.tags = ['Orders']
    #swagger.summary = 'Add Item To Cart'
  */
  authMiddleware.authUserMiddleware,
  orderValidator.addToCartValidation,
  validationMiddleware.validateRequest,
  orderController.addToCart,
);

router.get(
  "/cart",
  /*
    #swagger.tags = ['Orders']
    #swagger.summary = 'Get User Cart'
  */
  authMiddleware.authUserMiddleware,
  orderController.getCart,
);

router.delete(
  "/cart/:foodId",
  /*
    #swagger.tags = ['Orders']
    #swagger.summary = 'Remove Item From Cart'
  */
  authMiddleware.authUserMiddleware,
  orderValidator.removeFromCartValidation,
  validationMiddleware.validateRequest,
  orderController.removeFromCart,
);

router.post(
  "/",
  /*
    #swagger.tags = ['Orders']
    #swagger.summary = 'Place Order'
  */
  authMiddleware.authUserMiddleware,
  orderValidator.createOrderValidation,
  validationMiddleware.validateRequest,
  orderController.createOrder,
);

router.get(
  "/history",
  /*
    #swagger.tags = ['Orders']
    #swagger.summary = 'Get Order History'
  */
  authMiddleware.authUserMiddleware,
  orderController.getOrders,
);

router.get(
  "/partner",
  /*
    #swagger.tags = ['Orders']
    #swagger.summary = 'Get Food Partner Orders'
  */
  authMiddleware.authFoodPartnerMiddleware,
  orderController.getFoodPartnerOrders,
);

router.patch(
  "/:orderId/status",
  /*
    #swagger.tags = ['Orders']
    #swagger.summary = 'Update Order Status'
  */
  authMiddleware.authFoodPartnerMiddleware,
  orderValidator.updateOrderStatusValidation,
  validationMiddleware.validateRequest,
  orderController.updateOrderStatus,
);

module.exports = router;
