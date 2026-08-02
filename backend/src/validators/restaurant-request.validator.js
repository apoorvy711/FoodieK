const { body } = require("express-validator");

function isValidJson(value) {
  if (typeof value !== "string") {
    return false;
  }

  try {
    JSON.parse(value);
    return true;
  } catch (error) {
    return false;
  }
}

const createRestaurantRequestValidation = [
  body("restaurantName")
    .isString()
    .trim()
    .isLength({ min: 2, max: 140 })
    .withMessage("Restaurant name must be between 2 and 140 characters"),
  body("description")
    .optional({ checkFalsy: true })
    .isString()
    .trim()
    .isLength({ max: 2000 })
    .withMessage("Description must be at most 2000 characters"),
  body("category").isMongoId().withMessage("Valid category id is required"),
  body("address")
    .isString()
    .trim()
    .isLength({ min: 4, max: 240 })
    .withMessage("Address must be between 4 and 240 characters"),
  body("gst")
    .optional({ checkFalsy: true })
    .isString()
    .trim()
    .isLength({ min: 5, max: 20 })
    .withMessage("GST must be between 5 and 20 characters"),
  body("fssai")
    .optional({ checkFalsy: true })
    .isString()
    .trim()
    .isLength({ min: 8, max: 20 })
    .withMessage("FSSAI must be between 8 and 20 characters"),
  body("pan")
    .optional({ checkFalsy: true })
    .matches(/^[A-Za-z]{5}[0-9]{4}[A-Za-z]{1}$/)
    .withMessage("PAN format is invalid"),
  body("coordinates")
    .optional({ checkFalsy: true })
    .custom((value) => isValidJson(value))
    .withMessage("Coordinates must be a valid JSON string"),
  body("bankDetails")
    .optional({ checkFalsy: true })
    .custom((value) => isValidJson(value))
    .withMessage("Bank details must be a valid JSON string"),
];

module.exports = {
  createRestaurantRequestValidation,
};
