const mongoose = require("mongoose");
const path = require("path");
const { v4: uuid } = require("uuid");
const restaurantRequestModel = require("../models/restaurantRequest.model");
const categoryModel = require("../models/category.model");
const storageService = require("../services/storage.services");
const emailQueueService = require("../services/emailQueue.service");
const notificationService = require("../services/notification.service");
const userModel = require("../models/user.model");

function parseJsonField(value, fallback = {}) {
  if (!value) {
    return fallback;
  }

  if (typeof value === "object") {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch (error) {
    return fallback;
  }
}

function getStatusMessage(status) {
  if (status === "approved") {
    return "Restaurant request approved. Restaurant features are now unlocked.";
  }

  if (status === "rejected") {
    return "Restaurant request rejected. Please update details and submit again.";
  }

  return "Your restaurant request has been received. Our verification team is reviewing your submission. You'll receive an email after verification.";
}

function normalizeCoordinateValue(value) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const parsedValue = typeof value === "number" ? value : Number(value);

  return Number.isFinite(parsedValue) ? parsedValue : undefined;
}

async function createRestaurantRequest(req, res) {
  try {
    const {
      restaurantName,
      description,
      category,
      address,
      gst,
      fssai,
      pan,
      coordinates,
      bankDetails,
    } = req.body;

    const imageFiles = req.files?.restaurantImages || [];
    const videoFile = req.files?.restaurantVideo?.[0];

    if (imageFiles.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one restaurant image is required.",
      });
    }

    if (!videoFile) {
      return res.status(400).json({
        success: false,
        message: "Restaurant verification video is required.",
      });
    }

    const existingPendingRequest = await restaurantRequestModel.findOne({
      owner: req.foodPartner._id,
      status: "pending",
    });

    if (existingPendingRequest) {
      return res.status(409).json({
        success: false,
        message: "A restaurant verification request is already pending.",
      });
    }

    const categoryExists = await categoryModel.findById(category).select("_id");

    if (!categoryExists) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    const restaurantImages = await Promise.all(
      imageFiles.map(async (file) => {
        const extension = path.extname(file.originalname || "") || ".jpg";
        const uploaded = await storageService.uploadFile(
          file.buffer,
          `${uuid()}${extension}`,
        );
        return uploaded.url;
      }),
    );

    const videoExtension = path.extname(videoFile.originalname || "") || ".mp4";
    const uploadedVideo = await storageService.uploadFile(
      videoFile.buffer,
      `${uuid()}${videoExtension}`,
    );

    const parsedCoordinates = parseJsonField(coordinates, {});
    const parsedBankDetails = parseJsonField(bankDetails, {});
    const normalizedLat = normalizeCoordinateValue(parsedCoordinates.lat);
    const normalizedLng = normalizeCoordinateValue(parsedCoordinates.lng);

    const restaurantRequest = await restaurantRequestModel.create({
      restaurantName,
      description,
      category,
      address,
      coordinates: {
        lat: normalizedLat,
        lng: normalizedLng,
      },
      gst,
      fssai,
      pan,
      bankDetails: {
        accountHolderName: parsedBankDetails.accountHolderName || "",
        accountNumber: parsedBankDetails.accountNumber || "",
        ifsc: parsedBankDetails.ifsc || "",
        bankName: parsedBankDetails.bankName || "",
        branchName: parsedBankDetails.branchName || "",
      },
      restaurantImages,
      restaurantVideo: uploadedVideo.url,
      owner: req.foodPartner._id,
      status: "pending",
      submittedAt: new Date(),
    });

    req.foodPartner.status = "pending";
    await req.foodPartner.save();

    await emailQueueService.addRestaurantVerificationStartedEmail({
      email: req.foodPartner.email,
      ownerName: req.foodPartner.contactName || req.foodPartner.name,
      restaurantName,
    });

    const admins = await userModel.find({ role: "admin" }).select("_id");

    await Promise.all(
      admins.map((admin) =>
        notificationService.createUserNotification({
          userId: admin._id,
          title: "New Restaurant Verification Request",
          message: `${restaurantName} submitted by ${req.foodPartner.name}`,
          type: "system",
          link: "/admin/restaurant-requests",
        }),
      ),
    );

    return res.status(201).json({
      success: true,
      message: "Restaurant verification request submitted successfully.",
      request: {
        _id: restaurantRequest._id,
        status: restaurantRequest.status,
        submittedAt: restaurantRequest.submittedAt,
      },
    });
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      return res.status(422).json({
        success: false,
        message: error.message,
      });
    }

    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A pending restaurant request already exists.",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "production"
          ? "Internal Server Error"
          : error.message,
    });
  }
}

async function getRestaurantRequestStatus(req, res) {
  try {
    const latestRequest = await restaurantRequestModel
      .findOne({ owner: req.foodPartner._id })
      .populate("category", "name")
      .sort({ submittedAt: -1 });

    if (!latestRequest) {
      return res.status(200).json({
        success: true,
        hasRequest: false,
        status: null,
        message: "No restaurant verification request found.",
      });
    }

    return res.status(200).json({
      success: true,
      hasRequest: true,
      status: latestRequest.status,
      message: getStatusMessage(latestRequest.status),
      request: {
        _id: latestRequest._id,
        restaurantName: latestRequest.restaurantName,
        description: latestRequest.description,
        category: latestRequest.category,
        address: latestRequest.address,
        coordinates: latestRequest.coordinates,
        gst: latestRequest.gst,
        fssai: latestRequest.fssai,
        pan: latestRequest.pan,
        bankDetails: latestRequest.bankDetails,
        restaurantImages: latestRequest.restaurantImages,
        restaurantVideo: latestRequest.restaurantVideo,
        submittedAt: latestRequest.submittedAt,
        reviewedAt: latestRequest.reviewedAt,
        rejectionReason: latestRequest.rejectionReason,
      },
      isRestaurantFeatureLocked: latestRequest.status !== "approved",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "production"
          ? "Internal Server Error"
          : error.message,
    });
  }
}

module.exports = {
  createRestaurantRequest,
  getRestaurantRequestStatus,
};
