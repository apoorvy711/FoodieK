const redisClient = require("../config/redis");

async function rateLimiter(req, res, next) {
  const ip = req.ip;

  const key = `rate-limit:${ip}`;

  // Increment the request counter
  const requests = await redisClient.incr(key);

  // Set a 60-second TTL only for the first request
  if (requests === 1) {
    await redisClient.expire(key, 60);
  }

  // Check if the user has exceeded the limit
  if (requests > 5) {
    return res.status(429).json({
      success: false,
      message: "Too many requests. Please try again after 1 minute.",
    });
  }

  // Allow the request to continue
  next();
}

module.exports = rateLimiter;
