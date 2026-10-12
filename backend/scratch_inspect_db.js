const mongoose = require("mongoose");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "../../backend/.env") });

const Transaction = require("../../backend/src/models/Transaction");
const Bill = require("../../backend/src/models/Bill");
const Expense = require("../../backend/src/models/Expense");
const SplitExpense = require("../../backend/src/models/SplitExpense");
const User = require("../../backend/src/models/User");

async function run() {
  await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/finflow");
  console.log("Connected to DB");

  const users = await User.find({}).lean();
  console.log("Users:", users.map(u => ({ id: u._id, email: u.email, name: u.fullName || u.name })));

  const txns = await Transaction.find({}).lean();
  console.log("ALL TRANSACTIONS in DB:", txns.map(t => ({ id: t._id, title: t.title, amount: t.amount, type: t.type, module: t.module, category: t.category })));

  const bills = await Bill.find({}).lean();
  console.log("ALL BILLS in DB:", bills.map(b => ({ id: b._id, name: b.name, amount: b.amount, status: b.status, workspace: b.workspace })));

  const expenses = await Expense.find({}).lean();
  console.log("ALL EXPENSES in DB:", expenses.map(e => ({ id: e._id, title: e.title, amount: e.amount, module: e.module })));

  const splits = await SplitExpense.find({}).lean();
  console.log("ALL SPLITS in DB:", splits.map(s => ({ id: s._id, title: s.title, amount: s.totalAmount })));

  await mongoose.disconnect();
}

run().catch(console.error);
