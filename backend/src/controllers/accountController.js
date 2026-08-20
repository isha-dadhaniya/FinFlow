const Account = require("../models/Account");

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
    const account = await Account.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!account) return res.status(404).json({ message: "Account not found" });
    res.json({ message: "Account deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getAccounts, createAccount, updateAccount, deleteAccount };
