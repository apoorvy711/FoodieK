const restaurantVerificationStartedTemplate = (restaurantName, ownerName) => {
  return {
    subject: "Restaurant verification started",
    html: `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Restaurant Verification Started</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0">
<tr>
<td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;margin-top:40px;border-radius:10px;overflow:hidden;">
<tr>
<td style="background:#ff6b35;color:white;padding:24px;text-align:center;">
<h1 style="margin:0;">FoodieK Restaurant Verification</h1>
</td>
</tr>
<tr>
<td style="padding:32px;">
<h2 style="margin-top:0;">Hello ${ownerName},</h2>
<p>Your restaurant request for <strong>${restaurantName}</strong> has been received.</p>
<p>Your restaurant stays hidden while our verification team reviews your details.</p>
<p>Status: <strong>Pending Verification</strong></p>
<p>We will notify you by email after approval or rejection.</p>
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

module.exports = restaurantVerificationStartedTemplate;
