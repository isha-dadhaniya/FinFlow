const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI;

    // Ensure the database URL is configured
    if (!mongoURI) {
      throw new Error(
        "MONGO_URI is missing. Configure it in your environment variables."
      );
    }

    console.log("Connecting to MongoDB...");

    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 10000,
    });

    console.log("🚀 MongoDB Connected Successfully!");

    return mongoose.connection;
  } catch (error) {
    console.error("❌ MongoDB Connection Failed:", error.message);

    // Propagate the error so server.js does not start without MongoDB
    throw error;
  }
};

module.exports = connectDB;
