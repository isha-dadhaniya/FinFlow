const path = require("path");
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const connectDB = require("./config/db");
// Server reloaded with updated family member schema

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

// New workspace routes
const accountRoutes = require("./routes/accountRoutes");
const billRoutes = require("./routes/billRoutes");
const loanRoutes = require("./routes/loanRoutes");
const savingsGoalRoutes = require("./routes/savingsGoalRoutes");
const incomeRoutes = require("./routes/incomeRoutes");
const workspaceRoutes = require("./routes/workspaceRoutes");

dotenv.config({ path: path.join(__dirname, "..", ".env") });

connectDB();

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// API Routes (existing)
app.use("/api/auth", authRoutes);
app.use("/auth", authRoutes);
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

// New workspace API routes
app.use("/api/accounts", accountRoutes);
app.use("/api/bills", billRoutes);
app.use("/api/loans", loanRoutes);
app.use("/api/savings-goals", savingsGoalRoutes);
app.use("/api/incomes", incomeRoutes);
app.use("/api/workspace", workspaceRoutes);

// Debug: budget isolation check
app.get("/api/debug/budgets", async (req, res) => {
  try {
    const mongoose = require("mongoose");
    const db = mongoose.connection.db;
    const all = await db.collection("budgets").find({}).toArray();
    res.json({
      total: all.length,
      records: all.map(b => ({ _id: b._id, module: b.module, category: b.category, limitAmount: b.limitAmount, month: b.month, year: b.year, userId: b.userId })),
      familyCount: all.filter(b => b.module === "family").length,
      personalCount: all.filter(b => b.module === "personal").length,
      noModuleCount: all.filter(b => !b.module).length,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Root Health Route — budget isolation v2 active
app.get("/", (req, res) => {
  res.json({ message: "FinFlow Unified Workspace Server is Running 🚀 (Budget isolation v2)", status: "online" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
