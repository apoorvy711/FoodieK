const { notificationEvents } = require("../services/notification.service");
const sendNotification = require("../utils/sendNotification");

function initializeNotificationListener() {
  notificationEvents.on("notification", ({ userId, notification }) => {
    try {
      sendNotification(userId, {
        type: notification.type.toUpperCase(),
        title: notification.title,
        message: notification.message,
        data: {
          notificationId: notification._id,
          link: notification.link,
          ...(notification.data || {}),
        },
      });

      console.log(`📡 Real-time notification sent to user ${userId}`);
    } catch (error) {
      console.error("❌ Failed to send Socket.IO notification");
      console.error(error.message);
    }
  });

  console.log("✅ Notification Listener Initialized");
}

module.exports = initializeNotificationListener;
