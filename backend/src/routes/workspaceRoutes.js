const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  settlementController, familyGoalController,
  employeeController, departmentController, projectController,
  vendorController, reimbursementController,
} = require("../controllers/workspaceController");

// Settlements
router.get("/settlements", authMiddleware, settlementController.getAll);
router.post("/settlements", authMiddleware, settlementController.create);
router.put("/settlements/:id", authMiddleware, settlementController.update);
router.put("/settlements/:id/settle", authMiddleware, settlementController.markSettled);
router.delete("/settlements/:id", authMiddleware, settlementController.delete);

// Family Goals
router.get("/family-goals", authMiddleware, familyGoalController.getAll);
router.post("/family-goals", authMiddleware, familyGoalController.create);
router.put("/family-goals/:id", authMiddleware, familyGoalController.update);
router.post("/family-goals/:id/contribute", authMiddleware, familyGoalController.addContributor);
router.delete("/family-goals/:id", authMiddleware, familyGoalController.delete);

// Employees
router.get("/employees", authMiddleware, employeeController.getAll);
router.post("/employees", authMiddleware, employeeController.create);
router.put("/employees/:id", authMiddleware, employeeController.update);
router.delete("/employees/:id", authMiddleware, employeeController.delete);

// Departments
router.get("/departments", authMiddleware, departmentController.getAll);
router.post("/departments", authMiddleware, departmentController.create);
router.put("/departments/:id", authMiddleware, departmentController.update);
router.delete("/departments/:id", authMiddleware, departmentController.delete);

// Projects
router.get("/projects", authMiddleware, projectController.getAll);
router.post("/projects", authMiddleware, projectController.create);
// Project expense sub-routes (must be before generic :id routes in Express 5)
router.post("/projects/:id/expenses", authMiddleware, projectController.addExpense);
router.delete("/projects/:id/expenses/:expenseId", authMiddleware, projectController.deleteExpense);
router.put("/projects/:id", authMiddleware, projectController.update);
router.delete("/projects/:id", authMiddleware, projectController.delete);

// Vendors
router.get("/vendors", authMiddleware, vendorController.getAll);
router.post("/vendors", authMiddleware, vendorController.create);
router.put("/vendors/:id", authMiddleware, vendorController.update);
router.delete("/vendors/:id", authMiddleware, vendorController.delete);

// Reimbursements
router.get("/reimbursements", authMiddleware, reimbursementController.getAll);
router.post("/reimbursements", authMiddleware, reimbursementController.create);
router.put("/reimbursements/:id", authMiddleware, reimbursementController.update);
router.delete("/reimbursements/:id", authMiddleware, reimbursementController.delete);

module.exports = router;
