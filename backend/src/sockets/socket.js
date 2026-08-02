const { Server } = require("socket.io");
const socketAuthMiddleware = require("../middlewares/socket-auth.middleware");
const { setIO } = require("./socketManager");

let io;

function initializeSocket(server) {
  io = new Server(server, {
    cors: {
      origin: [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
      ],
      credentials: true,
    },
  });

  // Make Socket.IO instance globally available
  setIO(io);

  // Authenticate every socket connection
  io.use(socketAuthMiddleware);

  io.on("connection", (socket) => {
    console.log("✅ Authenticated Socket Connected");

    // Join personal room
    const userRoom = socket.user._id.toString();
    socket.join(userRoom);

    console.log(`📌 ${socket.role} joined room: ${userRoom}`);

    // Display name for different account types
    const displayName =
      socket.user.fullName ||
      socket.user.name ||
      socket.user.restaurantName ||
      socket.user.contactName ||
      "User";

    console.log(`👋 ${displayName} connected`);

    // -----------------------------
    // Register Socket Events Here
    // -----------------------------
    // Example:
    // socket.on("typing", () => {});
    // socket.on("join-room", () => {});

    socket.on("disconnect", (reason) => {
      console.log("❌ Client Disconnected");
    });
  });

  return io;
}

module.exports = {
  initializeSocket,
};
