const express = require("express");
const commentController = require("../controllers/comment.controller");
const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();

router.post(
  "/",
  /*
    #swagger.tags = ['Comments']
    #swagger.summary = 'Add Comment'
  */
  authMiddleware.authUserMiddleware,
  commentController.createComment,
);

router.get(
  "/:foodId",
  /*
    #swagger.tags = ['Comments']
    #swagger.summary = 'Get Comments By Food'
  */
  commentController.getCommentsByFood,
);

router.delete(
  "/:id",
  /*
    #swagger.tags = ['Comments']
    #swagger.summary = 'Delete Comment'
  */
  authMiddleware.authUserMiddleware,
  commentController.deleteComment,
);

module.exports = router;
