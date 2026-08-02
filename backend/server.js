require("dotenv").config();

const worker = require("./src/workers/email.worker");
console.log(worker);

const http = require("http");
const app = require("./src/app");
const swaggerUi = require("swagger-ui-express");
const swaggerFile = require("./swagger-output.json");
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerFile));
const bullBoard = require("./src/bullboard/bullBoard");

const connectDB = require("./src/db/db");
const redisClient = require("./src/config/redis");
const { ensureSingleAdminFromEnv } = require("./src/seed/admin.seeder");

const { initializeSocket } = require("./src/sockets/socket");
const initializeNotificationListener = require("./src/listeners/notification.listener");

// Bull Board Dashboard
app.use("/admin/queues", bullBoard.getRouter());

async function startServer() {
  try {
    // Connect MongoDB
    await connectDB();

    // Ensure exactly one admin account exists
    await ensureSingleAdminFromEnv();

    // Connect Redis
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }

    // Initialize Notification Listener
    initializeNotificationListener();

    // Create HTTP Server
    const server = http.createServer(app);

    // Initialize Socket.IO
    initializeSocket(server);

    const PORT = process.env.PORT || 3000;

    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📚 Swagger Docs: http://localhost:${PORT}/api/docs`);
      console.log(`📊 Bull Board: http://localhost:${PORT}/admin/queues`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
