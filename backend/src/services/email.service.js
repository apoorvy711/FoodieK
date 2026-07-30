const transporter = require("../config/email.config");
const customerWelcomeTemplate = require("../templates/customerWelcome.template");
const restaurantWelcomeTemplate = require("../templates/restaurantWelcome.template");
const passwordResetTemplate = require("../templates/passwordReset.template");

class EmailService {
  async sendEmail({ to, subject, text, html }) {
    const info = await transporter.sendMail({
      from: `"FoodieK Team" <${process.env.EMAIL}>`,
      to,
      subject,
      text,
      html,
    });

    return info;
  }

  async sendCustomerWelcomeEmail(user) {
    const email = customerWelcomeTemplate(user.name);

    return this.sendEmail({
      to: user.email,
      subject: email.subject,
      html: email.html,
    });
  }

  async sendRestaurantWelcomeEmail(partner) {
    const email = restaurantWelcomeTemplate(
      partner.restaurantName,
      partner.ownerName,
    );

    return this.sendEmail({
      to: partner.email,
      subject: email.subject,
      html: email.html,
    });
  }

  async sendPasswordResetEmail(user, resetLink) {
    const email = passwordResetTemplate(user.name, resetLink);

    return this.sendEmail({
      to: user.email,
      subject: email.subject,
      html: email.html,
    });
  }
}

module.exports = new EmailService();
