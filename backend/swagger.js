const swaggerAutogen = require("swagger-autogen")();

const doc = {
  info: {
    title: "FoodieK API",
    description: "FoodieK Backend API Documentation",
    version: "1.0.0",
  },
  host: "localhost:3000",
  schemes: ["http"],
};

const outputFile = "./swagger-output.json";

const endpointsFiles = [
  "./src/routes/auth.routes.js",
  "./src/routes/admin.routes.js",
  "./src/routes/category.routes.js",
  "./src/routes/comment.routes.js",
  "./src/routes/food.routes.js",
  "./src/routes/food-partner.routes.js",
  "./src/routes/notification.routes.js",
  "./src/routes/order.routes.js",
  "./src/routes/payment.routes.js",
];

swaggerAutogen(outputFile, endpointsFiles, doc);
