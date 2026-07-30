require("dotenv").config();
console.log("Before require");
const worker = require("./src/workers/email.worker");
console.log("After require");
console.log(worker);
const http = require("http");
const app = require("./src/app");
const bullBoard = require("./src/bullboard/bullBoard");

app.use("/admin/queues", bullBoard.getRouter());
const connectDB = require("./src/db/db");
const redisClient = require("./src/config/redis");

const { initializeSocket } = require("./src/sockets/socket");
const initializeNotificationListener = require("./src/listeners/notification.listener");

async function startServer() {
  try {
    // Connect Database
    await connectDB();

    // Connect Redis
    await redisClient.connect();

    console.log("🚀 Initializing Notification Listener...");
    initializeNotificationListener();

    // Create HTTP Server
    const server = http.createServer(app);

    // Initialize Socket.IO
    initializeSocket(server);

    // Start Server
    server.listen(3000, () => {
      console.log("=================================");
      console.log("🚀 Server is running on port 3000");
      console.log("=================================");
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
