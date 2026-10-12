const Account = require("../models/Account");
const Transaction = require("../models/Transaction");
const mongoose = require("mongoose");

const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;

const getAccounts = async (req, res) => {
  try {
    const { workspace } = req.query;
    const filter = { userId: req.user.id };
    if (workspace) filter.workspace = workspace;
    const accounts = await Account.find(filter).sort({ createdAt: -1 });
    res.json(accounts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createAccount = async (req, res) => {
  try {
    const {
      bankName,
      accountHolderName,
      accountNumber,
      ifscCode,
      branchName,
      nickname,
      name,
      type,
      balance,
      openingBalance,
      workspace,
    } = req.body;

    const accountName = name || nickname || (bankName ? `${bankName} (${type || "Account"})` : "Bank Account");
    const accountBalance = balance !== undefined && balance !== "" ? Number(balance) : (Number(openingBalance) || 0);

    const cleanIfsc = (ifscCode || "").trim().toUpperCase();
    if (!cleanIfsc) {
      return res.status(400).json({ message: "IFSC Code is required (11 characters)" });
    }
    if (cleanIfsc.length !== 11 || !IFSC_REGEX.test(cleanIfsc)) {
      return res.status(400).json({ message: "Invalid IFSC Code. Must be exactly 11 characters (e.g. SBIN0001234)" });
    }

    if (accountNumber && !/^\d{8,16}$/.test(accountNumber.trim())) {
      return res.status(400).json({ message: "Account number must be between 8 and 16 digits" });
    }

    const account = await Account.create({
      userId: req.user.id,
      bankName: bankName || "",
      accountHolderName: accountHolderName || "",
      accountNumber: accountNumber ? accountNumber.trim() : "",
      ifscCode: cleanIfsc,
      branchName: branchName || "",
      nickname: nickname || "",
      name: accountName,
      type: type || "Savings",
      balance: accountBalance,
      openingBalance: Number(openingBalance) || accountBalance,
      workspace: workspace || "personal",
    });

    res.status(201).json(account);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateAccount = async (req, res) => {
  try {
    if (req.body.ifscCode !== undefined) {
      const cleanIfsc = (req.body.ifscCode || "").trim().toUpperCase();
      if (!cleanIfsc) {
        return res.status(400).json({ message: "IFSC Code is required (11 characters)" });
      }
      if (cleanIfsc.length !== 11 || !IFSC_REGEX.test(cleanIfsc)) {
        return res.status(400).json({ message: "Invalid IFSC Code. Must be exactly 11 characters (e.g. SBIN0001234)" });
      }
      req.body.ifscCode = cleanIfsc;
    }

    if (req.body.accountNumber && !/^\d{8,16}$/.test(req.body.accountNumber.trim())) {
      return res.status(400).json({ message: "Account number must be between 8 and 16 digits" });
    }

    const account = await Account.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      req.body,
      { new: true }
    );
    if (!account) return res.status(404).json({ message: "Account not found" });
    res.json(account);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteAccount = async (req, res) => {
  try {
    const account = await Account.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });
    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }
    res.json({ message: "Account deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const adjustAccountBalance = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, amount, category, title, reference, notes, date } = req.body;

    const numAmount = Number(amount);
    if (!numAmount || isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ message: "Please provide a valid positive amount." });
    }

    const isDeposit = type === "deposit" || type === "credit" || type === "add";
    const isWithdraw = type === "withdraw" || type === "debit" || type === "subtract";

    if (!isDeposit && !isWithdraw) {
      return res.status(400).json({ message: "Invalid transaction type. Must be 'deposit' or 'withdraw'." });
    }

    const account = await Account.findOne({ _id: id, userId: req.user.id });
    if (!account) {
      return res.status(404).json({ message: "Account not found." });
    }

    if (isWithdraw && (account.balance || 0) < numAmount) {
      return res.status(400).json({
        message: `Insufficient balance. Available book balance is ₹${(account.balance || 0).toLocaleString("en-IN")}, but attempting to withdraw ₹${numAmount.toLocaleString("en-IN")}.`,
      });
    }

    const balanceChange = isDeposit ? numAmount : -numAmount;
    account.balance = (account.balance || 0) + balanceChange;
    await account.save();

    // Create corresponding transaction
    const defaultTitle = isDeposit
      ? `Deposit to ${account.nickname || account.name || account.bankName}`
      : `Withdrawal from ${account.nickname || account.name || account.bankName}`;

    const defaultCategory = isDeposit ? (category || "Direct Deposit") : (category || "Direct Withdrawal");

    const noteParts = [];
    if (notes && notes.trim()) noteParts.push(notes.trim());
    if (reference && reference.trim()) noteParts.push(`Ref: ${reference.trim()}`);

    const transaction = await Transaction.create({
      userId: req.user.id,
      title: title && title.trim() ? title.trim() : defaultTitle,
      type: isDeposit ? "income" : "expense",
      amount: numAmount,
      category: defaultCategory,
      date: date ? new Date(date) : new Date(),
      paymentMethod: account.nickname || account.name || account.bankName,
      module: account.workspace || "business",
      status: "Completed",
      notes: noteParts.join(" | "),
    });

    res.status(200).json({
      message: `Successfully ${isDeposit ? "added ₹" : "deducted ₹"}${numAmount.toLocaleString("en-IN")} ${isDeposit ? "to" : "from"} ${account.name || account.bankName}`,
      account,
      transaction,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAccountTransactions = async (req, res) => {
  try {
    const { id } = req.params;
    const account = await Account.findOne({ _id: id, userId: req.user.id });
    if (!account) {
      return res.status(404).json({ message: "Account not found." });
    }

    // Match transactions that reference this account by name, nickname, or bankName
    const searchTerms = [
      account.name,
      account.nickname,
      account.bankName,
    ].filter(Boolean);

    const regexQuery = searchTerms.map((term) => new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));

    const transactions = await Transaction.find({
      userId: req.user.id,
      $or: [
        { paymentMethod: { $in: regexQuery } },
        { notes: { $in: regexQuery } },
        { title: { $in: regexQuery } },
      ],
    })
      .sort({ date: -1, createdAt: -1 })
      .limit(50);

    res.json({ account, transactions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAccounts,
  createAccount,
  updateAccount,
  deleteAccount,
  adjustAccountBalance,
  getAccountTransactions,
};
