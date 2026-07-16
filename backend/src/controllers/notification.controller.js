const notificationModel = require("../models/notification.model");
const notificationService = require("../services/notification.service");

async function getNotifications(req, res) {
  try {
    const notifications = await notificationModel
      .find({ user: req.user._id })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      notifications,
      unreadCount: notifications.filter((item) => !item.isRead).length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

async function markNotificationRead(req, res) {
  try {
    const notification = await notificationModel.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    notification.isRead = true;
    await notification.save();

    res.status(200).json({
      success: true,
      message: "Notification marked as read",
      notification,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

function streamNotifications(req, res) {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  const userId = String(req.user._id);

  const onNotification = (payload) => {
    if (payload.userId !== userId) {
      return;
    }

    res.write(`data: ${JSON.stringify(payload.notification)}\n\n`);
  };

  notificationService.notificationEvents.on("notification", onNotification);

  req.on("close", () => {
    notificationService.notificationEvents.off("notification", onNotification);
    res.end();
  });
}

module.exports = {
  getNotifications,
  markNotificationRead,
  streamNotifications,
};
