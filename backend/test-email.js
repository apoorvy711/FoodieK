require("dotenv").config();

const transporter = require("./src/config/email.config");

(async () => {
  try {
    console.log("EMAIL:", process.env.EMAIL);
    console.log("PASSWORD:", process.env.EMAIL_PASSWORD);

    await transporter.verify();
    console.log("✅ SMTP Connected");

    await transporter.sendMail({
      from: `"FoodieK Team" <${process.env.EMAIL}>`,
      to: process.env.EMAIL,
      subject: "FoodieK Test",
      text: "Testing Nodemailer",
    });

    console.log("✅ Email Sent Successfully");
  } catch (err) {
    console.error(err);
  }
})();
