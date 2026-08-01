require("dotenv").config();

const emailService = require("./src/services/email.service");

async function test() {
  const partner = {
    ownerName: "Apoorv Yadav",
    restaurantName: "Apoorv's Kitchen",
    email: process.env.EMAIL,
  };

  await emailService.sendRestaurantWelcomeEmail(partner);

  console.log("✅ Restaurant Welcome Email Sent Successfully");
}

test();
