function announcementTemplate({ recipientName, title, message }) {
  return {
    subject: `[FoodieK] ${title}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #0f172a;">
        <h2 style="margin: 0 0 12px; color: #ea580c;">FoodieK Announcement</h2>
        <p style="margin: 0 0 10px;">Hi ${recipientName || "there"},</p>
        <p style="margin: 0 0 8px;"><strong>${title}</strong></p>
        <p style="margin: 0 0 12px; white-space: pre-line;">${message}</p>
        <p style="margin: 0; color: #475569;">Thank you,<br/>Team FoodieK</p>
      </div>
    `,
  };
}

module.exports = announcementTemplate;
