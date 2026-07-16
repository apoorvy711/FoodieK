const rateLimit = require("express-rate-limit");

const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  // Keep strict limits on login/register while allowing session probe/logout calls.
  skip(req) {
    const path = req.path || "";
    return path.endsWith("/me") || path.endsWith("/logout");
  },
  message: {
    success: false,
    message: "Too many authentication attempts. Try again shortly.",
  },
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please retry later.",
  },
});

module.exports = {
  authLimiter,
  apiLimiter,
};
