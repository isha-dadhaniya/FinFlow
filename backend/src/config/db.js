const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    let mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://127.0.0.1:27017/finflow";
    mongoUri = mongoUri.replace(/^["']|["']$/g, "").trim();
    console.log(`Connecting to MongoDB (${mongoUri.includes("@") ? "Atlas Cloud" : mongoUri})...`);
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log("🚀 MongoDB Connected Successfully!");
  } catch (error) {
    console.error("❌ MongoDB Connection Failed:", error.message);
  }
};

module.exports = connectDB;
