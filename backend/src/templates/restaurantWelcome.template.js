const restaurantWelcomeTemplate = (restaurantName, ownerName) => {
  return {
    subject: "🎉 Welcome to FoodieK Partner!",
    html: `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Welcome Partner</title>
</head>

<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0">
<tr>
<td align="center">

<table width="600" cellpadding="0" cellspacing="0"
style="background:#ffffff;margin-top:40px;border-radius:10px;overflow:hidden;">

<tr>
<td style="background:#ff6b35;color:white;padding:30px;text-align:center;">

<h1 style="margin:0;">
🍔 FoodieK Partner
</h1>

</td>
</tr>

<tr>
<td style="padding:40px;">

<h2>Hello ${ownerName}, 👋</h2>

<p>
Welcome to the <strong>FoodieK Partner Program</strong>.
</p>

<p>
Your restaurant
<strong>${restaurantName}</strong>
has been successfully registered.
</p>

<p>
Our team will review your restaurant information.
Once approved, customers will be able to discover your restaurant,
watch your food reels, and place orders.
</p>

<br>

<div style="text-align:center;">

<a
href="http://localhost:5173/partner/dashboard"
style="
background:#ff6b35;
color:white;
padding:14px 28px;
border-radius:8px;
text-decoration:none;
font-weight:bold;
">

Open Partner Dashboard

</a>

</div>

<br>

<p>
Thank you for joining FoodieK.
</p>

<p>
<strong>Team FoodieK</strong>
</p>

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

module.exports = restaurantWelcomeTemplate;
