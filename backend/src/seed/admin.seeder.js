const bcrypt = require("bcryptjs");
const userModel = require("../models/user.model");

async function ensureSingleAdminFromEnv() {
  const adminName = process.env.ADMIN_NAME?.trim();
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminName || !adminEmail || !adminPassword) {
    console.log(
      "[admin-seeder] ADMIN_NAME, ADMIN_EMAIL or ADMIN_PASSWORD is missing. Skipping admin seeding.",
    );
    return { created: false, skipped: true };
  }

  const existingAdmin = await userModel
    .findOne({ role: "admin" })
    .select("_id");

  if (existingAdmin) {
    console.log("[admin-seeder] Admin already exists. No new admin created.");
    return { created: false, skipped: true };
  }

  const existingUserByEmail = await userModel.findOne({ email: adminEmail });

  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  if (existingUserByEmail) {
    existingUserByEmail.fullName = adminName;
    existingUserByEmail.password = hashedPassword;
    existingUserByEmail.role = "admin";
    await existingUserByEmail.save();

    console.log(
      "[admin-seeder] Existing user promoted to admin using ADMIN_EMAIL.",
    );

    return { created: true, promoted: true };
  }

  await userModel.create({
    fullName: adminName,
    email: adminEmail,
    password: hashedPassword,
    role: "admin",
  });

  console.log("[admin-seeder] Admin created successfully.");

  return { created: true, promoted: false };
}

module.exports = {
  ensureSingleAdminFromEnv,
};
