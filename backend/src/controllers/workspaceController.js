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

// Extra: Add contributor to family goal
familyGoalController.addContributor = async (req, res) => {
  try {
    const goal = await FamilyGoal.findOne({ _id: req.params.id, userId: req.user.id });
    if (!goal) return res.status(404).json({ message: "Goal not found" });
    const { name, amount } = req.body;
    goal.contributors.push({ name, amount, date: new Date() });
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
