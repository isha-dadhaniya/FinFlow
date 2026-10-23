const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    console.log(`Connecting to MongoDB (${process.env.MONGO_URI || "mongodb://127.0.0.1:27017/finflow"})...`);
    await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/finflow", {
      serverSelectionTimeoutMS: 5000,
    });
    console.log("🚀 MongoDB Connected Successfully!");
  } catch (error) {
    console.error("❌ MongoDB Connection Failed:", error.message);
    console.warn("⚠️ Local MongoDB service is NOT running on your computer.");
    console.warn("💡 Solution A: Run 'net start MongoDB' in Admin Command Prompt / PowerShell.");
    console.warn("💡 Solution B: Or add your MongoDB Atlas Cloud URL into backend/.env file.");
  }
};

module.exports = connectDB;
