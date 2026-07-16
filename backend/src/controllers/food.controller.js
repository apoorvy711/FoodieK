const mongoose = require("mongoose");
const path = require("path");
const foodModel = require("../models/food.model");
const likeModel = require("../models/likes.model");
const saveModel = require("../models/save.model");
const storageService = require("../services/storage.services");
const thumbnailService = require("../services/video-thumbnail.service");
const { v4: uuid } = require("uuid");

// ======================================================
// CREATE FOOD
// ======================================================

async function createFood(req, res) {
  try {
    const {
      name,
      description,
      category,
      price,
      preparationTime,
      foodType,
      cuisine,
      spiceLevel,
      ingredients,
      tags,
      isAvailable,
    } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Food video is required.",
      });
    }

    if (!name || !category || !price) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields.",
      });
    }

    const fileExtension = path.extname(req.file.originalname || "") || ".mp4";

    const uploadedVideo = await storageService.uploadFile(
      req.file.buffer,
      `${uuid()}${fileExtension}`,
    );

    const thumbnailBuffer = await thumbnailService.generateThumbnailBuffer({
      videoBuffer: req.file.buffer,
      extension: fileExtension,
    });

    const uploadedThumbnail = await storageService.uploadFile(
      thumbnailBuffer,
      `${uuid()}.jpg`,
    );

    const food = await foodModel.create({
      name,
      description,
      video: uploadedVideo.url,
      thumbnail: uploadedThumbnail.url,

      category,
      foodPartner: req.foodPartner._id,

      price: Number(price),

      preparationTime: Number(preparationTime),

      foodType,

      cuisine,

      spiceLevel,

      ingredients:
        typeof ingredients === "string"
          ? ingredients
              .split(",")
              .map((i) => i.trim())
              .filter(Boolean)
          : [],

      tags:
        typeof tags === "string"
          ? tags
              .split(",")
              .map((i) => i.trim())
              .filter(Boolean)
          : [],

      isAvailable: isAvailable === undefined ? true : isAvailable === "true",
    });

    return res.status(201).json({
      success: true,
      message: "Food uploaded successfully.",
      food,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

// ======================================================
// GET ALL FOOD
// ======================================================

async function getFoodItems(req, res) {
  try {
    const { category = "", search = "", limit = "30", page = "1" } = req.query;

    const filter = {
      isAvailable: true,
    };

    // Category Filter
    if (category.trim()) {
      filter.category = category;
    }

    // Search by name or description
    if (search.trim()) {
      filter.$or = [
        {
          name: {
            $regex: search,
            $options: "i",
          },
        },
        {
          description: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    const safeLimit = Math.min(
      100,
      Math.max(1, Number.parseInt(limit, 10) || 30),
    );
    const safePage = Math.max(1, Number.parseInt(page, 10) || 1);

    const foodItems = await foodModel
      .find(filter)
      .populate("category")
      .populate("foodPartner", "name address contactName phone")
      .sort({
        createdAt: -1,
      })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit);

    const total = await foodModel.countDocuments(filter);

    return res.status(200).json({
      success: true,
      count: foodItems.length,
      total,
      page: safePage,
      pages: Math.max(1, Math.ceil(total / safeLimit)),
      foodItems,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

// ======================================================
// GET FOOD BY ID
// ======================================================

async function getFoodById(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: "Food not found",
      });
    }

    const food = await foodModel
      .findById(id)
      .populate("category")
      .populate("foodPartner", "name address contactName phone");

    if (!food) {
      return res.status(404).json({
        success: false,
        message: "Food not found",
      });
    }

    await foodModel.findByIdAndUpdate(id, {
      $inc: {
        viewCount: 1,
      },
    });

    const relatedFoods = await foodModel
      .find({
        _id: {
          $ne: id,
        },
        category: food.category._id,
        isAvailable: true,
      })
      .limit(6)
      .populate("category")
      .populate("foodPartner", "name address contactName phone");

    return res.status(200).json({
      success: true,
      food,
      relatedFoods,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

async function searchFoods(req, res) {
  try {
    const { search = "", category = "" } = req.query;

    const filter = {
      isAvailable: true,
    };

    if (search) {
      filter.name = {
        $regex: search,
        $options: "i",
      };
    }

    if (category) {
      filter.category = category;
    }

    const foodItems = await foodModel
      .find(filter)
      .populate("category")
      .populate("foodPartner", "name address contactName phone")
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      count: foodItems.length,
      foodItems,
      items: foodItems,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

async function shareFood(req, res) {
  try {
    const { foodId } = req.body;

    if (!foodId) {
      return res.status(400).json({
        success: false,
        message: "Food id is required",
      });
    }

    const updatedFood = await foodModel.findByIdAndUpdate(
      foodId,
      {
        $inc: {
          shareCount: 1,
        },
      },
      {
        new: true,
      },
    );

    if (!updatedFood) {
      return res.status(404).json({
        success: false,
        message: "Food not found",
      });
    }

    return res.status(200).json({
      success: true,

      shareCount: updatedFood.shareCount,

      message: "Food shared successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,

      message: error.message,
    });
  }
}

// ======================================================
// LIKE / UNLIKE FOOD
// ======================================================

async function likeFood(req, res) {
  try {
    const { foodId } = req.body;

    const existingLike = await likeModel.findOne({
      user: req.user._id,
      food: foodId,
    });

    if (existingLike) {
      await likeModel.deleteOne({
        _id: existingLike._id,
      });

      await foodModel.findByIdAndUpdate(foodId, {
        $inc: {
          likeCount: -1,
        },
      });

      const updatedFood = await foodModel.findById(foodId);

      return res.status(200).json({
        success: true,
        liked: true,
        likeCount: updatedFood.likeCount,
        message: "Food liked successfully.",
      });
    }

    await likeModel.create({
      user: req.user._id,
      food: foodId,
    });

    await foodModel.findByIdAndUpdate(foodId, {
      $inc: {
        likeCount: 1,
      },
    });

    return res.status(200).json({
      success: true,
      liked: true,
      message: "Food liked successfully.",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

// ======================================================
// SAVE / UNSAVE FOOD
// ======================================================

async function saveFood(req, res) {
  try {
    const { foodId } = req.body;

    const existingSave = await saveModel.findOne({
      user: req.user._id,
      food: foodId,
    });

    if (existingSave) {
      await saveModel.deleteOne({
        _id: existingSave._id,
      });

      await foodModel.findByIdAndUpdate(foodId, {
        $inc: {
          savesCount: -1,
        },
      });

      return res.status(200).json({
        success: true,
        saved: false,
        message: "Food removed from saved items.",
      });
    }

    await saveModel.create({
      user: req.user._id,
      food: foodId,
    });

    await foodModel.findByIdAndUpdate(foodId, {
      $inc: {
        savesCount: 1,
      },
    });

    const updatedFood = await foodModel.findById(foodId);

    return res.status(200).json({
      success: true,
      saved: true,
      savesCount: updatedFood.savesCount,
      message: "Food saved successfully.",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

// ======================================================
// GET SAVED FOODS
// ======================================================

async function getSaveFood(req, res) {
  try {
    const query = req.user ? { user: req.user._id } : {};

    const savedFoods = await saveModel
      .find(query)
      .populate({
        path: "food",
        populate: [
          {
            path: "category",
          },
          {
            path: "foodPartner",
            select: "name address contactName phone",
          },
        ],
      })
      .sort({ createdAt: -1 })
      .limit(req.user ? undefined : 6);

    return res.status(200).json({
      success: true,
      count: savedFoods.length,
      savedFoods,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

// ======================================================
// EXPORTS
// ======================================================

module.exports = {
  createFood,
  getFoodItems,
  getFoodById,
  likeFood,
  saveFood,
  shareFood,
  searchFoods,
  getSaveFood,
};
