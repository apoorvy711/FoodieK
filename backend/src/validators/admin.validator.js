const { body } = require("express-validator");

const rejectRestaurantRequestValidation = [
  body("rejectionReason")
    .isString()
    .trim()
    .isLength({ min: 5, max: 1000 })
    .withMessage("Rejection reason must be between 5 and 1000 characters"),
];

const createAnnouncementValidation = [
  body("title")
    .isString()
    .trim()
    .isLength({ min: 3, max: 120 })
    .withMessage("Title must be between 3 and 120 characters"),
  body("message")
    .isString()
    .trim()
    .isLength({ min: 5, max: 1500 })
    .withMessage("Message must be between 5 and 1500 characters"),
  body("audience")
    .isIn(["everyone", "customers", "restaurant_owners"])
    .withMessage(
      "Audience must be one of: everyone, customers, restaurant_owners",
    ),
];

module.exports = {
  rejectRestaurantRequestValidation,
  createAnnouncementValidation,
};
