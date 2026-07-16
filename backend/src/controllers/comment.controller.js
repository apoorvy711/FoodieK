const commentModel = require("../models/comment.model");
const foodModel = require("../models/food.model");

async function createComment(req, res) {
  try {
    const { foodId, text } = req.body;

    if (!foodId || !text?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Food id and comment text are required",
      });
    }

    const food = await foodModel.findById(foodId);

    if (!food) {
      return res.status(404).json({
        success: false,
        message: "Food not found",
      });
    }

    const comment = await commentModel.create({
      user: req.user._id,
      food: foodId,
      text: text.trim(),
    });

    await foodModel.findByIdAndUpdate(foodId, {
      $inc: { commentsCount: 1 },
    });

    const populatedComment = await commentModel
      .findById(comment._id)
      .populate("user", "fullName email");

    res.status(201).json({
      success: true,
      message: "Comment created successfully",
      comment: populatedComment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

async function getCommentsByFood(req, res) {
  try {
    const { foodId } = req.params;

    const comments = await commentModel
      .find({ food: foodId })
      .sort({ createdAt: -1 })
      .populate("user", "fullName email");

    res.status(200).json({
      success: true,
      comments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

async function deleteComment(req, res) {
  try {
    const comment = await commentModel.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    if (comment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own comment",
      });
    }

    await comment.deleteOne();

    await foodModel.findByIdAndUpdate(comment.food, {
      $inc: { commentsCount: -1 },
    });

    res.status(200).json({
      success: true,
      message: "Comment deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

module.exports = {
  createComment,
  getCommentsByFood,
  deleteComment,
};
