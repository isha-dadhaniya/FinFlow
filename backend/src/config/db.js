const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    let uri = process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://127.0.0.1:27017/finflow";

    // Clean URI if it has quotes
    uri = uri.replace(/^["']|["']$/g, "").trim();

    // Mask password in logs
    const maskedUri = uri.replace(/\/\/([^:]+):([^@]+)@/, "//***:***@");
    console.log(`Connecting to MongoDB (${maskedUri})...`);

    // Ensure database name in Atlas connection string if omitted
    if (uri.startsWith("mongodb+srv://") && !uri.split("?")[0].split("/")[3]) {
      const [base, query] = uri.split("?");
      uri = `${base}/finflow${query ? `?${query}` : "?retryWrites=true&w=majority"}`;
    }

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log("🚀 MongoDB Connected Successfully!");
  } catch (error) {
    console.error("❌ MongoDB Connection Failed:", error.message);
    console.warn("⚠️ Ensure MONGODB_URI is set correctly in your environment variables.");
    console.warn("💡 If using MongoDB Atlas, make sure Network Access allows IP '0.0.0.0/0' (Allow access from anywhere).");
  }
};

module.exports = connectDB;
