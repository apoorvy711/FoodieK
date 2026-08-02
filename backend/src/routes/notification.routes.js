const express = require("express");
const notificationController = require("../controllers/notification.controller");
const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();

router.get(
  "/",
  /*
    #swagger.tags = ['Notifications']
    #swagger.summary = 'Get Notifications'
  */
  authMiddleware.authUserMiddleware,
  notificationController.getNotifications,
);

router.patch(
  "/:id/read",
  /*
    #swagger.tags = ['Notifications']
    #swagger.summary = 'Mark Notification As Read'
  */
  authMiddleware.authUserMiddleware,
  notificationController.markNotificationRead,
);

router.get(
  "/stream",
  /*
    #swagger.tags = ['Notifications']
    #swagger.summary = 'Stream Notifications'
  */
  authMiddleware.authUserMiddleware,
  notificationController.streamNotifications,
);

module.exports = router;
