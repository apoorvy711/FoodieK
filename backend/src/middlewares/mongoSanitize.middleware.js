function sanitize(obj) {
  if (!obj || typeof obj !== "object") return;

  for (const key of Object.keys(obj)) {
    // Remove MongoDB operators like $gt, $ne, $where
    if (key.startsWith("$")) {
      delete obj[key];
      continue;
    }

    // Remove dotted keys
    if (key.includes(".")) {
      delete obj[key];
      continue;
    }

    sanitize(obj[key]);
  }
}

module.exports = (req, res, next) => {
  sanitize(req.body);
  sanitize(req.params);
  sanitize(req.query);

  next();
};
