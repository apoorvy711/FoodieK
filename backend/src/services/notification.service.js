const EventEmitter = require("events");
const notificationModel = require("../models/notification.model");

const notificationEvents = new EventEmitter();

async function createUserNotification({
  userId,
  title,
  message,
  type,
  link = "",
}) {
  const notification = await notificationModel.create({
    user: userId,
    title,
    message,
    type,
    link,
  });

  notificationEvents.emit("notification", {
    userId: String(userId),
    notification,
  });

  return notification;
}

module.exports = {
  createUserNotification,
  notificationEvents,
};
