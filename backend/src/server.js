const path = require("path");
const dotenv = require("dotenv");

// Load environment variables before importing database configuration
dotenv.config({
  path: path.join(__dirname, "..", ".env"),
});

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const connectDB = require("./config/db");

// Route Imports
const authRoutes = require("./routes/authRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const expenseRoutes = require("./routes/expenseRoutes");
const budgetRoutes = require("./routes/budgetRoutes");
const familyRoutes = require("./routes/familyRoutes");
const businessRoutes = require("./routes/businessRoutes");
const groupRoutes = require("./routes/groupRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const userRoutes = require("./routes/userRoutes");

// Workspace Routes
const accountRoutes = require("./routes/accountRoutes");
const billRoutes = require("./routes/billRoutes");
const loanRoutes = require("./routes/loanRoutes");
const savingsGoalRoutes = require("./routes/savingsGoalRoutes");
const incomeRoutes = require("./routes/incomeRoutes");
const workspaceRoutes = require("./routes/workspaceRoutes");

// Initialize Express
const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/budgets", budgetRoutes);
app.use("/api/family", familyRoutes);
app.use("/api/business", businessRoutes);
app.use("/api/group", groupRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/user", userRoutes);

// Workspace API Routes
app.use("/api/accounts", accountRoutes);
app.use("/api/bills", billRoutes);
app.use("/api/loans", loanRoutes);
app.use("/api/savings-goals", savingsGoalRoutes);
app.use("/api/incomes", incomeRoutes);
app.use("/api/workspace", workspaceRoutes);

// Budget Isolation Debug Route
app.get("/api/debug/budgets", async (req, res) => {
  try {
    // Check whether MongoDB is connected
    if (
      mongoose.connection.readyState !== 1 ||
      !mongoose.connection.db
    ) {
      return res.status(503).json({
        success: false,
        error: "Database is not connected",
      });
    }

    const db = mongoose.connection.db;

    const all = await db
      .collection("budgets")
      .find({})
      .toArray();

    res.json({
      success: true,
      total: all.length,

      records: all.map((budget) => ({
        _id: budget._id,
        module: budget.module,
        category: budget.category,
        limitAmount: budget.limitAmount,
        month: budget.month,
        year: budget.year,
        userId: budget.userId,
      })),

      familyCount: all.filter(
        (budget) => budget.module === "family"
      ).length,

      personalCount: all.filter(
        (budget) => budget.module === "personal"
      ).length,

      noModuleCount: all.filter(
        (budget) => !budget.module
      ).length,
    });
  } catch (error) {
    console.error(
      "Budget debug route error:",
      error.message
    );

    res.status(500).json({
      success: false,
      error: "Failed to retrieve budget information",
    });
  }
});

// Root Health Route
app.get("/", (req, res) => {
  res.status(200).json({
    message: "FinFlow Unified Workspace Server is Running 🚀",
    status: "online",
    database:
      mongoose.connection.readyState === 1
        ? "connected"
        : "disconnected",
  });
});

// Health Check Route
app.get("/health", (req, res) => {
  const databaseConnected =
    mongoose.connection.readyState === 1;

  res.status(databaseConnected ? 200 : 503).json({
    status: databaseConnected ? "healthy" : "unhealthy",
    server: "running",
    database: databaseConnected
      ? "connected"
      : "disconnected",
  });
});

// Server Port
const PORT = process.env.PORT || 5000;

// Start Server After Database Connection
async function startServer() {
  try {
    console.log("Connecting to MongoDB...");

    await connectDB();

    console.log("MongoDB connection established.");

    const server = app.listen(PORT, "0.0.0.0", () => {
      console.log(
        `FinFlow server is running on port ${PORT}`
      );
    });

    // Handle unexpected server errors
    server.on("error", (error) => {
      console.error(
        "Server startup error:",
        error.message
      );

      process.exit(1);
    });

    // Handle graceful shutdown
    const shutdown = async (signal) => {
      console.log(`${signal} received. Shutting down...`);

      server.close(async () => {
        try {
          await mongoose.connection.close();
          console.log("MongoDB connection closed.");
          process.exit(0);
        } catch (error) {
          console.error(
            "Error closing MongoDB:",
            error.message
          );

          process.exit(1);
        }
      });
    };

    process.once("SIGTERM", () => shutdown("SIGTERM"));
    process.once("SIGINT", () => shutdown("SIGINT"));
  } catch (error) {
    console.error(
      "Failed to start FinFlow:",
      error.message
    );

    process.exit(1);
  }
}

// Start the application
startServer();
