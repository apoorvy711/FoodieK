require("dotenv").config();

const connectDB = require("../src/db/db");
const { ensureSingleAdminFromEnv } = require("../src/seed/admin.seeder");

async function run() {
  try {
    await connectDB();
    await ensureSingleAdminFromEnv();
    process.exit(0);
  } catch (error) {
    console.error("[admin-seeder] Failed to seed admin:", error.message);
    process.exit(1);
  }
}

run();
