function passwordResetTemplate(name, resetLink) {
  return {
    subject: "Reset Your FoodieK Password 🔐",

    html: `
<!DOCTYPE html>
<html>

<head>
<meta charset="UTF-8">
<title>Reset Password</title>
</head>

<body style="
font-family:Arial,sans-serif;
background:#f4f4f4;
padding:40px;
">

<div style="
max-width:600px;
margin:auto;
background:white;
padding:40px;
border-radius:12px;
">

<h1 style="color:#ff6b00;">
FoodieK
</h1>

<h2>Hello ${name},</h2>

<p>
We received a request to reset your FoodieK account password.
</p>

<p>
Click the button below to choose a new password.
</p>

<div style="margin:35px 0;text-align:center;">

<a
href="${resetLink}"
style="
background:#ff6b00;
color:white;
padding:14px 28px;
text-decoration:none;
border-radius:8px;
font-weight:bold;
display:inline-block;
">
Reset Password
</a>

</div>

<p>
This link will expire in
<strong>15 minutes</strong>.
</p>

<p>
If you didn't request this password reset,
you can safely ignore this email.
Your password will remain unchanged.
</p>

<hr>

<p style="color:gray;font-size:13px;">
FoodieK Team ❤️
</p>

</div>

</body>

</html>
`,
  };
}

module.exports = passwordResetTemplate;
