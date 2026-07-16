const { body } = require("express-validator");

const emailRule = body("email")
  .isEmail()
  .withMessage("Valid email is required")
  .normalizeEmail();

const passwordRule = body("password")
  .isString()
  .isLength({ min: 6 })
  .withMessage("Password must be at least 6 characters");

const registerUserValidation = [
  body("fullName").isString().trim().isLength({ min: 2, max: 80 }),
  emailRule,
  passwordRule,
];

const loginUserValidation = [emailRule, passwordRule];

const registerFoodPartnerValidation = [
  body("name").isString().trim().isLength({ min: 2, max: 120 }),
  body("contactName").isString().trim().isLength({ min: 2, max: 120 }),
  body("phone").isString().trim().isLength({ min: 6, max: 24 }),
  body("address").isString().trim().isLength({ min: 4, max: 240 }),
  body("avatar")
    .optional({ checkFalsy: true })
    .isURL({ protocols: ["http", "https"], require_protocol: true })
    .withMessage("Avatar must be a valid URL"),
  body("coverImage")
    .optional({ checkFalsy: true })
    .isURL({ protocols: ["http", "https"], require_protocol: true })
    .withMessage("Cover image must be a valid URL"),
  emailRule,
  passwordRule,
];

const loginFoodPartnerValidation = [emailRule, passwordRule];

module.exports = {
  registerUserValidation,
  loginUserValidation,
  registerFoodPartnerValidation,
  loginFoodPartnerValidation,
};
