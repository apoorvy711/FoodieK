const { validationResult } = require("express-validator");

function validateRequest(req, res, next) {
  const result = validationResult(req);

  if (result.isEmpty()) {
    return next();
  }

  const errors = result.array().map((entry) => ({
    field: entry.path,
    message: entry.msg,
  }));

  return res.status(422).json({
    success: false,
    message: errors[0]?.message || "Validation failed",
    errors,
  });
}

module.exports = {
  validateRequest,
};
