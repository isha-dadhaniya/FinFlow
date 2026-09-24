// Generic CRUD controller factory for simple workspace-scoped models
const createCrudController = (Model, resourceName) => {
  return {
    getAll: async (req, res) => {
      try {
        const filter = { userId: req.user.id };
        if (req.query.workspace) filter.workspace = req.query.workspace;
        if (req.query.status) filter.status = req.query.status;
        if (req.query.department) filter.department = req.query.department;
        const items = await Model.find(filter).sort({ createdAt: -1 });
        res.json(items);
      } catch (error) { res.status(500).json({ message: error.message }); }
    },
    create: async (req, res) => {
      try {
        const item = await Model.create({ ...req.body, userId: req.user.id });
        res.status(201).json(item);
      } catch (error) { res.status(500).json({ message: error.message }); }
    },
    update: async (req, res) => {
      try {
        const item = await Model.findOneAndUpdate(
          { _id: req.params.id, userId: req.user.id }, req.body, { new: true }
        );
        if (!item) return res.status(404).json({ message: `${resourceName} not found` });
        res.json(item);
      } catch (error) { res.status(500).json({ message: error.message }); }
    },
    delete: async (req, res) => {
      try {
        const item = await Model.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
        if (!item) return res.status(404).json({ message: `${resourceName} not found` });
        res.json({ message: `${resourceName} deleted` });
      } catch (error) { res.status(500).json({ message: error.message }); }
    },
  };
};

// Import models
const Settlement = require("../models/Settlement");
const FamilyGoal = require("../models/FamilyGoal");
const Employee = require("../models/Employee");
const Department = require("../models/Department");
const Project = require("../models/Project");
const Vendor = require("../models/Vendor");
const Reimbursement = require("../models/Reimbursement");

// Create controllers
const settlementController = createCrudController(Settlement, "Settlement");
const familyGoalController = createCrudController(FamilyGoal, "Family Goal");
const employeeController = createCrudController(Employee, "Employee");
const departmentController = createCrudController(Department, "Department");
const projectController = createCrudController(Project, "Project");
const vendorController = createCrudController(Vendor, "Vendor");
const reimbursementController = createCrudController(Reimbursement, "Reimbursement");

// Custom validation for Vendor: contact must be exactly 10 digits if provided
vendorController.create = async (req, res) => {
  try {
    const rawContact = req.body.contact ? String(req.body.contact).trim() : "";
    const cleanContact = rawContact.replace(/\D/g, "");

    if (rawContact && cleanContact.length !== 10) {
      return res.status(400).json({ message: "Contact number must be exactly 10 digits" });
    }

    const item = await Vendor.create({
      ...req.body,
      contact: cleanContact || rawContact,
      userId: req.user.id,
    });
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

vendorController.update = async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (updateData.contact !== undefined) {
      const rawContact = updateData.contact ? String(updateData.contact).trim() : "";
      const cleanContact = rawContact.replace(/\D/g, "");
      if (rawContact && cleanContact.length !== 10) {
        return res.status(400).json({ message: "Contact number must be exactly 10 digits" });
      }
      updateData.contact = cleanContact;
    }

    const item = await Vendor.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      updateData,
      { new: true, runValidators: true }
    );
    if (!item) return res.status(404).json({ message: "Vendor not found" });
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Extra: Mark settlement as settled
settlementController.markSettled = async (req, res) => {
  try {
    const item = await Settlement.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { status: "settled", settledDate: new Date() },
      { new: true }
    );
    if (!item) return res.status(404).json({ message: "Settlement not found" });
    res.json(item);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// Extra: Add contributor to family goal (with bank deduction & transaction sync)
const Account = require("../models/Account");
const Transaction = require("../models/Transaction");

familyGoalController.addContributor = async (req, res) => {
  try {
    const goal = await FamilyGoal.findOne({ _id: req.params.id, userId: req.user.id });
    if (!goal) return res.status(404).json({ message: "Goal not found" });

    const { name, amount, account, note } = req.body;
    const numAmount = Number(amount) || 0;

    let transaction = null;

    // If a bank account is selected, deduct balance and record transaction
    if (account && account.trim() !== "" && account !== "Manual / Cash (No deduction)") {
      await Account.findOneAndUpdate(
        { userId: req.user.id, name: account },
        { $inc: { balance: -numAmount } }
      );

      transaction = await Transaction.create({
        userId: req.user.id,
        title: `Deposit: ${goal.name}`,
        type: "expense",
        amount: numAmount,
        category: "Savings & Investments",
        date: new Date(),
        paymentMethod: account,
        module: "family",
        status: "Completed",
        notes: note ? `${note} (Family Goal: ${goal.name})` : `Family Goal deposit for "${goal.name}"`,
      });
    }

    goal.contributors.push({
      name: name || "",
      amount: numAmount,
      account: account || "",
      note: note || "",
      transactionId: transaction ? transaction._id : null,
      date: new Date(),
    });
    goal.currentAmount = goal.contributors.reduce((s, c) => s + c.amount, 0);
    await goal.save();
    res.json(goal);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

module.exports = {
  settlementController,
  familyGoalController,
  employeeController,
  departmentController,
  projectController,
  vendorController,
  reimbursementController,
};
