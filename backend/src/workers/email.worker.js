console.log("==================================");
console.log("EMAIL WORKER FILE EXECUTED");
console.log(__filename);
console.log("==================================");

require("dotenv").config();

console.log("EMAIL:", process.env.EMAIL);
console.log("PASSWORD:", process.env.EMAIL_PASSWORD);

const { Worker } = require("bullmq");
const connection = require("../config/bullmq.config");
const emailService = require("../services/email.service");

console.log("✅ Email Worker Loaded");

const emailWorker = new Worker(
  "emailQueue",
  async (job) => {
    console.log("🔥 Processing:", job.name);

    switch (job.name) {
      case "customerWelcome": {
        const { name, email } = job.data;

        await emailService.sendCustomerWelcomeEmail({
          name,
          email,
        });

        console.log("✅ Welcome email sent to:", email);
        break;
      }
      case "forgotPassword": {
        const { name, email, resetLink } = job.data;

        await emailService.sendPasswordResetEmail(
          {
            name,
            email,
          },
          resetLink,
        );

        console.log(`Password reset email sent to ${email}`);

        break;
      }
      case "restaurantVerificationStarted": {
        const { email, ownerName, restaurantName } = job.data;

        await emailService.sendRestaurantVerificationStartedEmail({
          email,
          ownerName,
          restaurantName,
        });

        console.log(`Restaurant verification started email sent to ${email}`);

        break;
      }
      case "restaurantApproved": {
        const { email, ownerName, restaurantName } = job.data;

        await emailService.sendRestaurantApprovedEmail({
          email,
          ownerName,
          restaurantName,
        });

        console.log(`Restaurant approved email sent to ${email}`);

        break;
      }
      case "restaurantRejected": {
        const { email, ownerName, restaurantName, rejectionReason } = job.data;

        await emailService.sendRestaurantRejectedEmail({
          email,
          ownerName,
          restaurantName,
          rejectionReason,
        });

        console.log(`Restaurant rejected email sent to ${email}`);

        break;
      }
      case "announcement": {
        const { email, recipientName, title, message } = job.data;

        await emailService.sendAnnouncementEmail({
          email,
          recipientName,
          title,
          message,
        });

        console.log(`Announcement email sent to ${email}`);
        break;
      }

      default:
        console.log("Unknown Job:", job.name);
    }
  },
  {
    connection,
  },
);

emailWorker.on("ready", () => {
  console.log("✅ Worker Ready");
});

emailWorker.on("active", (job) => {
  console.log("🚀 Active:", job.name);
});

emailWorker.on("completed", (job) => {
  console.log(`
====================================
Job Completed
Job ID : ${job.id}
Job Name : ${job.name}
====================================
`);
});

emailWorker.on("failed", (job, err) => {
  console.log(`
====================================
Job Failed
Job ID : ${job.id}
Reason : ${err.message}
====================================
`);
});
emailWorker.on("error", (err) => {
  console.error("❌ Worker Error:", err);
});

module.exports = emailWorker;
