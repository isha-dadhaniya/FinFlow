const express = require("express");
const router = express.Router();
const {
  getBudgetStatus,
  setBudget,
  deleteBudget,
  getBudgetHistory,
} = require("../controllers/budgetController");
const authMiddleware = require("../middleware/authMiddleware");

router.use(authMiddleware);

router.get("/", getBudgetStatus);
router.post("/", setBudget);
router.delete("/:id", deleteBudget);
router.get("/history", getBudgetHistory);

module.exports = router;
