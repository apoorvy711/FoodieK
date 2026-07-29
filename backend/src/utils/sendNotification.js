const socketManager = require("../sockets/socketManager");

console.log("Socket Manager Exports:", socketManager);

const { getIO } = socketManager;

function sendNotification(userId, notification) {
  const io = getIO();

  io.to(userId.toString()).emit("notification", {
    ...notification,
    createdAt: new Date().toISOString(),
  });
}

module.exports = sendNotification;
