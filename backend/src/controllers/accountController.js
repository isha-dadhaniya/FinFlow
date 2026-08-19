const Account = require("../models/Account");

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

    const account = await Account.create({
      userId: req.user.id,
      bankName: bankName || "",
      accountHolderName: accountHolderName || "",
      accountNumber: accountNumber || "",
      ifscCode: ifscCode ? ifscCode.toUpperCase() : "",
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
