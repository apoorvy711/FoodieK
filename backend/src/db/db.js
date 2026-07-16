const mongoose = require("mongoose");

const localMongoUri = "mongodb://127.0.0.1:27017/foodiek";

async function connectDB() {
  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }

  const primaryUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  const preferLocalFirst = process.env.NODE_ENV !== "production";
  const candidateUris = preferLocalFirst
    ? [localMongoUri, primaryUri]
    : [primaryUri, localMongoUri];

  for (const uri of candidateUris) {
    if (!uri) {
      continue;
    }

    try {
      await mongoose.connect(uri);
      console.log("MongoDB connected");
      console.log("Database:", mongoose.connection.name);
      return mongoose.connection;
    } catch (err) {
      console.log(`MongoDB connection attempt failed for ${uri}`, err.message);
    }
  }

  throw new Error("Unable to connect to MongoDB");
}

module.exports = connectDB;
