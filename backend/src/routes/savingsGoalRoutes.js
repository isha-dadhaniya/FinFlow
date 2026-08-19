const express = require("express");
const router = express.Router();
const { getGoals, createGoal, updateGoal, deleteGoal, addContribution } = require("../controllers/savingsGoalController");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/", authMiddleware, getGoals);
router.post("/", authMiddleware, createGoal);
router.put("/:id", authMiddleware, updateGoal);
router.delete("/:id", authMiddleware, deleteGoal);
router.post("/:id/contribute", authMiddleware, addContribution);

module.exports = router;
