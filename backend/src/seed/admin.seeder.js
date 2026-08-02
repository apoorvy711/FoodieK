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

  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  // Look for an existing admin first
  let admin = await userModel.findOne({ role: "admin" });

  if (admin) {
    admin.fullName = adminName;
    admin.email = adminEmail;

    // Update password only if it has changed
    const passwordMatches = await bcrypt.compare(adminPassword, admin.password);

    if (!passwordMatches) {
      admin.password = hashedPassword;
    }

    admin.role = "admin";

    await admin.save();

    console.log(
      "[admin-seeder] Existing admin synchronized with ADMIN_* environment variables.",
    );

    return {
      created: false,
      updated: true,
    };
  }

  // No admin exists.
  // Check if there's already a normal user with the configured email.
  const existingUser = await userModel.findOne({ email: adminEmail });

  if (existingUser) {
    existingUser.fullName = adminName;

    const passwordMatches = await bcrypt.compare(
      adminPassword,
      existingUser.password,
    );

    if (!passwordMatches) {
      existingUser.password = hashedPassword;
    }

    existingUser.role = "admin";

    await existingUser.save();

    console.log(
      "[admin-seeder] Existing user promoted to admin using ADMIN_EMAIL.",
    );

    return {
      created: false,
      promoted: true,
      updated: true,
    };
  }

  // Create a brand new admin
  await userModel.create({
    fullName: adminName,
    email: adminEmail,
    password: hashedPassword,
    role: "admin",
  });

  console.log("[admin-seeder] Admin created successfully.");

  return {
    created: true,
    promoted: false,
  };
}

module.exports = {
  ensureSingleAdminFromEnv,
};
