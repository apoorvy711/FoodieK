const userModel = require("../models/user.model");
const foodPartnerModel = require("../models/foodpartner.model");
const foodModel = require("../models/food.model");
const orderModel = require("../models/order.model");
const restaurantRequestModel = require("../models/restaurantRequest.model");
const mongoose = require("mongoose");
const emailQueueService = require("../services/emailQueue.service");
const notificationService = require("../services/notification.service");

function getAlreadyHandledStatusMessage(status) {
  if (status === "approved") {
    return "Restaurant request is already approved";
  }

  if (status === "rejected") {
    return "Restaurant request is already rejected";
  }

  return "Restaurant request cannot be processed";
}

function getCurrentAdmin(req, res) {
  return res.status(200).json({
    success: true,
    admin: {
      _id: req.admin._id,
      fullName: req.admin.fullName,
      email: req.admin.email,
      role: req.admin.role,
      createdAt: req.admin.createdAt,
      lastLogin: req.admin.lastLogin || null,
    },
  });
}

async function getDashboard(req, res) {
  try {
    const [
      users,
      partners,
      foods,
      orders,
      pendingRestaurantRequests,
      revenueAgg,
      recentRequests,
    ] = await Promise.all([
      userModel.countDocuments({}),
      foodPartnerModel.countDocuments({}),
      foodModel.countDocuments({}),
      orderModel.countDocuments({}),
      restaurantRequestModel.countDocuments({ status: "pending" }),
      orderModel.aggregate([
        {
          $match: {
            paymentStatus: "paid",
          },
        },
        {
          $group: {
            _id: null,
            totalRevenue: {
              $sum: "$totalAmount",
            },
          },
        },
      ]),
      restaurantRequestModel
        .find({})
        .populate("owner", "name email contactName")
        .sort({ submittedAt: -1 })
        .limit(5),
    ]);

    const totalRevenue = revenueAgg?.[0]?.totalRevenue || 0;

    return res.status(200).json({
      success: true,
      stats: {
        users,
        partners,
        foods,
        orders,
        pendingRestaurantRequests,
        totalRevenue,
      },
      recentRequests,
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

async function listRestaurantRequests(req, res) {
  try {
    const restaurantRequests = await restaurantRequestModel
      .find({})
      .populate("owner", "name email contactName phone")
      .populate("category", "name")
      .sort({ submittedAt: -1 });

    return res.status(200).json({
      success: true,
      restaurantRequests,
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

async function getRestaurantRequestDetails(req, res) {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid restaurant request id",
      });
    }

    const restaurantRequest = await restaurantRequestModel
      .findById(req.params.id)
      .populate("owner", "name email contactName phone address")
      .populate("category", "name");

    if (!restaurantRequest) {
      return res.status(404).json({
        success: false,
        message: "Restaurant request not found",
      });
    }

    return res.status(200).json({
      success: true,
      restaurantRequest,
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

async function listOrders(req, res) {
  try {
    const orders = await orderModel
      .find({})
      .populate("user", "fullName email")
      .populate({
        path: "items",
        populate: {
          path: "food",
          populate: {
            path: "foodPartner",
            select: "name",
          },
        },
      })
      .sort({ createdAt: -1 });

    const normalizedOrders = orders.map((order) => {
      const partnerNames = new Set();

      (order.items || []).forEach((item) => {
        const partnerName = item?.food?.foodPartner?.name;
        if (partnerName) {
          partnerNames.add(partnerName);
        }
      });

      return {
        _id: order._id,
        user: order.user,
        restaurants: Array.from(partnerNames),
        totalAmount: order.totalAmount,
        status: order.status,
        paymentStatus: order.paymentStatus,
        createdAt: order.createdAt,
      };
    });

    return res.status(200).json({
      success: true,
      orders: normalizedOrders,
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

async function approveRestaurantRequest(req, res) {
  try {
    const requestId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid restaurant request id",
      });
    }

    const existingRequest = await restaurantRequestModel
      .findById(requestId)
      .populate("owner", "name contactName email status");

    if (!existingRequest) {
      return res.status(404).json({
        success: false,
        message: "Restaurant request not found",
      });
    }

    if (existingRequest.status !== "pending") {
      return res.status(409).json({
        success: false,
        message: getAlreadyHandledStatusMessage(existingRequest.status),
      });
    }

    const requestOwner = existingRequest.owner;

    if (!requestOwner) {
      return res.status(404).json({
        success: false,
        message: "Request owner no longer exists",
      });
    }

    const approvedRequest = await restaurantRequestModel
      .findOneAndUpdate(
        {
          _id: requestId,
          status: "pending",
        },
        {
          $set: {
            status: "approved",
            reviewedAt: new Date(),
            rejectionReason: "",
          },
        },
        {
          new: true,
        },
      )
      .populate("owner", "name contactName email")
      .populate("category", "name");

    if (!approvedRequest) {
      const latestRequest = await restaurantRequestModel.findById(requestId);
      return res.status(409).json({
        success: false,
        message: getAlreadyHandledStatusMessage(latestRequest?.status),
      });
    }

    await foodPartnerModel.findByIdAndUpdate(approvedRequest.owner._id, {
      $set: {
        status: "approved",
      },
    });

    await Promise.all([
      emailQueueService.addRestaurantApprovedEmail({
        email: approvedRequest.owner.email,
        ownerName:
          approvedRequest.owner.contactName || approvedRequest.owner.name,
        restaurantName: approvedRequest.restaurantName,
      }),
      notificationService.createUserNotification({
        userId: approvedRequest.owner._id,
        title: "Restaurant Verification Approved",
        message: `${approvedRequest.restaurantName} is now approved and live on FoodieK.`,
        type: "system",
        link: "/food-partner/verification",
      }),
    ]);

    return res.status(200).json({
      success: true,
      message: "Restaurant request approved successfully",
      restaurantRequest: approvedRequest,
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

async function rejectRestaurantRequest(req, res) {
  try {
    const requestId = req.params.id;
    const rejectionReason = req.body.rejectionReason?.trim();

    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid restaurant request id",
      });
    }

    if (!rejectionReason) {
      return res.status(422).json({
        success: false,
        message: "Rejection reason is required",
      });
    }

    const existingRequest = await restaurantRequestModel
      .findById(requestId)
      .populate("owner", "name contactName email status");

    if (!existingRequest) {
      return res.status(404).json({
        success: false,
        message: "Restaurant request not found",
      });
    }

    if (existingRequest.status !== "pending") {
      return res.status(409).json({
        success: false,
        message: getAlreadyHandledStatusMessage(existingRequest.status),
      });
    }

    const requestOwner = existingRequest.owner;

    if (!requestOwner) {
      return res.status(404).json({
        success: false,
        message: "Request owner no longer exists",
      });
    }

    const rejectedRequest = await restaurantRequestModel
      .findOneAndUpdate(
        {
          _id: requestId,
          status: "pending",
        },
        {
          $set: {
            status: "rejected",
            reviewedAt: new Date(),
            rejectionReason,
          },
        },
        {
          new: true,
        },
      )
      .populate("owner", "name contactName email")
      .populate("category", "name");

    if (!rejectedRequest) {
      const latestRequest = await restaurantRequestModel.findById(requestId);
      return res.status(409).json({
        success: false,
        message: getAlreadyHandledStatusMessage(latestRequest?.status),
      });
    }

    await foodPartnerModel.findByIdAndUpdate(rejectedRequest.owner._id, {
      $set: {
        status: "rejected",
      },
    });

    await Promise.all([
      emailQueueService.addRestaurantRejectedEmail({
        email: rejectedRequest.owner.email,
        ownerName:
          rejectedRequest.owner.contactName || rejectedRequest.owner.name,
        restaurantName: rejectedRequest.restaurantName,
        rejectionReason,
      }),
      notificationService.createUserNotification({
        userId: rejectedRequest.owner._id,
        title: "Restaurant Verification Rejected",
        message: `Verification for ${rejectedRequest.restaurantName} was rejected. Reason: ${rejectionReason}`,
        type: "system",
        link: "/food-partner/verification",
      }),
    ]);

    return res.status(200).json({
      success: true,
      message: "Restaurant request rejected successfully",
      restaurantRequest: rejectedRequest,
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

async function listUsers(req, res) {
  try {
    const users = await userModel
      .find({})
      .select("-password")
      .sort({ createdAt: -1 });
    return res.status(200).json({ success: true, users });
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

async function listFoodPartners(req, res) {
  try {
    const foodPartners = await foodPartnerModel
      .find({})
      .select("-password")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, foodPartners });
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

async function toggleFoodPartnerActiveStatus(req, res) {
  try {
    const partnerId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(partnerId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid food partner id",
      });
    }

    const foodPartner = await foodPartnerModel.findById(partnerId);

    if (!foodPartner) {
      return res.status(404).json({
        success: false,
        message: "Food partner not found",
      });
    }

    foodPartner.isActive = foodPartner.isActive === false;
    await foodPartner.save();

    return res.status(200).json({
      success: true,
      message: `Restaurant ${foodPartner.isActive ? "activated" : "deactivated"} successfully`,
      foodPartner,
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

async function createAnnouncement(req, res) {
  try {
    const title = req.body.title?.trim();
    const message = req.body.message?.trim();
    const audience = req.body.audience;

    const targetCustomers = audience === "everyone" || audience === "customers";
    const targetRestaurantOwners =
      audience === "everyone" || audience === "restaurant_owners";

    const tasks = [];
    const deliveryStats = {
      inAppNotifications: 0,
      queuedEmails: 0,
    };

    if (targetCustomers) {
      const customers = await userModel
        .find({ role: "user" })
        .select("_id fullName email");

      deliveryStats.inAppNotifications += customers.length;

      customers.forEach((customer) => {
        tasks.push(
          notificationService.createUserNotification({
            userId: customer._id,
            title,
            message,
            type: "system",
            link: "/notifications",
          }),
        );

        if (customer.email) {
          deliveryStats.queuedEmails += 1;
          tasks.push(
            emailQueueService.addAnnouncementEmail({
              email: customer.email,
              recipientName: customer.fullName,
              title,
              message,
            }),
          );
        }
      });
    }

    if (targetRestaurantOwners) {
      const restaurantOwners = await foodPartnerModel
        .find({})
        .select("contactName name email");

      restaurantOwners.forEach((owner) => {
        if (!owner.email) {
          return;
        }

        deliveryStats.queuedEmails += 1;
        tasks.push(
          emailQueueService.addAnnouncementEmail({
            email: owner.email,
            recipientName: owner.contactName || owner.name,
            title,
            message,
          }),
        );
      });
    }

    await Promise.all(tasks);

    return res.status(200).json({
      success: true,
      message: "Announcement queued successfully",
      deliveryStats,
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

async function listFoods(req, res) {
  try {
    const foods = await foodModel
      .find({})
      .populate("category", "name")
      .populate("foodPartner", "name")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, foods });
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

async function toggleFoodAvailability(req, res) {
  try {
    const food = await foodModel.findById(req.params.id);

    if (!food) {
      return res
        .status(404)
        .json({ success: false, message: "Food not found" });
    }

    food.isAvailable = !food.isAvailable;
    await food.save();

    return res.status(200).json({
      success: true,
      message: "Food availability updated",
      food,
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
  getCurrentAdmin,
  getDashboard,
  listUsers,
  listFoodPartners,
  toggleFoodPartnerActiveStatus,
  createAnnouncement,
  listFoods,
  toggleFoodAvailability,
  listRestaurantRequests,
  getRestaurantRequestDetails,
  listOrders,
  approveRestaurantRequest,
  rejectRestaurantRequest,
};
