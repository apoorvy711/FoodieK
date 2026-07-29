let io = null;

function setIO(socketInstance) {
  io = socketInstance;
}

function getIO() {
  if (!io) {
    throw new Error("Socket.IO has not been initialized.");
  }

  return io;
}

module.exports = {
  setIO,
  getIO,
};
