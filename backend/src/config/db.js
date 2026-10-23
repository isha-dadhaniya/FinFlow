const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    let mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://127.0.0.1:27017/finflow";

    // Strip invisible characters, smart quotes, straight quotes, and whitespace
    mongoUri = mongoUri
      .replace(/^[\uFEFF\u200B\u200C\u200D\s"'“”‘’]+|[\uFEFF\u200B\u200C\u200D\s"'“”‘’]+$/g, "")
      .trim();

    // Auto-fix if scheme was accidentally omitted or mangled
    if (!mongoUri.startsWith("mongodb://") && !mongoUri.startsWith("mongodb+srv://")) {
      console.warn(`⚠️ Warning: URI does not start with mongodb:// or mongodb+srv://. Found prefix: "${mongoUri.substring(0, 15)}"`);
      if (mongoUri.includes("mongodb.net") || mongoUri.includes("@")) {
        // Fix mangled scheme (e.g. "mongodb+srv//" or "cluster0...")
        const cleanBody = mongoUri.replace(/^(mongodb\+?s?r?v?:?\/*|http:?\/*|https:?\/*)?/, "");
        mongoUri = `mongodb+srv://${cleanBody}`;
        console.log(`🔧 Auto-corrected URI scheme to: mongodb+srv://${cleanBody.replace(/:[^@]+@/, ":***@")}`);
      }
    }

    const maskedLog = mongoUri.replace(/\/\/([^:]+):([^@]+)@/, "//$1:***@");
    console.log(`Connecting to MongoDB (${maskedLog})...`);

    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log("🚀 MongoDB Connected Successfully!");
  } catch (error) {
    console.error("❌ MongoDB Connection Failed:", error.message);
  }
};

module.exports = connectDB;
