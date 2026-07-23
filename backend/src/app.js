require("dotenv").config();

const express = require("express");
app.set("trust proxy", 1);
const cookieParser = require("cookie-parser");
const cors = require("cors");
const dns = require("dns");
const helmet = require("helmet");

const authRoutes = require("./routes/auth.routes");
const foodRoutes = require("./routes/food.routes");
const foodPartnerRoutes = require("./routes/food-partner.routes");
const commentRoutes = require("./routes/comment.routes");
const notificationRoutes = require("./routes/notification.routes");
const orderRoutes = require("./routes/order.routes");
const securityMiddleware = require("./middlewares/security.middleware");
const adminRoutes = require("./routes/admin.routes");
const paymentRoutes = require("./routes/payment.routes");

const categoryRoutes = require("./routes/category.routes");

dns.setServers(["1.1.1.1", "8.8.8.8"]);

const app = express();

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  }),
);

const allowedOrigins = new Set([
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5174",
  "https://foodiek-frontend.onrender.com",
  "http://3.110.48.151:5173",
]);

app.use(
  cors({
    origin(origin, callback) {
      // Allow Postman/server-to-server calls (which do not send an Origin header).
      if (!origin || allowedOrigins.has(origin)) return callback(null, true);
      return callback(new Error(`Origin ${origin} is not allowed by CORS`));
    },
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());
app.use("/api", securityMiddleware.apiLimiter);
app.use("/api/auth", securityMiddleware.authLimiter);

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "FoodieK Backend is Running",
  });
});

app.get("/api", (req, res) => {
  res.status(200).json({
    success: true,
    message: "FoodieK API is Running",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/food", foodRoutes);
app.use("/api/food-partner", foodPartnerRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/payments", paymentRoutes);

app.use((err, req, res, next) => {
  if (!err) {
    return next();
  }

  return res.status(500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});
module.exports = app;
