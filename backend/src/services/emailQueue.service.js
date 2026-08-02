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

/**
 * Queue Restaurant Verification Started Email
 */
async function addRestaurantVerificationStartedEmail({
  email,
  ownerName,
  restaurantName,
}) {
  return emailQueue.add(
    "restaurantVerificationStarted",
    {
      email,
      ownerName,
      restaurantName,
    },
    queueOptions,
  );
}

/**
 * Queue Restaurant Approved Email
 */
async function addRestaurantApprovedEmail({
  email,
  ownerName,
  restaurantName,
}) {
  return emailQueue.add(
    "restaurantApproved",
    {
      email,
      ownerName,
      restaurantName,
    },
    queueOptions,
  );
}

/**
 * Queue Restaurant Rejected Email
 */
async function addRestaurantRejectedEmail({
  email,
  ownerName,
  restaurantName,
  rejectionReason,
}) {
  return emailQueue.add(
    "restaurantRejected",
    {
      email,
      ownerName,
      restaurantName,
      rejectionReason,
    },
    queueOptions,
  );
}

/**
 * Queue Announcement Email
 */
async function addAnnouncementEmail({ email, recipientName, title, message }) {
  return emailQueue.add(
    "announcement",
    {
      email,
      recipientName,
      title,
      message,
    },
    queueOptions,
  );
}

module.exports = {
  addCustomerWelcomeEmail,
  addRestaurantWelcomeEmail,
  addForgotPasswordEmail,
  addRestaurantVerificationStartedEmail,
  addRestaurantApprovedEmail,
  addRestaurantRejectedEmail,
  addAnnouncementEmail,
};
