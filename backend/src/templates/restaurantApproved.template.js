const restaurantApprovedTemplate = (restaurantName, ownerName) => {
  return {
    subject: "Restaurant approved",
    html: `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Restaurant Approved</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0">
<tr>
<td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;margin-top:40px;border-radius:10px;overflow:hidden;">
<tr>
<td style="background:#27ae60;color:white;padding:24px;text-align:center;">
<h1 style="margin:0;">Your restaurant is now live</h1>
</td>
</tr>
<tr>
<td style="padding:32px;">
<h2 style="margin-top:0;">Hello ${ownerName},</h2>
<p>Your restaurant <strong>${restaurantName}</strong> has been approved and is now visible on FoodieK.</p>
<p>You can now add food items, receive orders, and manage your restaurant dashboard.</p>
<p style="margin-top:28px;">Team FoodieK</p>
</td>
</tr>
</table>
</td>
</tr>
</table>
</body>
</html>
`,
  };
};

module.exports = restaurantApprovedTemplate;
