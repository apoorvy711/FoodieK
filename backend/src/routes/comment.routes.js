const express = require("express");
const commentController = require("../controllers/comment.controller");
const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();

router.post(
  "/",
  authMiddleware.authUserMiddleware,
  commentController.createComment,
);
router.get("/:foodId", commentController.getCommentsByFood);
router.delete(
  "/:id",
  authMiddleware.authUserMiddleware,
  commentController.deleteComment,
);

module.exports = router;
