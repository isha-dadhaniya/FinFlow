const Transaction = require("../models/Transaction");
const Expense = require("../models/Expense");
const Income = require("../models/Income");
const SplitExpense = require("../models/SplitExpense");
const Loan = require("../models/Loan");
const Bill = require("../models/Bill");

const getDateKey = (d) => {
  if (!d) return "nodate";
  try {
    const dt = new Date(d);
    return isNaN(dt.getTime()) ? "nodate" : dt.toISOString().split("T")[0];
  } catch {
    return "nodate";
  }
};

const getTransactions = async (req, res) => {
  try {
    const { type, module, category, search, page = 1, limit = 100 } = req.query;
    const userId = req.user.id;

    // Inclusive module matching for Personal workspace (includes untagged/legacy records)
    const moduleFilter = (field) => {
      if (!module) return {};
      if (module === "personal") {
        return { [field]: { $in: ["personal", null, undefined, ""] } };
      }
      return { [field]: module };
    };

    // 1. Fetch transactions from Transaction model (Primary source of truth)
    const txnQuery = { userId, ...moduleFilter("module") };
    if (type) txnQuery.type = type;
    if (category) txnQuery.category = category;
    if (search) txnQuery.title = { $regex: search, $options: "i" };

    const txns = await Transaction.find(txnQuery).sort({ date: -1 }).lean();

    // 2. Fetch expenses from Expense model (Fallback for legacy entries)
    const expQuery = { userId, ...moduleFilter("module") };
    if (category) expQuery.category = category;
    if (search) expQuery.title = { $regex: search, $options: "i" };
    const expenses = await Expense.find(expQuery).sort({ date: -1 }).lean();

    // 3. Fetch incomes from Income model (Fallback for legacy entries)
    const incQuery = { userId, ...moduleFilter("workspace") };
    if (category) incQuery.category = category;
    if (search) incQuery.title = { $regex: search, $options: "i" };
    const incomes = await Income.find(incQuery).sort({ date: -1 }).lean();

    // 4. Fetch shared expenses (SplitExpense)
    const splits = module === "family" || !module ? await SplitExpense.find({ userId }).lean() : [];

    // 5. Fetch loans to extract all paid EMI installments
    const loans = await Loan.find({ userId, ...moduleFilter("workspace") }).lean();

    // 6. Fetch paid bills from Bill model
    const paidBills = await Bill.find({ userId, status: "paid", ...moduleFilter("workspace") }).lean();

    // Map expenses to standard transaction structure
    const expenseTxns = expenses.map((e) => ({
      _id: e._id.toString(),
      userId: e.userId,
      title: e.title || "Expense",
      type: "expense",
      amount: Number(e.amount) || 0,
      category: e.category || "General",
      date: e.date || e.createdAt || new Date(),
      paymentMethod: e.paymentMethod || "Bank Transfer",
      module: e.module || "personal",
      status: "Completed",
      notes: e.notes || "",
    }));

    // Map incomes to standard transaction structure
    const incomeTxns = incomes.map((i) => ({
      _id: i._id.toString(),
      userId: i.userId,
      title: i.title || "Income",
      type: "income",
      amount: Number(i.amount) || 0,
      category: i.source || i.category || "Salary",
      date: i.date || i.createdAt || new Date(),
      paymentMethod: i.account || "Bank Transfer",
      module: i.workspace || "personal",
      status: "Completed",
      notes: i.notes || "",
    }));

    // Map shared splits to standard transaction structure
    const splitTxns = splits.map((s) => ({
      _id: s._id.toString(),
      userId: s.userId,
      title: `Shared: ${s.title}`,
      type: "expense",
      amount: Number(s.totalAmount) || 0,
      category: s.category || "Family Shared",
      date: s.createdAt || new Date(),
      paymentMethod: "Group Split",
      module: "family",
      status: s.isSettled ? "Completed" : "Pending",
      notes: `Paid by ${s.paidBy}`,
    }));

    // Map paid EMI installments to standard transaction structure
    const emiTxns = [];
    loans.forEach((loan) => {
      if (Array.isArray(loan.emiSchedule)) {
        loan.emiSchedule.forEach((emi, idx) => {
          if (emi.status === "paid") {
            emiTxns.push({
              _id: `${loan._id}_emi_${idx}`,
              userId: loan.userId,
              title: `EMI Payment - ${loan.name} (#${idx + 1})`,
              type: "expense",
              amount: Number(emi.amount) || 0,
              category: "Loan EMI",
              date: emi.paidDate || emi.dueDate || new Date(),
              paymentMethod: loan.paymentAccount || "Bank Transfer",
              module: loan.workspace || "personal",
              status: "Completed",
              notes: `EMI Installment #${idx + 1} for ${loan.name} (${loan.lender || "Lender"})`,
            });
          }
        });
      }
    });

    // Map paid utility bills to standard transaction structure
    const billTxns = paidBills.map((b) => ({
      _id: `bill_${b._id.toString()}`,
      userId: b.userId,
      title: `Bill Payment - ${b.name}`,
      type: "expense",
      amount: Number(b.amount) || 0,
      category: b.category || "Bills & Utilities",
      date: b.updatedAt || b.dueDate || b.createdAt || new Date(),
      paymentMethod: b.account || "UPI / Bharat BillPay",
      module: b.workspace || "personal",
      status: "Completed",
      notes: `BBPS Utility Payment for ${b.name} (${b.frequency || "monthly"})`,
      isBillPayment: true,
    }));

    // Smart Normalized Deduplication Key Generator
    const getNormalizedKey = (item) => {
      const amount = Math.round(Number(item.amount) || 0);
      const type = item.type || "expense";
      const dateKey = getDateKey(item.date);
      const title = (item.title || "").toLowerCase().trim();
      const category = (item.category || "").toLowerCase().trim();

      // 1. Loan EMI identification & deduplication
      if (category === "loan emi" || /emi (auto-debit|payment)/i.test(title)) {
        const cleanLoanName = title
          .replace(/emi\s+(auto-debit|payment)\s*-\s*/gi, "")
          .replace(/\s*\(#\d+\)/gi, "")
          .trim();
        const instMatch = title.match(/#(\d+)/) || (item.notes || "").match(/#(\d+)/);
        const instNum = instMatch ? instMatch[1] : dateKey;
        return `loan_emi__${cleanLoanName}__${amount}__${instNum}`;
      }

      // 2. Bill Payment identification & deduplication
      if (item.isBillPayment || category === "bills & utilities" || /bill payment/i.test(title)) {
        const cleanBillName = title.replace(/bill payment\s*-\s*/gi, "").trim();
        return `bill_pay__${cleanBillName}__${amount}__${dateKey}`;
      }

      // 3. General Income & Expense
      return `gen__${title}__${amount}__${type}__${dateKey}`;
    };

    // Unified Deduplication Registry
    const seenMap = new Map();
    const resultList = [];

    // Helper to add item if not seen
    const addItemIfUnique = (item) => {
      const key = getNormalizedKey(item);
      if (!seenMap.has(key)) {
        seenMap.set(key, true);
        resultList.push(item);
      }
    };

    // 1. Primary Source: Native Transactions
    txns.forEach(addItemIfUnique);

    // 2. Fallback: Paid EMIs (only if not already recorded in Transactions)
    emiTxns.forEach(addItemIfUnique);

    // 3. Fallback: Paid Bills (only if not already recorded in Transactions)
    billTxns.forEach(addItemIfUnique);

    // 4. Fallback: Incomes (only if not already recorded in Transactions)
    incomeTxns.forEach(addItemIfUnique);

    // 5. Fallback: Expenses (only if not already recorded in Transactions)
    expenseTxns.forEach(addItemIfUnique);

    // 6. Fallback: Shared Splits (only if not already recorded in Transactions)
    splitTxns.forEach(addItemIfUnique);

    let combined = resultList;

    // Apply type filter if requested
    if (type && type !== "all") {
      combined = combined.filter((t) => t.type === type);
    }

    // Sort by date descending safely
    combined.sort((a, b) => {
      const dateA = new Date(a.date || a.createdAt || 0).getTime();
      const dateB = new Date(b.date || b.createdAt || 0).getTime();
      return dateB - dateA;
    });

    const totalCount = combined.length;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const paginated = combined.slice(skip, skip + parseInt(limit));

    res.status(200).json({
      transactions: paginated,
      totalCount,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalCount / parseInt(limit)) || 1,
    });
  } catch (error) {
    console.error("getTransactions error:", error);
    res.status(500).json({ message: error.message, transactions: [] });
  }
};

const createTransaction = async (req, res) => {
  try {
    const { title, type, amount, category, date, paymentMethod, module, notes } = req.body;
    const transaction = await Transaction.create({
      userId: req.user.id,
      title: title || "Transaction",
      type: type || "expense",
      amount: Number(amount) || 0,
      category: category || "General",
      date: date || new Date(),
      paymentMethod: paymentMethod || "Bank Transfer",
      module: module || "personal",
      status: "Completed",
      notes: notes || "",
    });

    // Also sync into Expense model if it is an expense
    if (type === "expense") {
      await Expense.create({
        userId: req.user.id,
        title: transaction.title,
        amount: transaction.amount,
        category: transaction.category,
        date: transaction.date,
        paymentMethod: transaction.paymentMethod,
        module: transaction.module,
        notes: transaction.notes,
      });
    }

    // Also sync into Income model if it is an income
    if (type === "income") {
      await Income.create({
        userId: req.user.id,
        title: transaction.title,
        amount: transaction.amount,
        source: transaction.category,
        category: transaction.category,
        date: transaction.date,
        account: transaction.paymentMethod,
        workspace: transaction.module,
        notes: transaction.notes,
      });
    }

    res.status(201).json(transaction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateTransaction = async (req, res) => {
  try {
    const { title, type, amount, category, date, paymentMethod, module, notes } = req.body;
    const transaction = await Transaction.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { title, type, amount: Number(amount) || 0, category, date, paymentMethod, module, notes },
      { new: true }
    );
    if (!transaction) return res.status(404).json({ message: "Transaction not found" });
    res.status(200).json(transaction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });
    if (!transaction) return res.status(404).json({ message: "Transaction not found" });
    res.status(200).json({ message: "Transaction deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
};
