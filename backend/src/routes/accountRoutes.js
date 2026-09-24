const express = require("express");
const router = express.Router();
const {
  getAccounts,
  createAccount,
  updateAccount,
  deleteAccount,
  adjustAccountBalance,
  getAccountTransactions,
} = require("../controllers/accountController");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/", authMiddleware, getAccounts);
router.post("/", authMiddleware, createAccount);
router.put("/:id", authMiddleware, updateAccount);
router.delete("/:id", authMiddleware, deleteAccount);
router.post("/:id/adjust", authMiddleware, adjustAccountBalance);
router.get("/:id/transactions", authMiddleware, getAccountTransactions);

module.exports = router;
