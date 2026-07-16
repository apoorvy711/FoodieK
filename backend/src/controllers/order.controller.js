const cartModel = require("../models/cart.model");
const orderItemModel = require("../models/orderItem.model");
const orderModel = require("../models/order.model");
const foodModel = require("../models/food.model");
const notificationService = require("../services/notification.service");

async function addToCart(req, res) {
  try {
    const { foodId, quantity = 1 } = req.body;

    const food = await foodModel.findById(foodId);

    if (!food) {
      return res.status(404).json({
        success: false,
        message: "Food not found",
      });
    }

    let cart = await cartModel.findOne({ user: req.user._id });

    if (!cart) {
      cart = await cartModel.create({
        user: req.user._id,
        items: [],
        totalAmount: 0,
      });
    }

    const existingItem = cart.items.find(
      (item) => item.food.toString() === foodId,
    );

    if (existingItem) {
      existingItem.quantity += Number(quantity);
      existingItem.price = food.price;
    } else {
      cart.items.push({
        food: foodId,
        quantity: Number(quantity),
        price: food.price,
      });
    }

    cart.totalAmount = cart.items.reduce(
      (sum, item) => sum + item.quantity * item.price,
      0,
    );

    await cart.save();

    res.status(200).json({
      success: true,
      message: "Item added to cart",
      cart,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

async function getCart(req, res) {
  try {
    const cart = await cartModel
      .findOne({ user: req.user._id })
      .populate({ path: "items.food", populate: { path: "category" } });

    res.status(200).json({
      success: true,
      cart: cart || { items: [], totalAmount: 0 },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

async function removeFromCart(req, res) {
  try {
    const { foodId } = req.params;
    const cart = await cartModel.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    const existingItemIndex = cart.items.findIndex(
      (item) => item.food.toString() === foodId,
    );

    if (existingItemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Item not found in cart",
      });
    }

    cart.items.splice(existingItemIndex, 1);
    cart.totalAmount = cart.items.reduce(
      (sum, item) => sum + item.quantity * item.price,
      0,
    );

    await cart.save();

    res.status(200).json({
      success: true,
      message: "Item removed from cart",
      cart,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

async function createOrder(req, res) {
  try {
    const { deliveryAddress, paymentMethod } = req.body;
    const cart = await cartModel.findOne({ user: req.user._id });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty",
      });
    }

    const orderItems = await Promise.all(
      cart.items.map(async (item) => {
        const orderItem = await orderItemModel.create({
          food: item.food,
          quantity: item.quantity,
          price: item.price,
        });

        return orderItem._id;
      }),
    );

    const order = await orderModel.create({
      user: req.user._id,
      items: orderItems,
      totalAmount: cart.totalAmount,
      deliveryAddress,
      paymentMethod,
      paymentStatus: "pending",
      statusHistory: [
        {
          status: "pending",
          note: "Order created",
          changedAt: new Date(),
        },
      ],
    });

    await cartModel.findByIdAndDelete(cart._id);

    await notificationService.createUserNotification({
      userId: req.user._id,
      title: "Order placed",
      message: `Your order ${order._id.toString().slice(-6)} has been placed successfully.`,
      type: "order",
      link: "/orders",
    });

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

async function getFoodPartnerOrders(req, res) {
  try {
    const orders = await orderModel
      .find({})
      .populate({
        path: "items",
        populate: {
          path: "food",
          populate: {
            path: "category",
          },
        },
      })
      .populate("user", "fullName email")
      .sort({ createdAt: -1 });

    const filtered = orders.filter((order) =>
      order.items.some(
        (item) =>
          item.food &&
          item.food.foodPartner &&
          item.food.foodPartner.toString() === req.foodPartner._id.toString(),
      ),
    );

    return res.status(200).json({
      success: true,
      orders: filtered,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

async function updateOrderStatus(req, res) {
  try {
    const { orderId } = req.params;
    const { status, note = "" } = req.body;

    const order = await orderModel.findById(orderId).populate({
      path: "items",
      populate: {
        path: "food",
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const belongsToPartner = order.items.some(
      (item) =>
        item.food &&
        item.food.foodPartner &&
        item.food.foodPartner.toString() === req.foodPartner._id.toString(),
    );

    if (!belongsToPartner) {
      return res.status(403).json({
        success: false,
        message: "You cannot update this order",
      });
    }

    order.status = status;
    order.statusHistory.push({
      status,
      note,
      changedAt: new Date(),
    });

    if (status === "refunded") {
      order.paymentStatus = "refunded";
    }

    await order.save();

    await notificationService.createUserNotification({
      userId: order.user,
      title: "Order status updated",
      message: `Order ${order._id.toString().slice(-6)} is now ${status}.`,
      type: "order",
      link: "/orders",
    });

    return res.status(200).json({
      success: true,
      message: "Order status updated",
      order,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

async function getOrders(req, res) {
  try {
    const orders = await orderModel
      .find({ user: req.user._id })
      .populate({
        path: "items",
        populate: {
          path: "food",
          populate: {
            path: "category",
          },
        },
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

module.exports = {
  addToCart,
  getCart,
  removeFromCart,
  createOrder,
  getOrders,
  getFoodPartnerOrders,
  updateOrderStatus,
};
