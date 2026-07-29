const jwt = require("jsonwebtoken");

console.log(require("cookie"));
const userModel = require("../models/user.model");
const foodPartnerModel = require("../models/foodpartner.model");

async function socketAuthMiddleware(socket, next) {
  try {
    console.log("\n========== SOCKET AUTH ==========");

    const cookieHeader = socket.handshake.headers.cookie;

    if (!cookieHeader) {
      console.log("❌ No cookie header");
      return next(new Error("Authentication required"));
    }

    const cookies = Object.fromEntries(
      cookieHeader.split("; ").map((cookie) => {
        const [key, ...value] = cookie.split("=");
        return [key, value.join("=")];
      }),
    );

    const token = cookies.token;

    if (!token) {
      console.log("❌ Token missing");
      return next(new Error("Authentication required"));
    }

    console.log("✅ Token Found");

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    let authenticatedUser = null;

    if (decoded.role === "user") {
      authenticatedUser = await userModel.findById(decoded.id);
    } else if (decoded.role === "food_partner") {
      authenticatedUser = await foodPartnerModel.findById(decoded.id);
    }

    if (!authenticatedUser) {
      console.log("❌ User not found");
      return next(new Error("Authentication failed"));
    }

    socket.user = authenticatedUser;
    socket.role = decoded.role;

    next();
  } catch (error) {
    console.log("❌ SOCKET AUTH ERROR");
    console.log(error);

    return next(new Error("Authentication failed"));
  }
}

module.exports = socketAuthMiddleware;
