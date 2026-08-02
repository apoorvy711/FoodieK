require("dotenv").config();

const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const dns = require("dns");
const helmet = require("helmet");
const hpp = require("hpp");
const mongoSanitize = require("./middlewares/mongoSanitize.middleware");
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
const restaurantRequestRoutes = require("./routes/restaurant-request.routes");

dns.setServers(["1.1.1.1", "8.8.8.8"]);

const app = express();

app.disable("x-powered-by");
app.set("trust proxy", 1);

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
    referrerPolicy: {
      policy: "no-referrer",
    },
  }),
);

const allowedOrigins = new Set([
  "http://localhost:3000",
  "http://127.0.0.1:3000",

  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5174",
  "http://localhost:5175",
  "http://127.0.0.1:5175",

  "http://localhost:8080",
  "http://127.0.0.1:8080",

  "https://foodiek-frontend.onrender.com",

  "http://3.110.48.151",

  "https://foodiek.in",
  "https://www.foodiek.in",
  "https://admin.foodiek.in",
]);

app.use(
  cors({
    origin(origin, callback) {
      // Allow requests with no Origin (Postman, curl, server-to-server)
      if (!origin) {
        return callback(null, true);
      }

      // Allow Swagger & Bull Board served from backend
      if (
        origin === "http://localhost:3000" ||
        origin === "http://127.0.0.1:3000"
      ) {
        return callback(null, true);
      }

      if (allowedOrigins.has(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`Origin ${origin} is not allowed by CORS`));
    },
    credentials: true,
  }),
);

// Prevent HTTP Parameter Pollution
app.use(hpp());

// Prevent MongoDB Operator Injection
app.use(mongoSanitize);
app.use(
  express.json({
    limit: "1mb",
    verify(req, res, buf) {
      if (req.originalUrl === "/api/payments/webhook") {
        req.rawBody = buf.toString();
      }
    },
  }),
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "1mb",
  }),
);

app.use(cookieParser());

// Rate Limiters
app.use("/api", securityMiddleware.apiLimiter);
app.use("/api/auth", securityMiddleware.authLimiter);

// Health Routes
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

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/food", foodRoutes);
app.use("/api/food-partner", foodPartnerRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/restaurant-request", restaurantRequestRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  if (!err) {
    return next();
  }

  console.error(err);

  return res.status(err.status || 500).json({
    success: false,
    message:
      process.env.NODE_ENV === "production"
        ? "Internal Server Error"
        : err.message,
  });
});

module.exports = app;
