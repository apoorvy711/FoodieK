const express = require("express");
const notificationController = require("../controllers/notification.controller");
const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();

router.get(
  "/",
  authMiddleware.authUserMiddleware,
  notificationController.getNotifications,
);
router.patch(
  "/:id/read",
  authMiddleware.authUserMiddleware,
  notificationController.markNotificationRead,
);
router.get(
  "/stream",
  authMiddleware.authUserMiddleware,
  notificationController.streamNotifications,
);

module.exports = router;
