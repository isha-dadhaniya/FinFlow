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

// Custom: Project create with expenseItems support
projectController.create = async (req, res) => {
  try {
    const data = { ...req.body, userId: req.user.id };
    if (Array.isArray(data.expenseItems) && data.expenseItems.length > 0) {
      data.expenses = data.expenseItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    }
    const item = await Project.create(data);
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Custom: Add expense to a project (deducts from remaining budget)
projectController.addExpense = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const projectId = req.params.id;

    if (!projectId) {
      return res.status(400).json({ message: "Project ID is required" });
    }

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });

    // Ensure authorization if project has a userId
    if (userId && project.userId && project.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Not authorized to modify this project" });
    }

    const { title, amount, category, date, notes } = req.body;
    const numAmount = Number(amount) || 0;
    if (numAmount <= 0) {
      return res.status(400).json({ message: "Amount must be greater than 0" });
    }

    if (!Array.isArray(project.expenseItems)) {
      project.expenseItems = [];
    }

    project.expenseItems.push({
      title: (title || "").trim() || "Project Expense",
      amount: numAmount,
      category: category || "General",
      date: date ? new Date(date) : new Date(),
      notes: (notes || "").trim(),
    });

    project.expenses = project.expenseItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

    if (userId && !project.userId) {
      project.userId = userId;
    }

    await project.save();
    return res.status(200).json(project);
  } catch (error) {
    console.error("projectController.addExpense error:", error);
    return res.status(500).json({ message: error.message || "Failed to add project expense" });
  }
};

// Custom: Delete a single expense from a project (refunds remaining budget)
projectController.deleteExpense = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    if (userId && project.userId && project.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Not authorized to modify this project" });
    }

    if (!Array.isArray(project.expenseItems)) {
      project.expenseItems = [];
    }

    const expenseIndex = project.expenseItems.findIndex(
      (item) => item._id && item._id.toString() === req.params.expenseId
    );
    if (expenseIndex === -1) {
      return res.status(404).json({ message: "Expense item not found" });
    }

    project.expenseItems.splice(expenseIndex, 1);
    project.expenses = project.expenseItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    await project.save();
    return res.status(200).json(project);
  } catch (error) {
    console.error("projectController.deleteExpense error:", error);
    return res.status(500).json({ message: error.message || "Failed to delete project expense" });
  }
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
