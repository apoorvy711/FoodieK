const emailQueue = require("../queues/email.queue");

/**
 * Common BullMQ options for all email jobs.
 */
const queueOptions = {
  attempts: 3,

  backoff: {
    type: "exponential",
    delay: 2000,
  },

  removeOnComplete: true,
  removeOnFail: 100,
};

/**
 * Queue Customer Welcome Email
 */
async function addCustomerWelcomeEmail(user) {
  return emailQueue.add(
    "customerWelcome",
    {
      userId: user._id,
      name: user.fullName,
      email: user.email,
    },
    queueOptions,
  );
}

/**
 * Queue Restaurant Welcome Email
 */
async function addRestaurantWelcomeEmail(restaurant) {
  return emailQueue.add(
    "restaurantWelcome",
    {
      restaurantId: restaurant._id,
      restaurantName: restaurant.restaurantName,
      email: restaurant.email,
    },
    queueOptions,
  );
}

/**
 * Queue Forgot Password Email
 */
async function addForgotPasswordEmail({ name, email, resetLink }) {
  return emailQueue.add(
    "forgotPassword",
    {
      name,
      email,
      resetLink,
    },
    queueOptions,
  );
}

module.exports = {
  addCustomerWelcomeEmail,
  addRestaurantWelcomeEmail,
  addForgotPasswordEmail,
};
