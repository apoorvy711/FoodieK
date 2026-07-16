const { body, query } = require("express-validator");

const createFoodValidation = [
  body("name").isString().trim().isLength({ min: 2, max: 120 }),
  body("category").isString().notEmpty(),
  body("price").isFloat({ min: 0 }),
  body("preparationTime").optional().isInt({ min: 1, max: 240 }),
  body("foodType").optional().isIn(["Veg", "Non Veg", "Vegan"]),
  body("spiceLevel").optional().isIn(["Mild", "Medium", "Hot", "Extra Hot"]),
];

const getFoodValidation = [
  query("limit").optional().isInt({ min: 1, max: 100 }),
  query("page").optional().isInt({ min: 1 }),
  query("search").optional().isString(),
  query("category").optional().isString(),
];

module.exports = {
  createFoodValidation,
  getFoodValidation,
};
