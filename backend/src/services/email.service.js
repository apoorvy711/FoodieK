const transporter = require("../config/email.config");
const customerWelcomeTemplate = require("../templates/customerWelcome.template");
const restaurantWelcomeTemplate = require("../templates/restaurantWelcome.template");
const passwordResetTemplate = require("../templates/passwordReset.template");
const restaurantVerificationStartedTemplate = require("../templates/restaurantVerificationStarted.template");
const restaurantApprovedTemplate = require("../templates/restaurantApproved.template");
const restaurantRejectedTemplate = require("../templates/restaurantRejected.template");
const announcementTemplate = require("../templates/announcement.template");

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

  async sendRestaurantVerificationStartedEmail({
    email,
    ownerName,
    restaurantName,
  }) {
    const template = restaurantVerificationStartedTemplate(
      restaurantName,
      ownerName,
    );

    return this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
    });
  }

  async sendRestaurantApprovedEmail({ email, ownerName, restaurantName }) {
    const template = restaurantApprovedTemplate(restaurantName, ownerName);

    return this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
    });
  }

  async sendRestaurantRejectedEmail({
    email,
    ownerName,
    restaurantName,
    rejectionReason,
  }) {
    const template = restaurantRejectedTemplate(
      restaurantName,
      ownerName,
      rejectionReason,
    );

    return this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
    });
  }

  async sendAnnouncementEmail({ email, recipientName, title, message }) {
    const template = announcementTemplate({
      recipientName,
      title,
      message,
    });

    return this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
    });
  }
}

module.exports = new EmailService();
